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
  type FlushedHpException,
  type PageInfo,
  type FlushedData,
  FlushedException
} from './types.d'

function flushDataMiddleware({
  type
}: {
  type: 'exception' | 'performanceMetrics'
}): Middleware<Context> {
  return {
    name: 'flushData',
    process: async (ctx, next) => {
      const flushData = new FlushData(ctx)
      switch (type) {
        case 'exception':
          flushData.flushException()
          break
        case 'performanceMetrics':
          flushData.flushPerformanceMetrics()
          break
      }
      await next()
    }
  }
}

class FlushData {
  private readonly ctx: Context
  private flushedExceptions: FlushedData[] = []
  constructor(ctx: Context) {
    this.ctx = ctx
  }

  // 刷新异常数据
  public flushException() {
    if (!this.ctx.currentException) {
      return
    }
    this.ctx.flushedExceptions = this.flushedExceptions
    const exception = this.ctx.currentException
    let flushedException: FlushedException | null = null
    switch (exception.type) {
      case ExceptionType.JS:
        flushedException = this.flushJsException(exception)
        break
      case ExceptionType.RS:
        flushedException = this.flushRsException(exception)
        break
      case ExceptionType.UJ:
        flushedException = this.flushUjException(exception)
        break
      case ExceptionType.HP:
        flushedException = this.flushHpException(exception)
        break
      default:
        break
    }
    this.ctx.currentFlushedException = {
      pageInfo: this.getPageInfo(),
      flushed: flushedException as FlushedException
    }
    this.flushedExceptions.push(this.ctx.currentFlushedException)
    this.limitDataSize(100)
  }

  // 刷新性能指标
  public flushPerformanceMetrics() {
    if (!this.ctx.performanceMetrics) {
      return
    }
    this.ctx.flushedPerformanceMetrics = {
      pageInfo: this.getPageInfo(),
      flushed: this.ctx.performanceMetrics
    }
  }

  // 限制异常数据大小
  private limitDataSize(size: number) {
    if (this.flushedExceptions.length > size) {
      this.flushedExceptions = this.flushedExceptions.slice(-size)
    }
    if (this.ctx.exceptions) {
      this.ctx.exceptions = this.ctx.exceptions.slice(-size)
    }
  }

  // js错误
  private flushJsException(exception: Exception): FlushedJsException {
    const error = exception.error as ErrorEvent
    return {
      type: ExceptionType.JS,
      stacks: this.parseExceptionStack(error.error.stack)
    }
  }

  // 资源错误
  private flushRsException(exception: Exception): FlushedRsException {
    const error = exception.error as ErrorEvent
    const target = error.target as ResourceErrorTarget
    return {
      type: ExceptionType.RS,
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
      type: ExceptionType.UJ,
      reason,
      stacks: this.parseExceptionStack(error.reason.stack)
    }
  }

  // http错误
  private flushHpException(exception: Exception): FlushedHpException {
    const { headers, ...rest } = exception.error as RequestInfo
    const error = (exception.error as RequestInfo).error
    const flushedHpException = {
      type: ExceptionType.HP,
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

  // 获取页面信息
  private getPageInfo(): PageInfo {
    return {
      href: window.location.href,
      userAgent: navigator.userAgent
    }
  }
}

export { flushDataMiddleware }
