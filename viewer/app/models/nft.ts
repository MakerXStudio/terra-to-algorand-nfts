import { Arc69Payload } from '~/functions/asset'
import { AssetResult, TransactionResult } from '~/functions/search'

export type NFT = {
  asset: AssetResult
  rarity: Rarity | undefined
  metadata: Arc69Payload | undefined
  creationTransaction: TransactionResult
  latestConfigUpdateTransaction: TransactionResult | undefined
}

export type Rarity = {
  traits: Map<string, number>
  score: number
  rank: number
}

export function getRarityScore(traits: Map<string, number>): number {
  let score: number = 0
  traits.forEach((traitValue) => {
    score = score + traitValue
  })

  return score
}
