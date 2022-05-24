import { ellipseAddress } from '~/utils/utils'

export enum ExplorerLookupType {
  TRANSACTION = 'tx/',
  BLOCK = 'block/',
  ADDRESS = 'address/',
  ASSET = 'asset/',
}

export default function AlgorandValue(props: { value: string; displayValue?: string; type: ExplorerLookupType }) {
  const value = props.value

  let customDisplayValue = props.displayValue != undefined ? props.displayValue : value

  const shouldShortenDisplayValue =
    props.type === ExplorerLookupType.ADDRESS || props.type === ExplorerLookupType.TRANSACTION

  customDisplayValue = shouldShortenDisplayValue ? ellipseAddress(customDisplayValue, 5, 5) : customDisplayValue

  return (
    <>
      {value && value != '' ? (
        <code
          className="p-1 bg-red-100 text-red-900 flex-shrink"
          title={props.displayValue != undefined ? props.displayValue : value}
        >
          {customDisplayValue}
        </code>
      ) : (
        <>
          {' '}
          <em>(no data)</em>
        </>
      )}
    </>
  )
}
