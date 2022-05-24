import { Indexer, TransactionType } from 'algosdk'
import { DEFAULT_INDEXER_MAX_API_RESOURCES_PER_ACCOUNT } from '~/models/constants'

// https://developer.algorand.org/docs/rest-apis/indexer/#get-v2transactions
export interface TransactionSearchResults {
  'current-round': string
  'next-token': string
  transactions: TransactionResult[]
}

export interface TransactionResult {
  id: string
  fee: number
  sender: string
  'first-valid': number
  'last-valid': number
  'confirmed-round'?: number
  group?: string
  note?: string
  logs?: string[]
  'round-time'?: number
  'intra-round-offset'?: number
  signature?: TransactionSignature
  'application-transaction'?: ApplicationTransactionResult
  'created-application-index'?: number
  'asset-config-transaction': AssetConfigTransactionResult
  'created-asset-index'?: number
  'asset-freeze-transaction'?: AssetFreezeTransactionResult
  'asset-transfer-transaction'?: AssetTransferTransactionResult
  'keyreg-transaction'?: any
  'payment-transaction'?: PaymentTransactionResult
  'auth-addr'?: string
  'closing-amount'?: number
  'genesis-hash'?: string
  'genesis-id'?: string
  'inner-txns'?: TransactionResult[]
  'rekey-to'?: string
  lease?: string
  'local-state-delta'?: Record<string, EvalDelta>[]
  'global-state-delta'?: Record<string, EvalDelta>[]
  'receiver-rewards'?: number
  'sender-rewards'?: number
  'close-rewards'?: number
  'tx-type': TransactionType
}

interface TransactionSignature {
  logicsig: LogicTransactionSignature
  multisig: MultisigTransactionSignature
  sig: string
}

interface LogicTransactionSignature {
  args: string[]
  logic: string
  'multisig-signature': MultisigTransactionSignature
  signature: string
}

interface MultisigTransactionSignature {
  subsignature: MultisigTransactionSubSignature
  threshold: number
  version: number
}

interface MultisigTransactionSubSignature {
  'public-key': string
  signature: string
}

export interface TealKeyValue {
  bytes: string
  type: number
  uint: number
}

export interface EvalDelta {
  action: number
  bytes: string
  uint: number
}

interface ApplicationParams {
  creator: string
  'approval-program': string
  'clear-state-program': string
  'extra-program-pages'?: number
  'global-state': TealKeyValue[]
  'global-state-schema'?: StateSchema
  'local-state-schema'?: StateSchema
}

interface ApplicationTransactionResult
  extends Exclude<{ creator: string; 'global-state': TealKeyValue[] }, ApplicationParams> {
  'application-id': number
  'on-completion': ApplicationOnComplete
  'application-args'?: string[]
  accounts?: string[]
  'foreign-apps'?: number[]
  'foreign-assets'?: number[]
}

interface StateSchema {
  'num-byte-slice': number
  'num-uint': number
}

export enum ApplicationOnComplete {
  noop = 'noop',
  optin = 'optin',
  closeout = 'closeout',
  clear = 'clear',
  update = 'update',
  delete = 'delete',
}

interface AssetConfigTransactionResult {
  'asset-id': number
  params: AssetParams
}

interface AssetFreezeTransactionResult {
  address: string
  'asset-id': number
  'new-freeze-status': boolean
}

interface AssetTransferTransactionResult {
  amount: number
  'asset-id': number
  'close-amount'?: number
  'close-to'?: string
  receiver?: string
  sender?: string
}

export interface AssetResult {
  index: number
  deleted: boolean
  'created-at-round': number
  'destroyed-at-round'?: number
  params: AssetParams
}

interface AssetParams {
  /**
   * The address that created this asset. This is the address where the parameters
   * for this asset can be found, and also the address where unwanted asset units can
   * be sent in the worst case.
   */
  creator: string
  /**
   * (dc) The number of digits to use after the decimal point when displaying this
   * asset. If 0, the asset is not divisible. If 1, the base unit of the asset is in
   * tenths. If 2, the base unit of the asset is in hundredths, and so on. This value
   * must be between 0 and 19 (inclusive).
   */
  decimals: number | bigint
  /**
   * (t) The total number of units of this asset.
   */
  total: number | bigint
  /**
   * (c) Address of account used to clawback holdings of this asset. If empty,
   * clawback is not permitted.
   */
  clawback?: string
  /**
   * (df) Whether holdings of this asset are frozen by default.
   */
  'default-frozen'?: boolean
  /**
   * (f) Address of account used to freeze holdings of this asset. If empty, freezing
   * is not permitted.
   */
  freeze?: string
  /**
   * (m) Address of account used to manage the keys of this asset and to destroy it.
   */
  manager?: string
  /**
   * (am) A commitment to some unspecified asset metadata. The format of this
   * metadata is up to the application.
   */
  'metadata-hash'?: Uint8Array
  /**
   * (an) Name of this asset, as supplied by the creator. Included only when the
   * asset name is composed of printable utf-8 characters.
   */
  name?: string
  /**
   * Base64 encoded name of this asset, as supplied by the creator.
   */
  'name-b64'?: Uint8Array
  /**
   * (r) Address of account holding reserve (non-minted) units of this asset.
   */
  reserve?: string
  /**
   * (un) Name of a unit of this asset, as supplied by the creator. Included only
   * when the name of a unit of this asset is composed of printable utf-8 characters.
   */
  'unit-name'?: string
  /**
   * Base64 encoded name of a unit of this asset, as supplied by the creator.
   */
  'unit-name-b64'?: Uint8Array
  /**
   * (au) URL where more information about the asset can be retrieved. Included only
   * when the URL is composed of printable utf-8 characters.
   */
  url?: string
  /**
   * Base64 encoded URL where more information about the asset can be retrieved.
   */
  'url-b64'?: Uint8Array
}

interface PaymentTransactionResult {
  amount: number
  'close-amount'?: number
  'close-remainder-to'?: string
  receiver: string
}

// https://developer.algorand.org/docs/rest-apis/indexer/#get-v2accountsaccount-id
export interface AccountLookupResult {
  'current-round': string
  account: AccountResult
}

export interface AccountResult {
  address: string
  amount: number | bigint
  'amount-without-pending-rewards': number
  'apps-local-state'?: AppLocalState[]
  'apps-total-extra-pages'?: number
  'apps-total-schema'?: StateSchema
  assets?: AssetHolding[]
  'auth-addr'?: string
  'closed-at-round'?: number
  'created-apps'?: ApplicationResult[]
  'created-assets'?: AssetResult[]
  'created-at-round'?: number
  deleted?: boolean
  participation: any
  'pending-rewards': number
  'reward-base': number
  rewards: number
  round: number
  'sig-type': SignatureType
  status: AccountStatus
}

export enum SignatureType {
  sig = 'sig',
  msig = 'msig',
  lsig = 'lsig',
}

export enum AccountStatus {
  Offline = 'Offline',
  Online = 'Online',
  NotParticipating = 'NotParticipating',
}

interface AppLocalState {
  'closed-out-at-round': number
  deleted: boolean
  id: number
  'key-value': TealKeyValue[]
  'opted-in-at-round': number
  schema: StateSchema
}

interface ApplicationResult {
  id: number
  params: ApplicationParams
  'created-at-round'?: number
  deleted?: boolean
  'deleted-at-round'?: number
}

// https://developer.algorand.org/docs/rest-apis/indexer/#assetholding
export interface AssetHolding {
  /** [a] number of units held. */
  amount: number
  /** Asset ID of the holding. */
  'asset-id': number
  /** Whether or not the asset holding is currently deleted from its account. */
  deleted?: boolean
  /** [f] whether or not the holding is frozen. */
  'is-frozen': boolean
  /** Round during which the account opted into this asset holding. */
  'opted-in-at-round'?: number
  /** Round during which the account opted out of this asset holding. */
  'opted-out-at-round'?: number
}

// https://developer.algorand.org/docs/rest-apis/indexer/#get-v2accountsaccount-idassets
export interface AssetsLookupResult {
  'current-round': string
  'next-token': string
  assets: AssetHolding[]
}

export async function lookupTransactionsByAddressWithPagination(
  indexer: Indexer,
  address: string,
  addressRole: 'sender' | 'receiver' | 'freeze-target',
  txType: TransactionType,
  minRound?: number
): Promise<TransactionResult[]> {
  return await executePaginatedRequest(
    (response: TransactionSearchResults) => response.transactions,
    (nextToken) => {
      let s = indexer.searchForTransactions().txType(txType).address(address).addressRole(addressRole)
      if (minRound) {
        s = s.minRound(minRound)
      }
      if (nextToken) {
        s = s.nextToken(nextToken)
      }
      return s
    }
  )
}

export async function lookupAssetsOwnedByAccount(
  indexer: Indexer,
  address: string,
  includeAll: boolean | undefined = undefined
): Promise<AssetHolding[]> {
  return await executePaginatedRequest(
    (response: AssetsLookupResult) => response.assets,
    (nextToken) => {
      let s = indexer
        .lookupAccountAssets(address)
        .includeAll(includeAll)
        .limit(DEFAULT_INDEXER_MAX_API_RESOURCES_PER_ACCOUNT)
      if (nextToken) {
        s = s.nextToken(nextToken)
      }
      return s
    }
  )
}

export async function lookupTransactionsByAssetId(
  indexer: Indexer,
  assetId: number,
  options?: { txType: string; minRound?: number; unitsGreaterThan?: number }
): Promise<TransactionResult[]> {
  return await executePaginatedRequest(
    (response: TransactionSearchResults) => response.transactions,
    (nextToken) => {
      let s = indexer.lookupAssetTransactions(assetId)
      if (options?.txType) {
        s = s.txType(options.txType)
      }
      if (options?.minRound) {
        s = s.minRound(options?.minRound)
      }
      if (options?.unitsGreaterThan !== undefined) {
        // .toString() is a workaround for issue with zero values: https://github.com/algorand/js-algorand-sdk/issues/414
        s = s.currencyGreaterThan(options.unitsGreaterThan.toString() as any)
      }
      if (nextToken) {
        s = s.nextToken(nextToken)
      }
      return s
    }
  )
}

async function executePaginatedRequest<TResult, TRequest extends { do: () => Promise<any> }>(
  extractItems: (response: any) => TResult[],
  buildRequest: (nextToken?: string) => TRequest
): Promise<TResult[]> {
  let results = []

  let nextToken: string | undefined = undefined
  while (true) {
    const request = buildRequest(nextToken)
    const response = await request.do()
    const items = extractItems(response)
    results.push(...items)
    nextToken = response['next-token']
    if (!nextToken || items.length === 0) {
      break
    }
  }

  return results
}
