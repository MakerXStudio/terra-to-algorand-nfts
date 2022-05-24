import React from 'react'
import { NFTTile } from '~/components/nftTile'
import { NFT } from '~/models/nft'
import { pagination } from '~/utils/utils'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

function PaginationFooter(props: { currentPage: number; numPages: number; goToPage: (n: number) => void }) {
  const baseButtonStyle =
    'inline-flex items-center text-sm font-medium hover:font-bold bg-grey-light hover:bg-grey border rounded my-auto mx-1 h-10'
  return (
    <nav
      role="navigation"
      aria-label="Results Pagination Navigation"
      className="px-4 flex items-center justify-between sm:px-0 mt-10 mb-10"
    >
      <div className="-mt-px flex-1 flex justify-start sm:justify-end">
        {props.currentPage === 1 ? (
          <></>
        ) : (
          <button
            onClick={() => props.goToPage(props.currentPage - 1)}
            className={`px-2 ${baseButtonStyle}`}
            aria-label="Go to previous page of results"
          >
            <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">Previous</span>
          </button>
        )}
      </div>
      <div className="hidden sm:flex sm:flex-wrap sm:-mt-px">
        {pagination(props.currentPage, props.numPages).map((pageNumberOrNull, idx) => {
          const isCurrent = pageNumberOrNull === props.currentPage
          const classes = isCurrent
            ? // TODO: pull out non-conflicting classes here
              'px-4 border-primary2-dark bg-primary-dark font-medium inline-flex items-center text-sm border rounded my-auto mx-1 h-10'
            : `px-4 ${baseButtonStyle}`
          if (pageNumberOrNull === null) {
            return (
              <span key={idx} className={classes}>
                ...
              </span>
            )
          } else {
            return (
              <button
                key={idx}
                onClick={() => props.goToPage(pageNumberOrNull)}
                className={classes}
                aria-label={`Go to page ${pageNumberOrNull}`}
                aria-current={isCurrent ? true : undefined}
              >
                {pageNumberOrNull}
              </button>
            )
          }
        })}
      </div>
      <div className="-mt-px flex-1 flex justify-end sm:justify-start">
        {props.currentPage === props.numPages ? (
          <></>
        ) : (
          <button
            onClick={() => props.goToPage(props.currentPage + 1)}
            className={`px-2 ${baseButtonStyle}`}
            aria-label="Go to next page of results"
          >
            <span className="sr-only">Next</span>
            <ChevronRightIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
    </nav>
  )
}

export default function PaginatedNFTsTileList(props: {
  assets: NFT[]
  currentPage: number
  setCurrentPage: (value: number) => void
}) {
  const pageSize = 36 // should be a multiple of 1, 2, and 3 (column sizes)
  const numPages = Math.ceil(props.assets.length / pageSize)

  const searchRef = React.createRef<HTMLDivElement>()
  const goToPage = (n: number) => {
    if (n > 0 && n <= numPages) {
      props.setCurrentPage(n)
      searchRef.current?.scrollIntoView()
    }
  }

  const pageAssets = props.assets.slice((props.currentPage - 1) * pageSize, props.currentPage * pageSize)

  return (
    <div className="mt-3" ref={searchRef}>
      <ul role="list" className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {pageAssets.map((a) => (
          <li key={a.asset.index} className="col-span-1 mx-auto">
            <NFTTile nft={a} />
          </li>
        ))}
      </ul>
      <PaginationFooter currentPage={props.currentPage} numPages={numPages} goToPage={goToPage} />
    </div>
  )
}
