import algosdk, { Account, Algodv2, Transaction } from 'algosdk'
import { sendTransaction } from './transaction'

interface TransferParams {
  from: Account
  to: string
  amount: number
  note?: string
  skipSending?: boolean
  skipWaiting?: boolean
}

export async function transfer(
  { from, to, amount, note, skipWaiting, skipSending }: TransferParams,
  client: Algodv2
): Promise<Transaction> {
  const params = await client.getTransactionParams().do()

  const encoder = new TextEncoder()

  const transaction = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: from.addr,
    to: to,
    amount: amount,
    closeRemainderTo: undefined,
    note: note ? encoder.encode(note) : undefined,
    suggestedParams: params,
    rekeyTo: undefined,
  })

  if (!skipSending) await sendTransaction(client, transaction, from, skipWaiting)

  return transaction
}
