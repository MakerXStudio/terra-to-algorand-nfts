import algosdk, { Account, Algodv2 } from 'algosdk'
import { DISPENSER_ACCOUNT } from '../constants'
import { getKmdClient } from './client'
import { isReachSandbox, isSandbox } from './network'
import { transfer } from './transfer'

// https://developer.algorand.org/docs/get-details/accounts/#special-accounts
export const ZERO_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'

export function getAccountFromMnemonic(mnemonic: string): Account {
  return algosdk.mnemonicToSecretKey(mnemonic)
}

export async function getOrCreateKmdWalletAccount(client: Algodv2, name: string): Promise<Account> {
  const existing = await getKmdWalletAccount(client, name)
  if (existing) {
    return existing
  }

  const kmd = getKmdClient()
  const walletId = (await kmd.createWallet(name, '')).wallet.id
  const walletHandle = (await kmd.initWalletHandle(walletId, '')).wallet_handle_token
  await kmd.generateKey(walletHandle)

  const account = (await getKmdWalletAccount(client, name))!

  await transfer(
    { amount: algosdk.algosToMicroalgos(1000), from: await getDispenserAccount(client), to: account.addr },
    client
  )

  return account
}

export async function getKmdWalletAccount(
  client: Algodv2,
  name: string,
  predicate?: (account: Record<string, any>) => boolean
): Promise<Account | undefined> {
  const kmd = getKmdClient()
  const wallets = await kmd.listWallets()

  const wallet = wallets.wallets.filter((w: any) => w.name === name)
  if (wallet.length === 0) {
    return undefined
  }

  const walletId = wallet[0].id

  const walletHandle = (await kmd.initWalletHandle(walletId, '')).wallet_handle_token
  const keyIds = (await kmd.listKeys(walletHandle)).addresses

  let i = 0
  if (predicate) {
    for (i = 0; i < keyIds.length; i++) {
      const key = keyIds[i]
      const account = await client.accountInformation(key).do()
      if (predicate(account)) {
        break
      }
    }
  }

  if (i >= keyIds.length) {
    return undefined
  }

  const accountKey = (await kmd.exportKey(walletHandle, '', keyIds[i])).private_key

  const accountMnemonic = algosdk.secretKeyToMnemonic(accountKey)
  return getAccountFromMnemonic(accountMnemonic)
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

  // Sandbox starts with a single wallet called 'unencrypted-default-wallet', with heaps of tokens
  // When you create accounts using goal they get added to this wallet so check for an account with lots of ALGOs
  return (await getKmdWalletAccount(
    client,
    'unencrypted-default-wallet',
    (a) => a.status !== 'Offline' && a.amount > 1000_000_000
  ))!
}

export async function getAccount(client: Algodv2, name: string): Promise<Account> {
  const envKey = `${name.toUpperCase()}_MNEMONIC`
  if (process.env[envKey]) {
    return getAccountFromMnemonic(process.env[envKey]!)
  }

  // If running on Sandbox then automatically and idempotently generate an account
  if (await isSandbox(client)) {
    const account = await getOrCreateKmdWalletAccount(client, name)
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

  const dispenser = await getDispenserAccount(client)

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

export async function getDispenserAccount(client: Algodv2) {
  // If we are running against a sandbox we can use the default account within it, otherwise use an automation account specified via environment variables and ensure it's populated with ALGOs
  const canFundFromDefaultAccount = await isSandbox(client)
  return canFundFromDefaultAccount
    ? await getSandboxDefaultAccount(client)
    : await getAccount(client, DISPENSER_ACCOUNT)
}

export function getAccountAddressAsUint8Array(account: Account) {
  return algosdk.decodeAddress(account.addr).publicKey
}

export function getAccountAddressAsString(addressEncodedInB64: string): string {
  return algosdk.encodeAddress(Buffer.from(addressEncodedInB64, 'base64'))
}
