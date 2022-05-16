import { Algodv2 } from 'algosdk'

export async function isSandbox(client: Algodv2): Promise<boolean> {
  const params = await client.getTransactionParams().do()

  return params.genesisID === 'devnet-v1' || params.genesisID === 'sandnet-v1'
}

export async function isReachSandbox(client: Algodv2): Promise<boolean> {
  const params = await client.getTransactionParams().do()

  return params.genesisHash === 'lgTq/JY/RNfiTJ6ZcZ/Er8uR775Hk76c7MvHVWjvjCA='
}
