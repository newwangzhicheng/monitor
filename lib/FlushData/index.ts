import { type Context, type Middleware } from '@/Middleware/types'
import { ExceptionType, ResourceErrorTarget, type Exception } from '../ExceptionCapture/types.d'
import {
  type FlushedJsExceptionStack,
  type FlushedJsException,
  type FlushedRsException,
  type FlushedUjException
} from './types.d'

function flushDataMiddleware(): Middleware<Context> {
  return {
    name: 'flushData',
    process: async (ctx, next) => {
      new FlushData(ctx)
      await next()
    }
  }
}

class FlushData {
  private ctx: Context
  constructor(ctx: Context) {
    this.ctx = ctx
    this.flushException()
  }

  // 刷新异常数据
  private flushException() {
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
        default:
          return null
      }
    })
    this.ctx.flushedData = flushedData
  }

  // js错误
  private flushJsException(exception: Exception): FlushedJsException {
    return {
      stacks: this.parseExceptionStack(exception.error.error.stack)
    }
  }

  // 资源错误
  private flushRsException(exception: Exception): FlushedRsException {
    const target = exception.error.target as ResourceErrorTarget
    return {
      src: target.src ?? '',
      tagName: target.tagName ?? '',
      outerHTML: target.outerHTML ?? ''
    }
  }

  // 未捕获异常
  private flushUjException(exception: Exception): FlushedUjException {
    const reason = exception.error.message
    console.log(exception.error.reason.stack)
    return {
      reason,
      stacks: this.parseExceptionStack(exception.error.reason.stack)
    }
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
