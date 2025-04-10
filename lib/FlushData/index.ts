import { type Context, type Middleware } from '@/Middleware/types'
import {
  ExceptionType,
  ResourceErrorTarget,
  type Exception,
  type RequestInfo
} from '../ExceptionCapture/types.d'
import {
  type FlushedJsExceptionStack,
  type FlushedJsException,
  type FlushedRsException,
  type FlushedUjException,
  type FlushedHpException
} from './types.d'

function flushDataMiddleware(): Middleware<Context> {
  return {
    name: 'flushData',
    process: async (ctx, next) => {
      const flushData = new FlushData(ctx)
      flushData.flushException()
      await next()
    }
  }
}

class FlushData {
  private readonly ctx: Context
  constructor(ctx: Context) {
    this.ctx = ctx
  }

  // 刷新异常数据
  public flushException() {
    if (!this.ctx.exceptions) {
      return []
    }
    const flushedData = this.ctx.exceptions.map((exception) => {
      switch (exception.type) {
        case ExceptionType.JS:
          return this.flushJsException(exception)
        case ExceptionType.RS:
          return this.flushRsException(exception)
        case ExceptionType.UJ:
          return this.flushUjException(exception)
        case ExceptionType.HP:
          return this.flushHpException(exception)
        default:
          return null
      }
    })
    this.ctx.flushedData = flushedData
  }

  // js错误
  private flushJsException(exception: Exception): FlushedJsException {
    const error = exception.error as ErrorEvent
    return {
      stacks: this.parseExceptionStack(error.error.stack)
    }
  }

  // 资源错误
  private flushRsException(exception: Exception): FlushedRsException {
    const error = exception.error as ErrorEvent
    const target = error.target as ResourceErrorTarget
    return {
      src: target.src ?? '',
      tagName: target.tagName ?? '',
      outerHTML: target.outerHTML ?? ''
    }
  }

  // 未捕获异常
  private flushUjException(exception: Exception): FlushedUjException {
    const error = exception.error as PromiseRejectionEvent
    const reason = error.reason.message
    return {
      reason,
      stacks: this.parseExceptionStack(error.reason.stack)
    }
  }

  // http错误
  private flushHpException(exception: Exception): FlushedHpException {
    const { headers, ...rest } = exception.error as RequestInfo
    const error = (exception.error as RequestInfo).error
    const flushedHpException = {
      ...rest,
      headers: this.desensitizeHeaders(this.switchHeaders(headers)),
      reason: error?.message ?? ''
    }
    delete flushedHpException.error
    return flushedHpException
  }

  // HeadersInit转换为Record<string, string>
  private switchHeaders(headers: HeadersInit | undefined) {
    // [string, string][] | Record<string, string> | Headers
    if (headers instanceof Headers) {
      return Object.fromEntries(headers.entries())
    } else if (Array.isArray(headers)) {
      return Object.fromEntries(headers)
    } else if (headers) {
      return headers
    }
    return {}
  }

  // 脱敏headers
  private desensitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-token',
      'x-csrf-token',
      'x-xsrf-token',
      'x-user-id',
      'x-uid'
    ]
    const desensitizedHeaders: Record<string, string> = {}
    for (const key of Object.keys(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        desensitizedHeaders[key] = '****'
      } else {
        desensitizedHeaders[key] = headers[key]
      }
    }
    return desensitizedHeaders
  }

  // 解析异常栈行，获取文件名，函数名，行，列信息
  private parseExceptionStackLine(line: string): FlushedJsExceptionStack | null {
    if (!line.trim().startsWith('at')) {
      return null
    }
    try {
      const tokens = line.trim().split(/\s+/)
      const functionName = tokens.length === 3 ? tokens?.[1] : ''

      // 获取文件名，行，列信息
      const [_, filename, lineno, colno] = tokens
        .at(-1)
        ?.replace(/^\(|\)$/g, '')
        .match(/^(.+):(\d+):(\d+)$/) ?? ['', 0, 0]

      return {
        filename,
        functionName,
        lineno: Number(lineno),
        colno: Number(colno)
      } as FlushedJsExceptionStack
    } catch (error) {
      return {
        filename: '',
        functionName: '',
        lineno: 0,
        colno: 0
      }
    }
  }

  // 解析异常栈，获取文件名，函数名，行，列信息,最长10行
  private parseExceptionStack(stack: string): FlushedJsExceptionStack[] {
    const lines = stack.split('\n')
    const result = []
    for (const line of lines) {
      const parsedLine = this.parseExceptionStackLine(line)
      if (parsedLine) {
        result.push(parsedLine)
      }
      if (result.length >= 10) {
        break
      }
    }
    return result
  }
}

export { flushDataMiddleware }
