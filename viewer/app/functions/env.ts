export async function checkEnvVariables() {
  const env = process.env
  if (!env || !env.ALGOD_SERVER || !env.ALGOD_PORT || !env.INDEXER_SERVER || !env.INDEXER_PORT) {
    console.error(`Cannot find one or more of environment variables`)
  }
}
