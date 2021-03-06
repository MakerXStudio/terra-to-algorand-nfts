import {
  BriefcaseIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DuplicateIcon,
  ExternalLinkIcon,
  MenuIcon,
  XIcon,
} from '@heroicons/react/solid'
import React from 'react'

export {
  MenuIcon as MenuIcon,
  XIcon as XIcon,
  CheckIcon as CheckIcon,
  BriefcaseIcon as SuitcaseIcon,
  DuplicateIcon as CopyIcon,
  CheckCircleIcon as CheckCircleIcon,
  ChevronLeftIcon as ChevronLeftIcon,
  ChevronRightIcon as ChevronRightIcon,
  ChevronDownIcon as ChevronDownIcon,
}

export function OpenInNewTabIcon() {
  return <ExternalLinkIcon className="h-4 w-4 inline-flex cursor-pointer"></ExternalLinkIcon>
}

export function AlgorandIcon() {
  return (
    <svg width="31" height="31" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 31L18.2009 1H22.8059L24.9052 8.51693H29.6456L26.3891 14.1188L31 31H26.2596L23.1652 19.6646L16.5756 31H11.4966L21.6239 14.0188L19.8262 7.43341L6.07901 31H1Z"
        fill="black"
      />
      <path
        d="M22.8059 1H18.2009L1 31H6.07901L19.8262 7.43341L26.2596 31H31L22.8059 1ZM22.8059 1L24.9052 8.51693M24.9052 8.51693H29.6456L16.5756 31H11.4966L24.9052 8.51693Z"
        stroke="black"
      />
    </svg>
  )
}
