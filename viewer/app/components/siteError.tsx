import React from 'react'
import { Link } from 'remix'
import { siteConfigDefault } from '~/models/siteConfig'
import Collapsible from './collapsible'
import { SiteDocument } from './siteDocument'

export function SiteError({ error, httpCode }: { error: Error; httpCode: number }) {
  return (
    <SiteDocument title={`Error`} siteConfig={siteConfigDefault}>
      <div className="w-full">
        <p>Sorry, something went wrong.</p>
        <Link className="link cursor-pointer" to="/">
          Go back to homepage
        </Link>

        {process.env.NODE_ENV === 'development' && (
          <Collapsible
            key={'errorCollapsible'}
            title={`Error: HTTP${httpCode} - ${error.message}`}
            content={error.stack ? JSON.stringify(error.stack) : ''}
          />
        )}
      </div>
    </SiteDocument>
  )
}
