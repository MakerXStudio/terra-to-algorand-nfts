import algosdk, { Account, Algodv2 } from 'algosdk'
import { FUNDING_ACCOUNT } from '../constants'
import { getKmdClient } from './client'
import { isReachSandbox, isSandbox } from './network'
import { transfer } from './transfer'

// https://developer.algorand.org/docs/get-details/accounts/#special-accounts
export const ZERO_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'

export function getAccountFromMnemonic(mnemonic: string): Account {
  return algosdk.mnemonicToSecretKey(mnemonic)
}

export async function getSandboxDefaultAccount(client: Algodv2): Promise<Account> {
  if (!(await isSandbox(client))) {
    throw "Can't get default account from non Sandbox network"
  }

  if (await isReachSandbox(client)) {
    // https://github.com/reach-sh/reach-lang/blob/master/scripts/devnet-algo/algorand_network/FAUCET.mnemonic
    return getAccountFromMnemonic(
      'frown slush talent visual weather bounce evil teach tower view fossil trip sauce express moment sea garbage pave monkey exercise soap lawn army above dynamic'
    )
  }

  const kmd = getKmdClient()
  const wallets = await kmd.listWallets()

  // Sandbox starts with a single wallet called 'unencrypted-default-wallet', with heaps of tokens
  const defaultWalletId = wallets.wallets.filter((w: any) => w.name === 'unencrypted-default-wallet')[0].id

  const defaultWalletHandle = (await kmd.initWalletHandle(defaultWalletId, '')).wallet_handle_token
  const defaultKeyIds = (await kmd.listKeys(defaultWalletHandle)).addresses

  // When you create accounts using goal they get added to this wallet so check for an account that's actually a default account
  let i = 0
  for (i = 0; i < defaultKeyIds.length; i++) {
    const key = defaultKeyIds[i]
    const account = await client.accountInformation(key).do()
    if (account.status !== 'Offline' && account.amount > 1000_000_000) {
      break
    }
  }

  const defaultAccountKey = (await kmd.exportKey(defaultWalletHandle, '', defaultKeyIds[i])).private_key

  const defaultAccountMnemonic = algosdk.secretKeyToMnemonic(defaultAccountKey)
  return getAccountFromMnemonic(defaultAccountMnemonic)
}

export async function getAccount(client: Algodv2, name: string): Promise<Account> {
  const envKey = `${name.toUpperCase()}_MNEMONIC`
  if (process.env[envKey]) {
    return getAccountFromMnemonic(process.env[envKey]!)
  }

  if (await isSandbox(client)) {
    console.log(`Generating test account for account ${name}`)
    const account = await getTestAccount({ client, initialFundsInAlgos: 10 })
    process.env[envKey] = algosdk.secretKeyToMnemonic(account.sk)
    return account
  }

  throw `Missing environment variable ${envKey} when looking for account ${name}`
}

interface getTestAccountParams {
  client: Algodv2
  initialFundsInMicroAlgos?: number
  initialFundsInAlgos?: number
  suppressLog?: boolean
}

export async function getTestAccount({
  client,
  initialFundsInMicroAlgos,
  initialFundsInAlgos,
  suppressLog,
}: getTestAccountParams): Promise<Account> {
  if (initialFundsInMicroAlgos === undefined) {
    initialFundsInMicroAlgos = algosdk.algosToMicroalgos(initialFundsInAlgos || 0)
  }

  const account = algosdk.generateAccount()
  if (!suppressLog) {
    console.log(
      `New test account created with address '${account.addr}' and mnemonic '${algosdk.secretKeyToMnemonic(
        account.sk
      )}'.`
    )
  }

  // If we are running against a sandbox we can use the default account within it, otherwise use an automation account specified via environment variables and ensure it's populated with ALGOs
  const canFundFromDefaultAccount = await isSandbox(client)
  const dispenser = canFundFromDefaultAccount
    ? await getSandboxDefaultAccount(client)
    : await getAccount(client, FUNDING_ACCOUNT)

  const txn = await transfer(
    { from: dispenser, to: account.addr, amount: initialFundsInMicroAlgos!, note: 'Funding test account' },
    client
  )

  const accountInfo = await client.accountInformation(account.addr).do()
  if (!suppressLog) {
    console.log('Test account funded; account balance: %d microAlgos', accountInfo.amount)
  }

  return account
}

export function getAccountAddressAsUint8Array(account: Account) {
  return algosdk.decodeAddress(account.addr).publicKey
}

export function getAccountAddressAsString(addressEncodedInB64: string): string {
  return algosdk.encodeAddress(Buffer.from(addressEncodedInB64, 'base64'))
}
