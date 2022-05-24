import { Dialog, Transition } from '@headlessui/react'
import { default as React, Fragment } from 'react'

export interface OverlayProps {
  openOverlay: boolean
  onClose: () => void
  innerComponent: JSX.Element
}
export default function Overlay(props: OverlayProps) {
  const { openOverlay, onClose, innerComponent } = props

  return (
    <Transition.Root show={openOverlay} as={Fragment}>
      <Dialog as="div" className="fixed z-50 inset-0 overflow-hidden" onClose={onClose}>
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-grey bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 shadow-xl transform transition-all sm:my-8 sm:align-middle sm:min-w-lg sm:p-6">
              {innerComponent}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
