import * as React from 'react'
import { renderToString } from 'react-dom/server'
import type { EntryContext } from 'remix'
import { RemixServer } from 'remix'

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const markup = renderToString(<RemixServer context={remixContext} url={request.url} />)

  responseHeaders.set('Content-Type', 'text/html')

  responseHeaders.set('Cache-Control', 'max-age=60, stale-while-revalidate=3600, s-maxage=3600')

  return new Response('<!DOCTYPE html>' + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  })
}
