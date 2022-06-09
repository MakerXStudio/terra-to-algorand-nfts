import algosdk, { Account, Algodv2, Kmd } from 'algosdk'
import { getAlgoClient } from './algo-client'

// https://developer.algorand.org/docs/get-details/accounts/#special-accounts
export const ZERO_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'

export function getAccountFromMnemonic(mnemonic: string): Account {
  return algosdk.mnemonicToSecretKey(mnemonic)
}

function getKmdClient() {
  return new Kmd(
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'http://localhost',
    process.env.KMD_PORT ?? '4002'
  )
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

export function getAccountAddressAsUint8Array(account: Account) {
  return algosdk.decodeAddress(account.addr).publicKey
}

export function getAccountAddressAsString(addressEncodedInB64: string): string {
  return algosdk.encodeAddress(Buffer.from(addressEncodedInB64, 'base64'))
}
