import path from 'path'
import { NFT } from '~/models/nft'
import { unique } from '~/utils/utils'
import { getIndexerClient } from './algo-client'
import { getNFTsWithMetadata } from './asset-search'
import { FileSystemObjectCache } from './cache'
import { calculateRarityForAssets, getTraitUniqueValuesWithNumbers } from './rarity'

const cache = new FileSystemObjectCache(path.join(__dirname, '../../../.cache'))

export async function getNFTs(creatorAddress: string, options?: { newestFirst?: boolean }): Promise<NFT[]> {
  const indexer = getIndexerClient()

  console.log(`getNFTs: Getting NFTs minted by account ${creatorAddress}`)

  let nfts: NFT[]
  try {
    nfts = (await getNFTsWithMetadata(cache, indexer, creatorAddress)).filter((a) => a.asset.params.url)

    if (options === undefined || !options.newestFirst) {
      nfts = nfts.sort((a, b) => a.creationTransaction!['round-time']! - b.creationTransaction!['round-time']!)
    } else {
      nfts = nfts.sort((a, b) => b.creationTransaction!['round-time']! - a.creationTransaction!['round-time']!)
    }

    console.log(`getNFTs: Returning ${nfts.length} NFTs`)
  } catch (error) {
    nfts = []
    console.error(`getNFTs: ${error}`)
  }

  return nfts
}

export function decorateWithRarity(nfts: NFT[]): NFT[] {
  const allTraits = unique(nfts.flatMap((nft) => Object.keys(nft.metadata?.properties || {})))
  const traitValueCounts: Record<string, Map<string, number>> = {}
  allTraits.forEach((t) => {
    traitValueCounts[t] = getTraitUniqueValuesWithNumbers(nfts, t)
  })
  return calculateRarityForAssets(nfts, traitValueCounts)
}
