import * as React from 'react'
import { Link } from 'remix'
import { NFT } from '~/models/nft'
import { formatDate, formatDateAsUTC, formatDateRelative } from '~/utils/utils'

export function NFTTile(props: { nft: NFT; relativeDate?: boolean; showImage?: boolean }) {
  const nft = props.nft
  const ts = new Date(nft.creationTransaction['round-time']! * 1000)
  return (
    <Link to={`/nft/${props.nft.asset.index}`}>
      {props.showImage !== false ? (
        <img
          src={nft.asset.params.url?.replace('ipfs://', 'https://ipfs.infura.io/ipfs/')}
          alt={nft.asset.params.name}
          width={277.33}
          height={277.33}
        />
      ) : (
        ''
      )}
      <div className="text-black">
        <p>
          <span className="capitalize">{nft.asset.params.name}</span>
        </p>
        <p className="text-xs">
          <time dateTime={ts.toISOString()} title={'Local time: ' + formatDate(ts)}>
            {props.relativeDate ? formatDateRelative(ts) : formatDateAsUTC(ts)}
          </time>
        </p>
      </div>
    </Link>
  )
}
