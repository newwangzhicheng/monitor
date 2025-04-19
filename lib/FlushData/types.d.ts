import { type ExceptionType } from '@/ExceptionCapture/types'
import { type PerformanceMetrics } from '@/PerformanceMetricsCapture/types'

interface FlushedData {
  pageInfo: PageInfo
  flushed: FlushedException | PerformanceMetrics
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

interface FlushedBaseException {
  type: ExceptionType
}
interface FlushedJsException extends FlushedBaseException {
  stacks: FlushedJsExceptionStack[]
}

interface FlushedRsException extends FlushedBaseException {
  src: string
  tagName: string
  outerHTML: string
}

interface FlushedUjException extends FlushedBaseException {
  reason: string
  stacks: FlushedUjExceptionStack[]
}

interface FlushedHpException extends FlushedBaseException {
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
