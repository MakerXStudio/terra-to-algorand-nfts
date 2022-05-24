import algosdk, { Account, Algodv2, Kmd } from 'algosdk'
import { getAlgoClient } from './algo-client'

// https://developer.algorand.org/docs/get-details/accounts/#special-accounts
export const ZERO_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'

export function getAccountFromMnemonic(mnemonic: string): Account {
  return algosdk.mnemonicToSecretKey(mnemonic)
}

function getKmdClient() {
  return new Kmd('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'http://localhost', '4002')
}

export interface Wallet {
  name: string
  addresses: WalletAddress[]
}

export interface WalletAddress {
  address: string
  balance: number
  createdAssets: number
  online: boolean
}

export async function getKmdWallets(): Promise<Wallet[]> {
  const client = getAlgoClient()
  const kmd = getKmdClient()
  const wallets = await kmd.listWallets()
  return Promise.all(
    wallets.wallets.map(async (w: any) => {
      const walletHandle = (await kmd.initWalletHandle(w.id, '')).wallet_handle_token
      const keyIds = (await kmd.listKeys(walletHandle)).addresses
      return {
        name: w.name,
        addresses: await Promise.all(
          keyIds.map(async (a: string) => {
            const account = await client.accountInformation(a).do()
            return {
              address: a,
              balance: algosdk.microalgosToAlgos(account.amount),
              createdAssets: account['created-assets'].length,
              online: account.status === 'Online',
            } as WalletAddress
          })
        ),
      }
    })
  )
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
