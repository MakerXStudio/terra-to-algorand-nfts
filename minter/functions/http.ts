import retry from 'async-retry'
import fetch from 'node-fetch'

async function retryer(url: string, fetchOptions: any = undefined, retries: number = 3): Promise<any> {
  const retryCodes = [403, 408, 500, 502, 503, 504, 522, 524]

  return await retry(
    async (bail) => {
      // if anything throws, it will retry if within the retry policy
      const response = await fetch(url, fetchOptions)
      if (response.ok) return response

      if (retryCodes.includes(response.status)) {
        throw new Error(`HTTP request: ${url} failed with HTTP response: ${response.statusText}.`)
      } else {
        bail(new Error(`HTTP request: ${url} failed with HTTP response: ${response.statusText}, will not retry`))
      }
    },
    {
      retries: retries,
      onRetry: (e, num) => {
        console.debug(`HTTP request failed. Retrying for #${num} time: ${e.message}`)
      },
    }
  )
}

export async function fetchWithRetry(url: string, fetchOptions: any = undefined, retries = 3): Promise<any> {
  return await retryer(url, fetchOptions, retries)
}
