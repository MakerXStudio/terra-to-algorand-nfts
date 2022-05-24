import clsx from 'clsx'
import * as React from 'react'
import AlgorandValueWithCopy, { ExplorerLookupType } from '~/components/algorandValueWithCopy'
import { formatDate, formatDateAsUTC, getDate } from '~/utils/utils'
import { OpenInNewTabIcon } from './icons'

export interface Property {
  property: string | JSX.Element
  value: string | number | Date | undefined | JSX.Element
  displayValue?: string
  type?:
    | 'km'
    | 'mww'
    | 'date'
    | 'algorand-transaction'
    | 'algorand-address'
    | 'algorand-asset'
    | 'algorand-block'
    | 'percentage'
  link?: string | undefined
  title?: string | undefined
}

export function PropertyPanel({
  heading,
  properties,
  first,
}: {
  heading: JSX.Element
  properties: Property[]
  first?: boolean
}) {
  return (
    <div className={clsx(first ? 'pb-5' : 'py-5')}>
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-4 sm:pb-5 sm:px-6">{heading}</div>
        <dl>
          {properties.map((p, i) => {
            const value =
              p.value == undefined ? (
                <>
                  {' '}
                  <em>(no data)</em>
                </>
              ) : (
                <>
                  {p.type === 'date' &&
                  (typeof p.value === 'string' ||
                    typeof p.value === 'number' ||
                    (typeof p.value === 'object' && 'getDate' in p.value)) ? (
                    <time dateTime={getDate(p.value).toISOString()} title={'Local time: ' + formatDate(p.value)}>
                      {formatDateAsUTC(p.value)}
                    </time>
                  ) : p.type === 'algorand-transaction' && typeof p.value === 'string' ? (
                    <AlgorandValueWithCopy type={ExplorerLookupType.TRANSACTION} value={p.value} />
                  ) : p.type === 'algorand-address' && typeof p.value === 'string' ? (
                    <AlgorandValueWithCopy type={ExplorerLookupType.ADDRESS} value={p.value} />
                  ) : p.type === 'algorand-asset' && typeof p.value === 'string' ? (
                    <AlgorandValueWithCopy
                      type={ExplorerLookupType.ASSET}
                      value={p.value}
                      displayValue={p.displayValue}
                    />
                  ) : p.type === 'algorand-block' && (typeof p.value === 'string' || typeof p.value === 'number') ? (
                    <AlgorandValueWithCopy type={ExplorerLookupType.BLOCK} value={p.value.toString()} />
                  ) : p.type === 'percentage' && typeof p.value === 'number' ? (
                    p.value + '%'
                  ) : (
                    p.value
                  )}
                </>
              )

            return (
              <div
                key={p.property.toString()}
                className={clsx(
                  'px-1 py-2 sm:py-2 sm:grid sm:grid-cols-9 sm:gap-4 sm:px-6',
                  i % 2 === 0 && 'bg-primary-lightest'
                )}
                title={p.title}
              >
                <dt className="text-sm font-medium text-grey sm:col-span-2">{p.property}</dt>
                <dd className="mt-1 text-sm text-grey-dark sm:mt-0 sm:col-span-7">
                  {p.link ? (
                    <div>
                      <a className="link" href={p.link} target="_blank" rel="noreferrer">
                        {value}
                        <OpenInNewTabIcon />
                      </a>
                    </div>
                  ) : (
                    value
                  )}{' '}
                  {p.type === 'km' && <abbr title="kilometres">km</abbr>}
                  {p.type === 'mww' && <abbr title="moment w-phase">mww</abbr>}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </div>
  )
}
