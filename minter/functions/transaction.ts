import algosdk, { Account, Algodv2, EncodedSignedTransaction, LogicSigAccount, Transaction } from 'algosdk'
import { EvalDelta } from './search'

export function encodeNote(data?: any): Uint8Array | undefined {
  if (data == null) {
    return undefined
  } else {
    const note = typeof data === 'string' ? data : JSON.stringify(data)
    const encoder = new TextEncoder()
    return encoder.encode(note)
  }
}

export const sendTransaction = async function (
  client: Algodv2,
  transaction: Transaction,
  from: Account | LogicSigAccount,
  skipWaiting: boolean = false
) {
  const signedTransaction =
    'sk' in from ? transaction.signTxn(from.sk) : algosdk.signLogicSigTransactionObject(transaction, from).blob
  await client.sendRawTransaction(signedTransaction).do()

  let confirmation: PendingTransactionResponse | undefined = undefined
  if (!skipWaiting) {
    confirmation = await waitForConfirmation(client, transaction.txID(), 5)
  }

  return { transaction, confirmation }
}

export interface TransactionToSign {
  transaction: Transaction
  signer: Account | LogicSigAccount
}

export const sendGroupOfTransactions = async function (
  client: Algodv2,
  transactions: TransactionToSign[],
  skipWaiting: boolean = false
) {
  const transactionsToSend = transactions.map((t) => t.transaction)

  console.debug('Sending group of transactions', transactionsToSend)

  const signedTransactions = algosdk.assignGroupID(transactionsToSend).map((groupedTransaction, index) => {
    const signer = transactions[index].signer
    return 'sk' in signer
      ? groupedTransaction.signTxn(signer.sk)
      : algosdk.signLogicSigTransactionObject(groupedTransaction, signer).blob
  })

  console.debug(
    'Signer IDs',
    transactions.map((t) => ('addr' in t.signer ? t.signer.addr : t.signer.address()))
  )

  console.debug(
    'Transaction IDs',
    transactionsToSend.map((t) => t.txID())
  )

  // https://developer.algorand.org/docs/rest-apis/algod/v2/#post-v2transactions
  const { txId } = (await client.sendRawTransaction(signedTransactions).do()) as { txId: string }

  console.log(`Group transaction sent with transaction ID ${txId}`)

  let confirmation: PendingTransactionResponse | undefined = undefined
  if (!skipWaiting) {
    confirmation = await waitForConfirmation(client, txId, 5)
  }

  return { txId, confirmation }
}

// https://developer.algorand.org/docs/rest-apis/algod/v2/#get-v2transactionspendingtxid
export interface PendingTransactionResponse {
  'pool-error': string
  /**
   * The raw signed transaction.
   */
  txn: EncodedSignedTransaction
  /**
   * The application index if the transaction was found and it created an
   * application.
   */
  'application-index'?: number
  /**
   * The number of the asset's unit that were transferred to the close-to address.
   */
  'asset-closing-amount'?: number
  /**
   * The asset index if the transaction was found and it created an asset.
   */
  'asset-index'?: number
  /**
   * Rewards in microalgos applied to the close remainder to account.
   */
  'close-rewards'?: number
  /**
   * Closing amount for the transaction.
   */
  'closing-amount'?: number
  /**
   * The round where this transaction was confirmed, if present.
   */
  'confirmed-round'?: number
  /**
   * (gd) Global state key/value changes for the application being executed by this
   * transaction.
   */
  'global-state-delta'?: Record<string, EvalDelta>[]
  /**
   * Inner transactions produced by application execution.
   */
  'inner-txns'?: PendingTransactionResponse[]
  /**
   * (ld) Local state key/value changes for the application being executed by this
   * transaction.
   */
  'local-state-delta'?: Record<string, EvalDelta>[]
  /**
   * (lg) Logs for the application being executed by this transaction.
   */
  logs?: Uint8Array[]
  /**
   * Rewards in microalgos applied to the receiver account.
   */
  'receiver-rewards'?: number
  /**
   * Rewards in microalgos applied to the sender account.
   */
  'sender-rewards'?: number
}

/**
 * Wait until the transaction is confirmed or rejected, or until 'timeout'
 * number of rounds have passed.
 * @param {algosdk.Algodv2} client the Algod V2 client
 * @param {string} txId the transaction ID to wait for
 * @param {number} timeout maximum number of rounds to wait
 * @return {Promise<*>} pending transaction information
 * @throws Throws an error if the transaction is not confirmed or rejected in the next timeout rounds
 * https://developer.algorand.org/docs/sdks/javascript/
 */
export const waitForConfirmation = async function (
  client: Algodv2,
  txId: string,
  timeout: number
): Promise<PendingTransactionResponse> {
  if (client == null || txId == null || timeout < 0) {
    throw new Error('Bad arguments')
  }

  const status = await client.status().do()
  if (status === undefined) {
    throw new Error('Unable to get node status')
  }

  const startround = status['last-round'] + 1
  let currentround = startround

  while (currentround < startround + timeout) {
    const pendingInfo = (await client.pendingTransactionInformation(txId).do()) as PendingTransactionResponse
    if (pendingInfo !== undefined) {
      const confirmedRound = pendingInfo['confirmed-round']
      if (confirmedRound && confirmedRound > 0) {
        return pendingInfo
      } else {
        const poolError = pendingInfo['pool-error']
        if (poolError != null && poolError.length > 0) {
          // If there was a pool error, then the transaction has been rejected!
          throw new Error('Transaction ' + txId + ' rejected - pool error: ' + poolError)
        }
      }
    }
    await client.statusAfterBlock(currentround).do()
    currentround++
  }
  throw new Error('Transaction ' + txId + ' not confirmed after ' + timeout + ' rounds!')
}
