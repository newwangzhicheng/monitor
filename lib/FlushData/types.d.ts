interface FlushedData {
  pageInfo: PageInfo
  flushedExceptions: FlushedException
}

interface PageInfo {
  href: string
  userAgent: string
}

type FlushedException =
  | FlushedJsException
  | FlushedRsException
  | FlushedUjException
  | FlushedHpException

interface FlushedJsException {
  stacks: FlushedJsExceptionStack[]
}

interface FlushedRsException {
  src: string
  tagName: string
  outerHTML: string
}

interface FlushedUjException {
  reason: string
  stacks: FlushedUjExceptionStack[]
}

interface FlushedHpException {
  url: string
  method: string
  headers: Record<string, string>
  startTimestamp: number
  endTimestamp: number
  duration: number
  status: number
  statusText: string
  httpExceptionType: HTTPExceptionType
  reason: string
}

interface FlushedJsExceptionStack {
  filename: string
  functionName: string
  lineno: number
  colno: number
}

interface FlushedUjExceptionStack {
  filename: string
}
export {
  type FlushedData,
  type FlushedException,
  type FlushedJsException,
  type FlushedJsExceptionStack,
  type FlushedRsException,
  type FlushedUjException,
  type FlushedHpException,
  type PageInfo
}
