import { Account, Algodv2 } from 'algosdk'
import IndexerClient from 'algosdk/dist/types/src/client/v2/indexer/indexer'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import { CREATOR_ACCOUNT } from './constants'
import { getAccount } from './functions/account'
import { chunkArray } from './functions/array'
import {
  Arc69Metadata,
  CreateAssetParamsBase,
  createNonFungibleToken,
  getExistingAssets,
  MediaType,
} from './functions/asset'
import { FileSystemObjectCache } from './functions/cache'
import { getAlgoClient, getIndexerClient } from './functions/client'
import { handleError } from './functions/error'
import { AssetResult } from './functions/search'
import { sendGroupOfTransactions } from './functions/transaction'

/*********************************/
/**** Terra metadata - edit this */
/*********************************/
const contractId = 'terra1h6msx3t0qj7fuhssyqc44g20qwwyz35zqel96l'
const mutableMetadata = false
const mediaType = MediaType.Image
const getUnitName = (contract: TerraContract) => {
  return contract.result.init_msg.symbol.replace('TALIS_', '')
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
    const cache = new FileSystemObjectCache(path.join(__dirname, '.cache'))

    const contractInfo = await getTerraContractInfo(contractId)

    console.log(`Migrating NFTs for ${contractInfo.result.init_msg.name}`)

    const unitName = getUnitName(contractInfo)

    const accountInformation = await client.accountInformation(creatorAccount.addr).do()
    const existingAlgorandNFTs = (accountInformation['created-assets'] as AssetResult[]).filter(
      (a) => a.params['unit-name'] === unitName
    )

    console.log(`Found ${existingAlgorandNFTs.length} existing NFTs already minted on Algorand`)

    const existingTerraNFTs = await cache.getAndCache(
      `terraNFTs-${contractId}`,
      (_existing: NFT[] | undefined) => getAllTerraNFTs(contractId),
      undefined,
      true
    )
    console.log(`Found ${existingTerraNFTs.length} existing NFTs from Terra`)

    const diff = existingTerraNFTs.filter(
      (nft) => existingAlgorandNFTs.filter((algoNFT) => algoNFT.params.name === nft.name).length === 0
    )
    console.log(`Determined there are ${diff.length} NFTs left to mint`)

    console.log(`Minting in batches of 16 at a time`)
    const batches = chunkArray(diff, 16)
    for (let batch of batches) {
      const txns = await Promise.all(
        batch.map(
          async (nft) => await getAlgorandNFTTransaction(client, creatorAccount, nft, unitName, mutableMetadata)
        )
      )

      const result = await sendGroupOfTransactions(
        client,
        txns.map((txn) => ({
          transaction: txn,
          signer: creatorAccount,
        }))
      )

      console.log(
        `Submitted ${batch.length} creation transactions with transaction group ID ${result.txId} in round ${
          result.confirmation?.['confirmed-round']
        } for NFTs: ${batch.map((b) => b.name).join(', ')}`
      )
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

interface NFT {
  tokenId: string
  name: string
  imageUrl: string
  externalUrl?: string
  description?: string
  traits?: Record<string, string>
}

async function getAllTerraNFTs(contractId: string) {
  const nfts: NFT[] = []
  let startAfter: string | undefined = undefined

  while (true) {
    const existingTerraNFTs: TerraNFTs = await getTerraNFTs(contractId, startAfter)
    console.debug(`Retrieved the next ${existingTerraNFTs.result.tokens.length} NFTs from Terra...`)

    if (existingTerraNFTs.result.tokens.length === 0) {
      break
    }

    const nftPromises = existingTerraNFTs.result.tokens.map(async (token) => {
      let nft: NFT

      if (typeof token !== 'string') {
        const metadataRequest = await fetch(token.metadata_uri)
        const response = (await metadataRequest.json()) as { title: string; description?: string; media: string }
        nft = {
          tokenId: token.token_id,
          name: response.title,
          description: response.description,
          imageUrl: response.media.replace('https://ipfs.talis.art/ipfs/', 'ipfs://'),
          externalUrl: token.metadata_uri.replace('https://ipfs.talis.art/ipfs/', 'ipfs://'),
          //traits: ???
        }
      } else {
        const nftInfoResponse = await getTerraNFT(contractId, token)
        if ('error' in nftInfoResponse) {
          throw new Error((nftInfoResponse as any).error)
        }
        if (!('extension' in nftInfoResponse.result)) {
          throw new Error(
            `NFT Info response for ${token} isn't in CW721 format; got ${JSON.stringify(nftInfoResponse)}`
          )
        }

        const properties: Record<string, string> = {}
        if (nftInfoResponse.result.extension.attributes) {
          nftInfoResponse.result.extension.attributes.forEach((a) => {
            properties[a.trait_type] = a.value
          })
        }

        nft = {
          tokenId: token,
          name: nftInfoResponse.result.extension.name,
          imageUrl: nftInfoResponse.result.extension.image,
          description: nftInfoResponse.result.extension.description || undefined,
          externalUrl: nftInfoResponse.result.extension.external_url || undefined,
          traits: properties,
        }
      }

      console.debug(`Retrieved Terra NFT ${nft.name} (${nft.tokenId})`)

      return nft
    })

    const nextNFTs = await Promise.all(nftPromises)
    nfts.push(...nextNFTs)
    startAfter = nfts[nfts.length - 1].tokenId
  }

  return nfts
}

type TerraNFTsItem =
  | string
  | {
      metadata_uri: string
      owner: string
      token_id: string
    }

interface TerraNFTs {
  result: {
    tokens: TerraNFTsItem[]
  }
}

async function getTerraNFTs(contractId: string, startAfter?: string): Promise<TerraNFTs> {
  const allTokensQuery = { all_tokens: { limit: 30, start_after: startAfter } }
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

async function getAlgorandNFTTransaction(
  client: Algodv2,
  creatorAccount: Account,
  nft: NFT,
  unitName: string,
  mutableMetadata: boolean
) {
  let mintParameters: CreateAssetParamsBase
  mintParameters = {
    assetName: nft.name,
    unitName: unitName,
    creator: creatorAccount,
    managerAddress: mutableMetadata ? creatorAccount.addr : undefined,
    url: nft.imageUrl,
    arc69Metadata: {
      ...({
        mediaType: mediaType,
        description: nft.description,
        externalUrl: nft.externalUrl,
        properties: nft.traits,
      } as Arc69Metadata),
      ...{ terraTokenId: nft.tokenId },
    } as any,
    skipSending: true,
    note: `Migration via the Terra -> Algorand NFT migration service. Original token ID: ${nft.tokenId}`,
  }

  // Create NFT
  const { transaction } = await createNonFungibleToken(mintParameters, client)
  return transaction
}

async function createAlgorandNFT(
  client: Algodv2,
  indexer: IndexerClient,
  creatorAccount: Account,
  existingTokenId: string,
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
      arc69Metadata: { ...metadata, terraTokenId: existingTokenId } as any,
    }

    // Create NFT
    const { transaction, confirmation } = await createNonFungibleToken(mintParameters, client)
    const assetIndex = confirmation!['asset-index']!
    const txID = transaction.txID()
    console.log(`${name} -> asset #${assetIndex} (TX: ${txID})`)
  }
}
