import * as React from 'react'
import { LoaderFunction, Outlet, useCatch, useLoaderData } from 'remix'
import { SiteDocument } from './components/siteDocument'
import { SiteError } from './components/siteError'
import { checkEnvVariables } from './functions/env'
import { SiteConfig, siteConfigDefault } from './models/siteConfig'
import styles from './tailwind.css'

export function links() {
  return [
    // This is optional but is how to add a google font
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css?family=Open+Sans',
    },
    { rel: 'stylesheet', href: styles },
    {
      rel: 'stylesheet',
      href: 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
      integrity: 'sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==',
      crossOrigin: '',
    },
  ]
}
type LoaderData = {
  siteConfig: SiteConfig
}

export const loader: LoaderFunction = async (): Promise<LoaderData> => {
  await checkEnvVariables()

  try {
    return {
      siteConfig: {},
    }
  } catch (error) {
    console.error(`There was reading SiteConfig in root, error: ${error}`)
    return {
      siteConfig: siteConfigDefault,
    }
  }
}

export function CatchBoundary() {
  let caught = useCatch()

  return (
    <SiteError
      error={{ name: caught.status.toString(), message: caught.statusText, stack: caught.data }}
      httpCode={caught.status}
    />
  )
}

export function ErrorBoundary({ error }: { error: Error }) {
  return <SiteError error={error} httpCode={500} />
}

export default function App() {
  const response = useLoaderData<LoaderData>()

  return (
    <SiteDocument title="NFT Viewer" siteConfig={response.siteConfig}>
      <Outlet />
    </SiteDocument>
  )
}
