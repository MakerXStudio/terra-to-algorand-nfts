import algosdk, { Algodv2, Indexer, Kmd } from 'algosdk'
import WrappedIndexer from './wrapped-indexer'

export function getAlgodConnectionConfiguration() {
  // Purestake uses a slightly different API key header than the default
  // We are using Purestake to talk to testnet and mainnet so we don't have to stand up our own node
  const algodToken = process.env.ALGOD_SERVER!.includes('purestake.io')
    ? { 'X-API-Key': process.env.ALGOD_TOKEN! }
    : process.env.ALGOD_TOKEN!
  const algodServer = process.env.ALGOD_SERVER!
  const algodPort = process.env.ALGOD_PORT!
  return {
    algodToken,
    algodServer,
    algodPort,
  }
}

export function getIndexerConnectionConfiguration() {
  // Purestake uses a slightly different API key header than the default
  // We are using Purestake to talk to testnet and mainnet so we don't have to stand up our own node
  const indexerToken = process.env.INDEXER_SERVER!.includes('purestake.io')
    ? { 'X-API-Key': process.env.INDEXER_TOKEN! }
    : process.env.INDEXER_TOKEN!
  const indexerServer = process.env.INDEXER_SERVER!
  const indexerPort = process.env.INDEXER_PORT!
  return {
    indexerToken,
    indexerServer,
    indexerPort,
  }
}

export async function getAlgoClient(): Promise<Algodv2> {
  const { algodToken, algodServer, algodPort } = getAlgodConnectionConfiguration()
  return new algosdk.Algodv2(algodToken, algodServer, algodPort)
}

export async function getIndexerClient(): Promise<Indexer> {
  const { indexerToken, indexerServer, indexerPort } = getIndexerConnectionConfiguration()
  // Purestake has restrictive rate limits so we need to handle them if using that
  return process.env.INDEXER_SERVER!.includes('purestake.io')
    ? new WrappedIndexer(indexerToken, indexerServer, indexerPort)
    : new Indexer(indexerToken, indexerServer, indexerPort)
}

// KMD client allows you to export private keys, which is useful to get the default account in a sandbox network
export function getKmdClient(): Kmd {
  // We can only use Kmd on the Sandbox otherwise it's not exposed so this makes some assumptions (e.g. same token and server as algod and port 4002)
  return new Kmd(process.env.ALGOD_TOKEN!, process.env.ALGOD_SERVER!, '4002')
}
