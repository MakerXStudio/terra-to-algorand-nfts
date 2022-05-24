import React from 'react'

export default function ToolTip(props: { value: string }) {
  return (
    <div
      id="tooltip-default"
      role="tooltip"
      className="w-fit inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-grey rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-grey-dark"
    >
      {props.value}
    </div>
  )
}
