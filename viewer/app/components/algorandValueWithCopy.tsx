import React from 'react'
import AlgorandValue from './algorandValue'
import CopyToClipBoard from './copyToClipBoard'

export enum ExplorerLookupType {
  TRANSACTION = 'tx/',
  BLOCK = 'block/',
  ADDRESS = 'address/',
  ASSET = 'asset/',
}

export default function AlgorandValueWithCopy(props: {
  value: string
  displayValue?: string
  type: ExplorerLookupType
}) {
  const value = props.value

  return (
    <div className={'overflow-hidden relative'} title={value}>
      {value && value != '' ? (
        <>
          <AlgorandValue type={props.type} value={value} displayValue={props.displayValue} />
          {}
          <CopyToClipBoard
            className="inline-flex w-4 h-4 mr-0 place-self-end absolute right-0 top-1/4"
            valueToCopy={value}
          />
        </>
      ) : (
        <>
          {' '}
          <em>(no data)</em>
        </>
      )}
    </div>
  )
}
