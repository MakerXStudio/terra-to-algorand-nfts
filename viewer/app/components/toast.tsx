import { Transition } from '@headlessui/react'
import React, { Fragment, useEffect } from 'react'
import { CheckIcon, XIcon } from './icons'

export default function Toast(props: { isVisible: boolean; message: string; onClose: any }) {
  const { isVisible, message, onClose } = props

  // when the component is mounted, the alert is displayed for 3 seconds
  useEffect(() => {
    setTimeout(() => {
      onClose(false)
    }, 3000)
  }, [])

  return (
    <Transition.Root show={isVisible} as={Fragment}>
      <div
        className="alert-toast fixed top-0 right-0 m-8 w-5/6 md:w-full max-w-sm"
        onClick={() => {
          onClose(false)
        }}
      >
        <div
          id="toast-success"
          className="flex items-center w-full max-w-xs p-4 mb-4 text-grey-dark bg-white rounded-lg shadow dark:text-grey dark:bg-grey-dark"
          role="alert"
        >
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green bg-green-light rounded-lg dark:bg-green-dark dark:text-green-light">
            <CheckIcon className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green bg-green-light rounded-lg dark:bg-green-dark dark:text-green-light" />
          </div>
          <div className="ml-3 text-sm font-normal text-grey-dark dark:text-grey-light">{message}</div>
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 bg-white text-grey hover:text-grey-dark rounded-lg focus:ring-2 focus:ring-grey-light p-1.5 hover:bg-grey-light inline-flex h-8 w-8 dark:text-grey dark:hover:text-white dark:bg-grey-dark dark:hover:bg-grey-dark"
            data-dismiss-target="#toast-success"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <XIcon />
          </button>
        </div>
      </div>
    </Transition.Root>
  )
}
