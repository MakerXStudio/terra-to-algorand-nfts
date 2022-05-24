import { format, formatDistance, formatISO, parseISO } from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'

export function convertBigNumToNumber(num: bigint, decimals: number): number {
  const singleUnit = BigInt('1' + '0'.repeat(decimals))
  const wholeUnits = num / singleUnit

  return parseInt(wholeUnits.toString())
}

export function formatBigNumWithDecimals(num: bigint, decimals: number): string {
  const singleUnit = BigInt('1' + '0'.repeat(decimals))
  const wholeUnits = num / singleUnit
  const fractionalUnits = num % singleUnit

  return wholeUnits.toString() + '.' + fractionalUnits.toString().padStart(decimals, '0')
}

export function ellipseAddress(address = '', start = 5, end = 5): string {
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function getDate(date: Date | string | number): Date {
  return typeof date === 'string' ? new Date(date) : typeof date === 'number' ? new Date(date * 1000) : date
}

export function formatDate(date: Date | string | number): string {
  return format(getDate(date), 'PPPPpppp')
}

export function formatDateAsUTC(date: Date | string | number): string {
  return getDate(date).toUTCString()
}

export function formatDateRelative(date: Date | string | number): string {
  return formatDistance(getDate(date), new Date(), { addSuffix: true })
}

export function convertToBoolean(input: string): boolean | undefined {
  try {
    return JSON.parse(input)
  } catch (e) {
    return undefined
  }
}

export function dateIsNotInvalid(value: Date) {
  return isFinite(value.valueOf())
}

export function formatISODate(date: Date) {
  return formatISO(date, { representation: 'date' })
}

export function tryFormatISODate(date: Date | undefined) {
  if (date !== undefined) {
    return formatISODate(date)
  }
}

export function tryParseISO(value: string | undefined): Date | undefined {
  if (value !== undefined) {
    const date = parseISO(value)
    if (dateIsNotInvalid(date)) {
      return date
    }
  }
}

/* This returns a "fake" date which will display a date as UTC equivilent, using the local timezone */
export function tryGetDateAsUTC(date: Date | string | number | undefined): Date | undefined {
  if (date !== undefined) {
    // far from ideal. But seems to work in most browsers https://stackoverflow.com/questions/1091372/getting-the-clients-time-zone-and-offset-in-javascript
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const utcDate = zonedTimeToUtc(getDate(date), localTz)
    if (dateIsNotInvalid(utcDate)) {
      return utcDate
    }
  }
}

export function unique<T>(values: T[]) {
  return [...new Set(values)]
}

export function compactMap<TIn, TOut>(items: TIn[], callbackFn: (item: TIn) => TOut | undefined): TOut[] {
  return items.reduce((lst: TOut[], item: TIn) => {
    const transformed = callbackFn(item)
    if (transformed !== undefined) {
      lst.push(transformed)
    }
    return lst
  }, [])
}

// https://gist.github.com/kottenator/9d936eb3e4e3c3e02598?permalink_comment_id=3238804#gistcomment-3238804
export function pagination(currentPage: number, pageCount: number): (number | null)[] {
  if (pageCount === 0) {
    return [1]
  }

  let delta: number
  if (pageCount <= 7) {
    // delta === 7: [1 2 3 4 5 6 7]
    delta = 7
  } else {
    // delta === 2: [1 ... 4 5 6 ... 10]
    // delta === 4: [1 2 3 4 5 ... 10]
    delta = currentPage > 4 && currentPage < pageCount - 3 ? 2 : 4
  }

  const range = {
    start: Math.round(currentPage - delta / 2),
    end: Math.round(currentPage + delta / 2),
  }

  if (range.start - 1 === 1 || range.end + 1 === pageCount) {
    range.start += 1
    range.end += 1
  }

  let pages: (number | null)[] =
    currentPage > delta
      ? getRange(Math.min(range.start, pageCount - delta), Math.min(range.end, pageCount))
      : getRange(1, Math.min(pageCount, delta + 1))

  const withDots = (value: any, pair: any) => (pages.length + 1 !== pageCount ? pair : [value])

  if (pages[0] !== 1) {
    pages = withDots(1, [1, null]).concat(pages)
  }

  let last = pages[pages.length - 1]
  if (last !== null && last < pageCount) {
    pages = pages.concat(withDots(pageCount, [null, pageCount]))
  }

  return pages
}

export function getRange(start: number, end: number): number[] {
  return Array(end - start + 1)
    .fill(0)
    .map((_, i) => i + start)
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function convertMicroAlgoToAlgo(microAlgoValue: number): number {
  return microAlgoValue / 1000000
}

export function tryParseInt(value: string | undefined): number | undefined {
  const n = Number(value)
  if (Number.isInteger(n)) {
    return n
  }
}
