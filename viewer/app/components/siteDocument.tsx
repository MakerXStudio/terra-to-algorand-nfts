import React from 'react'
import { Links, LiveReload, Meta, Scripts, ScrollRestoration } from 'remix'
import { ConfigContext, SiteConfig } from '~/models/siteConfig'
import SiteFooter from './siteFooter'
import SiteHeader from './siteHeader'

export function SiteDocument({
  children,
  title,
  siteConfig,
}: {
  children: React.ReactNode
  title?: string
  siteConfig: SiteConfig
}) {
  return (
    <html lang="en">
      <head>
        {title ? <title>{title}</title> : 'NFT Viewer'}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <link href="https://fonts.cdnfonts.com/css/nimbus-sans-l" rel="stylesheet" />
      </head>
      <body>
        <ConfigContext.Provider value={siteConfig!}>
          <header>
            <SiteHeader />
          </header>
          <main className="my-4 max-w-4xl mx-auto px-4 lg:px-0">{children}</main>
          <footer>
            <SiteFooter />
          </footer>
          <ScrollRestoration />
          <Scripts />
          <LiveReload port={3001} />
        </ConfigContext.Provider>
      </body>
    </html>
  )
}
