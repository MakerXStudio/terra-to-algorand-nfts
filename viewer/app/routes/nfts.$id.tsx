import * as React from 'react'
import { LoaderFunction, useLoaderData } from 'remix'
import PaginatedNFTTileList from '~/components/paginatedNFTsTileList'
import { getNFTs } from '~/functions/nfts'
import { NFT } from '~/models/nft'

interface LoaderData {
  assets: NFT[]
}

export const loader: LoaderFunction = async ({ params }): Promise<LoaderData> => {
  const creatorAddress = params.id!
  const assets = await getNFTs(creatorAddress)
  return {
    assets: assets,
  }
}

export default function Index() {
  const { assets } = useLoaderData<LoaderData>()

  console.log(`Filtered, return ${assets.length} NFTs out of ${assets.length}`)

  const [currentPage, setCurrentPage] = React.useState(1)

  return (
    <>
      <h1>NFTs</h1>

      {assets.length === 0 ? (
        <h2>Nothing to see here!</h2>
      ) : (
        <>
          <div className="my-4">
            <p>Found {assets.length} NFTs...</p>
          </div>
          <PaginatedNFTTileList assets={assets} currentPage={currentPage} setCurrentPage={setCurrentPage} />
        </>
      )}
    </>
  )
}
