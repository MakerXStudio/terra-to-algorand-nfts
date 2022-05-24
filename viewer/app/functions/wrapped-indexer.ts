import { Indexer } from 'algosdk'
import Bottleneck from 'bottleneck'
import { DecorateAll } from 'decorate-all'

const limiter = new Bottleneck()
limiter.on('failed', async (error, jobInfo) => {
  // 429 == rate limit
  if (error.status === 429 && error.response?.request?.method === 'GET' && jobInfo.retryCount < 5) return 250
})

const RateLimit = function (target: any, propertyKey: string, descriptor?: PropertyDescriptor): void {
  if (!descriptor) return
  const original = descriptor.value
  descriptor.value = function () {
    const call = original.apply(this, arguments)
    const originalDo = call.do
    call.do = limiter.wrap(originalDo)
    return call
  }
}

@DecorateAll(RateLimit, { deep: true })
export default class WrappedIndexer extends Indexer {}
