import React from 'react'

export type SiteConfig = {}

export const siteConfigDefault: SiteConfig = {}
export const ConfigContext = React.createContext<SiteConfig>(siteConfigDefault)
