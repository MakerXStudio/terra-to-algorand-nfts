import { getRarityScore, NFT } from '~/models/nft'
import { unique } from '~/utils/utils'

export function getTraitUniqueValues(collection: NFT[], traitName: string): any[] {
  return [...new Set(collection.map((item) => item.metadata?.properties?.[traitName]))].sort((a1, a2) => {
    return a1!.localeCompare(a2!)
  })
}

export function getTraitUniqueValuesWithNumbers(collection: NFT[], traitName: string): Map<string, number> {
  // how many NFTs has this traits
  let uniqueValuesWithCounter: Map<string, number> = new Map()

  const uniqueTraitValues = unique(
    collection.map((nft) => nft.metadata?.properties?.[traitName]).filter((v) => !!v)
  ) as string[]

  uniqueTraitValues.forEach((value) => {
    const length = collection.filter(function (item) {
      if (item?.metadata?.properties?.[traitName] === value) return 1
    }).length

    uniqueValuesWithCounter.set(value, length)
  })

  return uniqueValuesWithCounter!
}

// now add rarity to assets
// warning-hard coded to properties.class for now.
export function calculateRarityForAssets(
  nfts: NFT[],
  uniqueTraitsWithValues: Record<string, Map<string, number>>
): NFT[] {
  const collectionSize = nfts.length
  nfts.forEach((nft) => {
    const traitsMap = new Map<string, number>()
    Object.keys(uniqueTraitsWithValues).forEach((trait) => {
      if (nft.metadata?.properties?.[trait]) {
        traitsMap.set(trait, uniqueTraitsWithValues[trait].get(nft.metadata?.properties[trait])! / collectionSize)
      } else {
        traitsMap.set(trait, 0)
      }
    })
    nft.rarity = {
      traits: traitsMap,
      score: Math.round(getRarityScore(traitsMap) * 100),
      rank: 0,
    }
  })

  return nfts
}
