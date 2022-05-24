import { TransactionType } from 'algosdk'
import IndexerClient from 'algosdk/dist/types/src/client/v2/indexer/indexer'
import { ObjectCache } from './cache'
import { lookupTransactionsByAddressWithPagination, TransactionResult } from './search'

export async function getTransactionsSentFrom(
  cache: ObjectCache,
  indexer: IndexerClient,
  senderAddress: string,
  transactionType: TransactionType
): Promise<TransactionResult[]> {
  const tranType = transactionType.toString()
  const cacheKey = `${tranType}-transactions-sent-from-${senderAddress}`
  console.time(`get${tranType}TransactionsSentFrom:getAndCache: ${cacheKey}`)
  try {
    return await cache.getAndCache(
      cacheKey,
      async (existing: TransactionResult[] | undefined) => {
        console.time(`Retrieving latest ${tranType} transactions for ${senderAddress}`)
        let confirmedNewTransactions: TransactionResult[]
        try {
          // round after most recent confirmed round on cached assets, or start at 1 (round 0 will never have transactions)
          const minRound = 1 + (!existing ? 0 : existing[existing.length - 1]['confirmed-round'] ?? 0)
          const newTransactions = await lookupTransactionsByAddressWithPagination(
            indexer,
            senderAddress,
            'sender',
            transactionType,
            minRound
          )
          confirmedNewTransactions = newTransactions
            .filter((t) => !!t[`confirmed-round`])
            .sort(function (t1, t2) {
              return t1['confirmed-round']! - t2['confirmed-round']!
            })
        } finally {
          console.timeEnd(`Retrieving latest ${tranType} transactions for ${senderAddress}`)
        }
        return [...(existing || []), ...confirmedNewTransactions]
      },
      process.env.CACHE_TIMEOUT ? Number(process.env.CACHE_TIMEOUT) : 15 * 60,
      true
    )
  } finally {
    console.timeEnd(`get${tranType}TransactionsSentFrom:getAndCache: ${cacheKey}`)
  }
}
