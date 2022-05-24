import { TransactionType } from 'algosdk'
import IndexerClient from 'algosdk/dist/types/src/client/v2/indexer/indexer'
import { noteToArc69Payload } from '~/functions/asset'
import {
  AssetHolding,
  lookupAssetsOwnedByAccount,
  lookupTransactionsByAssetId,
  TransactionResult,
} from '~/functions/search'
import { NFT } from '~/models/nft'
import { ObjectCache } from './cache'
import { getTransactionsSentFrom } from './transactions'

interface LatestAssetTransactions {
  creation?: TransactionResult
  latestUpdate?: TransactionResult
}

export async function getAssetLastTransferTransaction(
  indexer: IndexerClient,
  assetId: number
): Promise<TransactionResult | undefined> {
  const transferTxns = await lookupTransactionsByAssetId(indexer, assetId, {
    txType: TransactionType.axfer,
    unitsGreaterThan: 0,
  })

  const results = transferTxns
    .filter((tx) => tx['confirmed-round'])
    .sort((a, b) => b['confirmed-round']! - a['confirmed-round']!)

  return results[0] ?? undefined
}

export async function getAssetLastConfigTransaction(
  indexer: IndexerClient,
  assetId: number
): Promise<TransactionResult | undefined> {
  const configTxns = await lookupTransactionsByAssetId(indexer, assetId, {
    txType: TransactionType.acfg,
  })

  const results = configTxns
    .filter((tx) => tx['confirmed-round'])
    .sort((a, b) => b['confirmed-round']! - a['confirmed-round']!)

  return results[0] ?? undefined
}

export async function getAssetsTransactionsSentFrom(
  cache: ObjectCache,
  indexer: IndexerClient,
  creatorAddress: string
): Promise<Map<number, LatestAssetTransactions>> {
  const configTrans = await getTransactionsSentFrom(cache, indexer, creatorAddress, TransactionType.acfg)

  let assetsTransactions = new Map<number, LatestAssetTransactions>()

  // update creation and updating

  for (const tx of configTrans) {
    const assetId = tx['created-asset-index'] ?? tx['asset-config-transaction']['asset-id']
    // find existing assetTransaction
    const { creation, latestUpdate } = assetsTransactions.get(assetId) || {}

    if (tx['created-asset-index'] != null) {
      assetsTransactions.set(assetId, { creation: tx, latestUpdate })
    } else if (latestUpdate == null || latestUpdate['confirmed-round']! < tx['confirmed-round']!) {
      assetsTransactions.set(assetId, { creation, latestUpdate: tx })
    }
  }

  return assetsTransactions
}

export async function getNFTsWithMetadata(
  cache: ObjectCache,
  indexer: IndexerClient,
  creatorAddress: string
): Promise<NFT[]> {
  const assetTransactions = await getAssetsTransactionsSentFrom(cache, indexer, creatorAddress)

  let nfts: NFT[] = []
  assetTransactions.forEach(({ creation, latestUpdate }, assetId) => {
    const updateParams = latestUpdate?.['asset-config-transaction']?.params

    if (creation == null) {
      console.warn(`Didn't find creation txn for ${assetId}, skipping`)
    } else if (updateParams != null && updateParams.manager == null) {
      // asset was deleted
    } else {
      const latestTxn = latestUpdate ?? creation
      const metadata = noteToArc69Payload(latestTxn.note)
      let params = creation['asset-config-transaction'].params
      if (updateParams != null) {
        // Only the following properties can be updated during a re-configure, and all must be specified
        // SEE https://developer.algorand.org/docs/get-details/transactions/#reconfigure-an-asset
        params.manager = updateParams.manager
        params.freeze = updateParams.freeze
        params.clawback = updateParams.clawback
        params.reserve = updateParams.reserve
      }
      nfts.push({
        asset: {
          index: assetId,
          deleted: false,
          'created-at-round': creation['confirmed-round']!,
          params: params,
        },
        metadata,
        rarity: undefined,
        creationTransaction: creation,
        latestConfigUpdateTransaction: latestUpdate,
      })
    }
  })
  return nfts
}

export async function getAssetsOwnedByAccount(
  cache: ObjectCache,
  indexer: IndexerClient,
  ownerAddress: string
): Promise<AssetHolding[]> {
  const cacheKey = `assets-owned-by-address-${ownerAddress}`
  console.time(`getAssetsOwnedByAccount:getAndCache: ${cacheKey}`)
  try {
    return await cache.getAndCache(
      cacheKey,
      async () => {
        console.time(`Retrieving assets owned by ${ownerAddress}`)
        try {
          return await lookupAssetsOwnedByAccount(indexer, ownerAddress, true)
        } finally {
          console.timeEnd(`Retrieving assets owned by ${ownerAddress}`)
        }
      },
      process.env.CACHE_TIMEOUT ? Number(process.env.CACHE_TIMEOUT) : 1 * 60,
      true
    )
  } finally {
    console.timeEnd(`getAssetsOwnedByAccount:getAndCache: ${cacheKey}`)
  }
}
