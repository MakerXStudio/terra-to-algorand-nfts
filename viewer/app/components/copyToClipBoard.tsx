import React, { useState } from 'react'
import { CopyIcon } from './icons'
import Toast from './toast'
import ToolTip from './tooltip'

export default function CopyToClipBoard(props: { valueToCopy: string; className: string }) {
  const [isCopiedSuccessfully, setIsCopiedSuccessfully] = useState(false)
  return (
    <div className="cursor-pointer">
      <div
        className={props.className}
        onClick={() => navigator.clipboard.writeText(props.valueToCopy).then(() => setIsCopiedSuccessfully(true))}
      >
        <CopyIcon data-tooltip-target="tooltip-default" />
        <ToolTip value={props.valueToCopy} />
      </div>
      {isCopiedSuccessfully && (
        <Toast
          isVisible={isCopiedSuccessfully}
          message="Value copied successfully"
          onClose={() => setIsCopiedSuccessfully(false)}
        />
      )}
    </div>
  )
}
