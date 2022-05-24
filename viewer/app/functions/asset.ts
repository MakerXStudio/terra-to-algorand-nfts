import { getIndexerClient } from './algo-client'
import { getAssetLastConfigTransaction } from './asset-search'

export interface Arc69Payload {
  standard: 'arc69'
  description?: string
  external_url?: string
  media_url?: string
  properties?: Record<string, string> | undefined
  mime_type?: string
}

export const noteToArc69Payload = (note: string | undefined) => {
  if (!note) {
    return undefined
  }

  const noteUnencoded = Buffer.from(note, 'base64')
  const json = new TextDecoder().decode(noteUnencoded)
  if (json.match(/^{/) && json.includes('arc69')) {
    return JSON.parse(json) as Arc69Payload
  }
  return undefined
}

export async function getAssetMetadataById(assetId: number): Promise<Arc69Payload | undefined> {
  const indexer = getIndexerClient()
  const lastConfigTran = await getAssetLastConfigTransaction(indexer, assetId)
  return noteToArc69Payload(lastConfigTran?.note)
}
