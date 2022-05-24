import * as React from 'react'
import { useState } from 'react'
import { json, LoaderFunction, MetaFunction, useLoaderData } from 'remix'
import Overlay from '~/components/overlay'
import { Property, PropertyPanel } from '~/components/propertyPanel'
import { getAlgoClient, getIndexerClient } from '~/functions/algo-client'
import { getAssetLastTransferTransaction } from '~/functions/asset-search'
import { decorateWithRarity, getNFTs } from '~/functions/nfts'
import { TransactionResult } from '~/functions/search'
import { NFT } from '~/models/nft'
import { tryParseInt } from '~/utils/utils'

export type NFTDetailsLoaderData = {
  nft: NFT
  salesInfo: NFTSaleInfo
  lastTransferTransaction?: TransactionResult | undefined
}

type NFTDetailsError = {
  requestedAssetId: string | undefined
  errorMessage: string
}

export type NFTSaleInfo = {
  currentOwnerAddress: string
}

export let meta: MetaFunction = () => {
  return {
    title: 'NFT',
  }
}

export const loader: LoaderFunction = async ({ params }): Promise<Response> => {
  function makeErrorResponse(statusCode: number, message: string) {
    console.log(`NFT loader function returning error code = ${statusCode} due to "${message}"`)
    const data: NFTDetailsError = {
      requestedAssetId: params.id,
      errorMessage: message,
    }
    return json(data, { status: statusCode })
  }

  const assetIndex = tryParseInt(params.id)
  if (!assetIndex) {
    return makeErrorResponse(404, `Invalid asset ID`)
  }

  const client = getAlgoClient()
  const asset = await client.getAssetByID(assetIndex).do()

  let nfts = await getNFTs(asset.params.creator)
  nfts = decorateWithRarity(nfts)

  const nft = nfts.find((a) => a.asset.index === assetIndex)
  if (!nft) {
    return makeErrorResponse(404, `Asset with ID ${assetIndex} not found`)
  }

  // get the last transfer transaction
  const indexer = getIndexerClient()
  const lastTransferTransaction = await getAssetLastTransferTransaction(indexer, assetIndex)
  const currentOwnerAddress =
    lastTransferTransaction?.['asset-transfer-transaction']?.receiver ?? nft.asset.params.creator

  const data: NFTDetailsLoaderData = {
    nft: nft,
    lastTransferTransaction,
    salesInfo: {
      currentOwnerAddress,
    },
  }

  return json(data)
}

export default function Index() {
  const response = useLoaderData<NFTDetailsLoaderData | NFTDetailsError>()

  if ('errorMessage' in response) {
    return (
      <p>
        Invalid NFT {response.requestedAssetId ?? ''}: {response.errorMessage}.
      </p>
    )
  }

  const { nft, salesInfo, lastTransferTransaction } = response
  const [openOverlay, setOpenOverlay] = useState(false)

  const properties = Object.keys(nft?.metadata || {})
    .filter((property) => property !== 'properties')
    .map(
      (property) =>
        ({
          property: property,
          value: (nft?.metadata as any)?.[property],
        } as Property)
    )

  const metadataProperties: Property[] = [
    ...properties,
    {
      property: 'NFT rarity',
      value: nft.rarity?.score,
      type: 'percentage',
      title: 'Rarity %',
    },
  ]

  const traits: Property[] = nft.metadata?.properties
    ? Object.keys(nft.metadata?.properties).map((trait) => ({
        property: trait,
        value: nft.metadata!.properties![trait],
      }))
    : []

  const algorandProperties: Property[] = [
    {
      property: 'Asset ID',
      value: `${nft.asset.index}`,
      displayValue: `${nft.asset.index}`,
      type: 'algorand-asset',
    },
    {
      property: 'Asset Name',
      value: `${nft.asset.index}`,
      displayValue: `${nft.asset.params.name}`,
      type: 'algorand-asset',
    },
    {
      property: 'Asset unit',
      value: nft.asset.params['unit-name'],
    },
    {
      property: 'Asset URL',
      value: nft.asset.params.url,
      link: nft.asset.params.url,
    },
    {
      property: 'Total supply',
      value: `${nft.asset.params.total} ${nft.asset.params['unit-name']}`,
    },
    {
      property: 'Owner account',
      value: salesInfo?.currentOwnerAddress,
      type: 'algorand-address',
    },
    {
      property: 'Creator account',
      value: nft.asset.params.creator,
      type: 'algorand-address',
    },
    {
      property: 'Manager account',
      value: nft.asset.params.manager,
      type: 'algorand-address',
    },
    {
      property: 'Reserve account',
      value: nft.asset.params.reserve,
      type: 'algorand-address',
    },
    {
      property: 'Freeze account',
      value: nft.asset.params.freeze,
      type: 'algorand-address',
    },
    {
      property: 'Clawback account',
      value: nft.asset.params.clawback,
      type: 'algorand-address',
    },
    {
      property: 'Creation transaction',
      value: nft.creationTransaction?.id,
      type: 'algorand-transaction',
    },
    {
      property: 'Created round',
      value: nft.creationTransaction?.['confirmed-round'],
      type: 'algorand-block',
    },
    {
      property: 'Created at',
      value: nft.creationTransaction?.['round-time'],
      type: 'date',
    },
    {
      property: 'Last modified transaction',
      value: nft.latestConfigUpdateTransaction?.id,
      type: 'algorand-transaction',
    },
    {
      property: 'Last modified round',
      value: nft.latestConfigUpdateTransaction?.['confirmed-round'],
      type: 'algorand-block',
    },
    {
      property: 'Modified at',
      value: nft.latestConfigUpdateTransaction?.['round-time'],
      type: 'date',
    },
    {
      property: 'Last transfer transaction',
      value: lastTransferTransaction?.id,
      type: 'algorand-transaction',
    },
    {
      property: 'Last transfer round',
      value: lastTransferTransaction?.['confirmed-round'],
      type: 'algorand-block',
    },
    {
      property: 'Transferred at',
      value: lastTransferTransaction?.['round-time'],
      type: 'date',
    },
  ]
  return (
    <>
      <h1 className="sm:hidden">{nft.asset.params.name}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-12 sm:gap-10">
        <div className="column col-span-1 sm:col-span-4 text-center">
          <a
            className="link"
            onClick={() => {
              setOpenOverlay(true)
            }}
          >
            <img
              src={nft.asset.params.url?.replace('ipfs://', 'https://ipfs.infura.io/ipfs/')}
              alt={nft.asset.params.name}
              className="w-full cursor-zoom-in"
              title="Click to enlarge"
            />
          </a>
          <Overlay
            onClose={() => {
              setOpenOverlay(false)
            }}
            openOverlay={openOverlay}
            innerComponent={
              <img
                src={nft.asset.params.url?.replace('ipfs://', 'https://ipfs.infura.io/ipfs/')}
                alt={nft.asset.params.name}
              />
            }
          />
        </div>
        <div className="column col-span-1 sm:col-span-8">
          <PropertyPanel
            first={true}
            heading={
              <>
                <h1 className="hidden sm:inline-block mt-0">{nft.asset.params.name}</h1>

                <p>{nft.metadata?.description}</p>
              </>
            }
            properties={[]}
          />

          <PropertyPanel heading={<h2>Metadata</h2>} properties={metadataProperties} />

          <PropertyPanel heading={<h2>Traits</h2>} properties={traits} />

          <PropertyPanel
            heading={
              <h2>
                Algorand <abbr title="Non-Fungible Token">NFT</abbr> Properties
              </h2>
            }
            properties={algorandProperties}
          />
        </div>
      </div>
    </>
  )
}
