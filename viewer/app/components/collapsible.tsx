import { Disclosure } from '@headlessui/react'
import React from 'react'
import { classNames } from '~/utils/utils'
import { ChevronDownIcon } from './icons'

export interface CollapsibleProps {
  title: JSX.Element | string
  content: JSX.Element | string
}
export default function Collapsible(props: CollapsibleProps) {
  return (
    <div className="mx-auto divide-y-2 divide-grey-light">
      <dl className="space-y-6 divide-y divide-grey-light">
        <Disclosure as="div" className="p-3 border-2 border-grey-light shadow-md rounded-lg">
          {({ open }) => (
            <>
              <dt className="text-lg">
                <Disclosure.Button className="text-left w-full flex justify-between items-start text-grey-dark">
                  {props.title}
                  <span className="h-7 flex items-center">
                    <ChevronDownIcon
                      className={classNames(open ? '-rotate-180' : 'rotate-0', 'h-6 w-6 transform')}
                      aria-hidden="true"
                    />
                  </span>
                </Disclosure.Button>
              </dt>
              <Disclosure.Panel as="dd" className="mt-2 pr-12">
                {props.content}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </dl>
    </div>
  )
}
