type FlushedException = FlushedJsException | FlushedRsException | FlushedUjException

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
  type FlushedException,
  type FlushedJsException,
  type FlushedJsExceptionStack,
  type FlushedRsException,
  type FlushedUjException
}
