import * as React from 'react'

export interface dataTableRecordProps {
  heading: string | JSX.Element
  values: string[] | JSX.Element[] | undefined
}

export function DataTableRecord(props: dataTableRecordProps) {
  return (
    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-grey">{props.heading}</dt>
      <dd className="mt-1 text-sm text-grey-dark sm:mt-0 sm:col-span-2">
        {props.values &&
          props.values.length > 0 &&
          props.values.map((v, idx) => {
            return (
              <div key={idx}>
                <div>{v}</div>
              </div>
            )
          })}
        {props.values && props.values.length === 0 && <div>-</div>}
      </dd>
    </div>
  )
}
