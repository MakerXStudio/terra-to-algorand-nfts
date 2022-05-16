import { Account, Algodv2 } from 'algosdk'
import IndexerClient from 'algosdk/dist/types/src/client/v2/indexer/indexer'
import fs from 'fs'
import fetch from 'node-fetch'
import { CREATOR_ACCOUNT } from './constants'
import { getAccount } from './functions/account'
import {
  Arc69Metadata,
  CreateAssetParamsBase,
  createNonFungibleToken,
  getExistingAssets,
  MediaType,
} from './functions/asset'
import { getAlgoClient, getIndexerClient } from './functions/client'
import { handleError } from './functions/error'

/*********************************/
/**** Terra metadata - edit this */
/*********************************/
const contractId = 'terra1h6msx3t0qj7fuhssyqc44g20qwwyz35zqel96l'

const getAlgorandMetadata = (nft: TerraNFT, contract: TerraContract) => {
  const properties: Record<string, string> = {}
  if (nft.result.extension.attributes) {
    nft.result.extension.attributes.forEach((a) => {
      properties[a.trait_type] = a.value
    })
  }

  return {
    mutableMetadata: false,
    name: nft.result.extension.name,
    unitName: contract.result.init_msg.symbol.replace('TALIS_', ''),
    mediaType: MediaType.Image,
    url: nft.result.extension.image,
    description: nft.result.extension.description || undefined,
    externalUrl: nft.result.extension.external_url || undefined,
    properties: properties,
  }
}
/**** End of Terra metadata ******/
/*********************************/

if (!fs.existsSync('.env') && !process.env.ALGOD_SERVER) {
  console.error('Copy .env.sample to .env before starting the application.')
  process.exit(1)
}
;(async () => {
  try {
    const client = await getAlgoClient()
    const indexer = await getIndexerClient()
    const creatorAccount = await getAccount(client, CREATOR_ACCOUNT)

    const contractInfo = await getTerraContractInfo(contractId)

    console.log(`Migrating NFTs for ${contractInfo.result.init_msg.name}`)

    let startAfter: string | undefined = undefined

    while (true) {
      const existingNFTs = await getTerraNFTs(contractId, startAfter)
      console.log(`Retrieved the next ${existingNFTs.result.tokens.length} NFTs from Terra...`)

      if (existingNFTs.result.tokens.length === 0) {
        break
      }

      for (let token of existingNFTs.result.tokens) {
        let nftInfoResponse: TerraNFT
        if (typeof token !== 'string') {
          const metadataRequest = await fetch(token.metadata_uri)
          const response = (await metadataRequest.json()) as { title: string; description?: string; media: string }
          nftInfoResponse = {
            result: {
              token_uri: token.metadata_uri,
              extension: {
                name: response.title,
                description: response.description,
                image: response.media.replace('https://ipfs.talis.art/ipfs/', 'ipfs://'),
              },
            },
          }
        } else {
          nftInfoResponse = await getTerraNFT(contractId, token)
          if ('error' in nftInfoResponse) {
            console.error((nftInfoResponse as any).error)
            process.exit(1)
          }
          console.log(`Found ${nftInfoResponse.result.extension.name}; attempting to convert to Algorand NFT...`)
        }

        const m = getAlgorandMetadata(nftInfoResponse, contractInfo)

        // Careful: There is a 1000 byte limit for the JSON version of this structure
        const metadata: Arc69Metadata = {
          mediaType: m.mediaType,
          description: m.description,
          externalUrl: m.externalUrl,
          properties: m.properties,
        }

        await createAlgorandNFT(client, indexer, creatorAccount, m.name, m.unitName, m.url, metadata, m.mutableMetadata)
      }

      const lastToken = existingNFTs.result.tokens[existingNFTs.result.tokens.length - 1]
      if (typeof lastToken === 'string') {
        startAfter = lastToken
      } else {
        startAfter = lastToken.token_id
      }
    }

    console.log('---')
    console.log('---')
    console.log('---')
    console.log('---')

    console.log(
      `All minted! If you are minting against MainNet check out https://www.nftexplorer.app/collection?creator=${creatorAccount.addr} to see your NFT collection.`
    )
    console.log('---')
    console.log(
      'Next step is to collect Algorand addresses for every Terra NFT holder so you can transfer their NFT(s) to them, noting they will have to opt-in to those assets first. A useful tool to guide them through that process is you can create a transfer via https://swapper.tools/. If you have hundreds or thousands of NFTs you might want to come up with a more programmatic option. If you want to get help with such a solution feel free to reach out to cto@makerx.com.au.'
    )
  } catch (error) {
    handleError(error)
    process.exit(1)
  }
})()

interface TerraContract {
  height: string
  result: {
    address: string
    creator: string
    code_id: string
    init_msg: {
      name: string
      symbol: string
      minter: string
    }
  }
}

async function getTerraContractInfo(contractId: string): Promise<TerraContract> {
  const contractInfoRequest = await fetch(`https://fcd.terra.dev/wasm/contracts/${contractId}`)
  return await contractInfoRequest.json()
}

async function getTerraNFTs(
  contractId: string,
  startAfter?: string
): Promise<{
  result: {
    tokens: (
      | string
      | {
          metadata_uri: string
          owner: string
          token_id: string
        }
    )[]
  }
}> {
  const allTokensQuery = { all_tokens: { limit: 10, start_after: startAfter } }
  const allTokensRequest = await fetch(
    `https://fcd.terra.dev/wasm/contracts/${contractId}/store?query_msg=${encodeURIComponent(
      JSON.stringify(allTokensQuery)
    )}`
  )
  return await allTokensRequest.json()
}

interface TerraNFT {
  height?: string
  result: {
    token_uri: string
    extension: {
      image: string
      image_data?: null
      external_url?: null | string
      name: string
      description?: string
      attributes?: { display_type: null; trait_type: string; value: string }[]
    }
  }
}

async function getTerraNFT(contractId: string, tokenId: string): Promise<TerraNFT> {
  const nftInfoQuery = { nft_info: { token_id: tokenId } }
  const nftInfoRequest = await fetch(
    `https://fcd.terra.dev/wasm/contracts/${contractId}/store?query_msg=${encodeURIComponent(
      JSON.stringify(nftInfoQuery)
    )}`
  )
  return await nftInfoRequest.json()
}

async function createAlgorandNFT(
  client: Algodv2,
  indexer: IndexerClient,
  creatorAccount: Account,
  name: string,
  unitName: string,
  url: string,
  metadata: Arc69Metadata,
  mutableMetadata: boolean
) {
  const existingAssets = await getExistingAssets(creatorAccount, [name], indexer)
  if (existingAssets.length > 0) {
    const existingAsset = existingAssets[0]
    console.log(`Found existing asset #${existingAsset.asset.index} ${existingAsset.asset.params.name}; skipping...`)
  } else {
    let mintParameters: CreateAssetParamsBase
    mintParameters = {
      assetName: name,
      unitName: unitName,
      creator: creatorAccount,
      managerAddress: mutableMetadata ? creatorAccount.addr : undefined,
      url: url,
      arc69Metadata: metadata,
    }

    // Create NFT
    const { transaction, confirmation } = await createNonFungibleToken(mintParameters, client)
    const assetIndex = confirmation!['asset-index']!
    const txID = transaction.txID()
    console.log(`${name} -> asset #${assetIndex} (TX: ${txID})`)
  }
}
