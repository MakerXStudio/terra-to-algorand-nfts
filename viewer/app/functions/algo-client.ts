import { Algodv2, Indexer } from 'algosdk'
import WrappedIndexer from './wrapped-indexer'

export function getAlgoClient(): Algodv2 {
  // Purestake uses a slightly different API key header than the default
  // We are using Purestake to talk to testnet and mainnet so we don't have to stand up our own node
  const algodToken = process.env.ALGOD_SERVER!.includes('purestake.io')
    ? { 'X-API-Key': process.env.ALGOD_TOKEN! }
    : process.env.ALGOD_TOKEN!
  const algodServer = process.env.ALGOD_SERVER!
  const algodPort = process.env.ALGOD_PORT!

  return new Algodv2(algodToken, algodServer, algodPort)
}

export function getIndexerClient(): Indexer {
  // Purestake uses a slightly different API key header than the default
  // We are using Purestake to talk to testnet and mainnet so we don't have to stand up our own node
  const indexerToken = process.env.INDEXER_SERVER!.includes('purestake.io')
    ? { 'X-API-Key': process.env.INDEXER_TOKEN! }
    : process.env.INDEXER_TOKEN!
  const indexerServer = process.env.INDEXER_SERVER!
  const indexerPort = process.env.INDEXER_PORT!

  // Purestake has restrictive rate limits so we need to handle them if using that
  return process.env.INDEXER_SERVER!.includes('purestake.io')
    ? new WrappedIndexer(indexerToken, indexerServer, indexerPort)
    : new Indexer(indexerToken, indexerServer, indexerPort)
}
