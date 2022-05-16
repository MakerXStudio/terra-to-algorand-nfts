import algosdk, { Account, Algodv2, Indexer, Transaction, TransactionType } from 'algosdk'
import { AssetResult, lookupAccountCreatedAssetsByAddress, lookupAssetByIndex, searchTransactions } from './search'
import { PendingTransactionResponse, sendTransaction } from './transaction'

export enum MediaType {
  Image = 'i',
  Video = 'v',
  Audio = 'a',
  PDF = 'p',
  HTML = 'h',
}

export interface Arc69Metadata {
  mediaType: MediaType
  assetMimeType?: string
  description?: string
  externalUrl?: string | undefined
  mediaUrl?: string | undefined
  properties?:
    | {
        [key: string]: number | number[] | string | string[] | { [key: string]: number | number[] | string | string[] }
      }
    | undefined
}

export interface Arc69Payload {
  standard: 'arc69'
  description?: string
  external_url?: string
  media_url?: string
  properties?:
    | {
        [key: string]: number | number[] | string | string[] | { [key: string]: number | number[] | string | string[] }
      }
    | undefined
  mime_type?: string
}

export const getArc69Metadata = (metadata: Arc69Metadata) => {
  // https://github.com/algokittens/arc69#json-metadata-file-schema
  return {
    standard: 'arc69',
    ...(metadata.description ? { description: metadata.description } : {}),
    ...(metadata.externalUrl ? { external_url: metadata.externalUrl } : {}),
    ...(metadata.mediaUrl ? { media_url: metadata.mediaUrl } : {}),
    ...(metadata.properties ? { properties: metadata.properties } : {}),
    ...(metadata.assetMimeType ? { mime_type: metadata.assetMimeType } : {}),
  } as Arc69Payload
}

export interface CreateAssetParamsBase {
  assetName: string
  unitName?: string | undefined
  url?: string | undefined
  note?: string | undefined
  creator: Account
  metadataHash?: string | undefined
  managerAddress?: string | undefined
  reserveAddress?: string | undefined
  freezeAddress?: string | undefined
  clawbackAddress?: string | undefined
  freezeByDefault?: boolean
  suppressLog?: boolean
  skipSending?: boolean
  skipWaiting?: boolean
  arc69Metadata?: Arc69Metadata | undefined
}

interface CreateAssetParams extends CreateAssetParamsBase {
  total: number
  decimals: number
}

export const noteToArc69Payload = (note: string | undefined) => {
  if (!note) {
    return undefined
  }

  const noteUnencoded = Buffer.from(note, 'base64')
  const json = new TextDecoder().decode(noteUnencoded)
  if (json.match(/^\{/) && json.includes('arc69')) {
    return JSON.parse(json) as Arc69Payload
  }
  return undefined
}

export async function getExistingAsset(
  assetIndex: number,
  indexer: Indexer
): Promise<{ asset: AssetResult; metadata?: Arc69Payload } | null> {
  const existing = (await lookupAssetByIndex(indexer, assetIndex)).asset
  const configTransactions = await searchTransactions(indexer, (s) =>
    s.assetID(assetIndex).txType(TransactionType.acfg)
  )

  const notes = configTransactions.transactions
    .map((t) => ({ note: t.note, round: t['round-time']! }))
    .sort(function (t1, t2) {
      return t1.round - t2.round
    })

  if (notes && notes.length > 0) {
    const lastNote = notes[notes.length - 1].note
    return {
      asset: existing,
      metadata: noteToArc69Payload(lastNote),
    }
  }

  return {
    asset: existing,
  }
}

export async function getExistingAssets(
  account: Account,
  assetNameContains: string[],
  indexer: Indexer
): Promise<{ asset: AssetResult; metadata?: Arc69Payload }[]> {
  const accountAssets = await lookupAccountCreatedAssetsByAddress(indexer, account.addr)

  const existingAssets = accountAssets.filter(
    (a) =>
      !a.deleted &&
      assetNameContains.filter((containsSearch) => (a.params.name || '').includes(containsSearch)).length > 0
  )

  if (existingAssets.length === 0) {
    console.log(`Didn't find any assets matching ${JSON.stringify(assetNameContains)} for account ${account.addr}`)
    return []
  }

  return (await Promise.all(existingAssets.map((a) => getExistingAsset(a.index, indexer)))).filter(
    (a) => a !== null
  ) as { asset: AssetResult; metadata?: Arc69Payload }[]
}

export async function createNonFungibleToken(
  params: CreateAssetParamsBase,
  client: Algodv2
): Promise<{ transaction: Transaction; confirmation: PendingTransactionResponse | undefined }> {
  return createAsset({ ...params, total: 1, decimals: 0 }, client)
}

export async function createAsset(
  {
    unitName,
    assetName,
    url,
    note,
    creator,
    total,
    decimals,
    metadataHash,
    arc69Metadata,
    managerAddress,
    reserveAddress,
    freezeAddress,
    clawbackAddress,
    freezeByDefault,
    suppressLog,
    skipWaiting,
    skipSending,
  }: CreateAssetParams,
  client: Algodv2
): Promise<{ transaction: Transaction; confirmation: PendingTransactionResponse | undefined }> {
  const params = await client.getTransactionParams().do()

  const encoder = new TextEncoder()

  if (!note && arc69Metadata) {
    // https://github.com/algokittens/arc69#json-metadata-file-schema
    const metadata = getArc69Metadata(arc69Metadata)
    note = JSON.stringify(metadata)
  }

  const transaction = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: creator.addr,
    note: encoder.encode(note),
    total: total,
    decimals: decimals,
    defaultFrozen: freezeByDefault || false,
    manager: managerAddress,
    reserve: reserveAddress,
    freeze: freezeAddress,
    clawback: clawbackAddress,
    unitName: unitName,
    assetName: assetName,
    assetURL: url && arc69Metadata ? `${url}#${arc69Metadata.mediaType}` : url,
    assetMetadataHash: metadataHash,
    suggestedParams: params,
    rekeyTo: undefined,
  })

  if (!skipSending) {
    const result = await sendTransaction(client, transaction, creator, skipWaiting)

    if (!suppressLog && !skipWaiting) {
      console.log(
        `Successfully created asset ${assetName} with unit name ${unitName} having ${total} units with ${decimals} decimals via transaction ${transaction.txID()} with asset index ${
          result.confirmation!['asset-index']
        }.`,
        arc69Metadata
      )
    }

    return result
  }

  return { transaction, confirmation: undefined }
}
