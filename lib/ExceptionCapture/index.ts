import {
  type Exception,
  ExceptionType,
  type ResourceErrorTarget,
  type MetadataObject
} from './types.d'
import { type Context, type Middleware } from '../Middleware/types'
import MiddlewareManager from '../Middleware'

class ExceptionCapture {
  private exceptions: Exception[] = []
  private exceptionUids: Set<string> = new Set()
  private ctx: Context
  private middlewareManager: MiddlewareManager<Context>
  constructor(ctx: Context) {
    this.ctx = ctx
    ctx.exceptions = this.exceptions
    this.middlewareManager = new MiddlewareManager<Context>()
    // 初始化js错误
    this.initJsError()
    // 初始化资源错误
    this.initResourceError()
    // 初始化Promise错误
    this.initPromiseError()
    // 初始化HTTP错误
    this.initHttpError()
    // 初始化CORS错误
    this.initCorsError()
  }

  // 初始化js错误
  private initJsError() {
    const handleError = (event: ErrorEvent | Event) => {
      // 阻止控制台报错
      event.preventDefault()
      if (this.getExceptionType(event) !== ExceptionType.JS) {
        return
      }

      const errorEvent = event as ErrorEvent
      const metadata = {
        uid: this.generateExceptionUid(
          `${ExceptionType.JS}-${errorEvent.message}-${errorEvent.filename}`
        )
      }
      if (!this.uniqueExceptionUids(metadata.uid)) {
        return
      }

      this.pushAndTriggerException({ event: errorEvent, metadata, type: ExceptionType.JS })
    }
    window.addEventListener('error', handleError, true)
  }

  // 初始化资源错误
  private initResourceError() {
    const handleError = (event: ErrorEvent | Event) => {
      // 阻止控制台报错
      event.preventDefault()
      if (this.getExceptionType(event) !== ExceptionType.RS) {
        return
      }
      const target = event.target as ResourceErrorTarget
      const metadata = {
        uid: this.generateExceptionUid(`${ExceptionType.RS}-${target.src}-${target.tagName}`)
      }
      if (!this.uniqueExceptionUids(metadata.uid)) {
        return
      }

      this.pushAndTriggerException({ event, metadata, type: ExceptionType.RS })
    }
    window.addEventListener('error', handleError, true)
  }

  // 初始化Promise错误
  private initPromiseError() {
    const handleError = (event: PromiseRejectionEvent) => {
      // 阻止控制台报错
      event.preventDefault()

      const type = event.reason.name ?? 'Unknown'
      const value = event.reason.message ?? event.reason
      const metadata = {
        uid: this.generateExceptionUid(`${ExceptionType.UJ}-${type}-${value}`)
      }
      if (!this.uniqueExceptionUids(metadata.uid)) {
        return
      }

      this.pushAndTriggerException({ event, metadata, type: ExceptionType.UJ })
    }
    window.addEventListener('unhandledrejection', handleError, true)
  }

  // 初始化HTTP错误
  private initHttpError() {}

  // 初始化CORS错误
  private initCorsError() {
    const handleError = (event: ErrorEvent | Event) => {
      // 阻止控制台报错
      event.preventDefault()
      if (this.getExceptionType(event) !== ExceptionType.CS) {
        return
      }

      const errorEvent = event as ErrorEvent
      const metadata = {
        uid: this.generateExceptionUid(`${ExceptionType.CS}-${errorEvent.message}`)
      }
      if (!this.uniqueExceptionUids(metadata.uid)) {
        return
      }

      this.pushAndTriggerException({ event, metadata, type: ExceptionType.CS })
    }
    window.addEventListener('error', handleError, true)
  }

  // error事件会捕获到js错误，跨域js错误和静态资源加载错误
  private getExceptionType(event: ErrorEvent | Event): ExceptionType {
    const isJsException = event instanceof ErrorEvent
    if (!isJsException) {
      return ExceptionType.RS // 静态资源加载错误
    }
    return event.message === 'Script error.' ? ExceptionType.CS : ExceptionType.JS
  }

  // 初始化异常上下文
  private initContext({
    event,
    metadata,
    type
  }: {
    event: ErrorEvent | Event
    metadata: MetadataObject
    type: ExceptionType
  }): Exception {
    return {
      error: event,
      timestamp: Date.now(),
      metadata,
      processed: false,
      shouldReport: true,
      type
    }
  }

  // 生成异常uid
  private generateExceptionUid(id: string) {
    return window.btoa(encodeURIComponent(id)) + Date.now()
  }

  // 检查异常uid是否存在, 如果存在，加入uid，返回true，否则返回false
  private uniqueExceptionUids(uid: string) {
    if (!this.exceptionUids.has(uid)) {
      this.exceptionUids.add(uid)
      return true
    }
    return false
  }

  // 添加并处理异常
  private pushAndTriggerException({
    event,
    metadata,
    type
  }: {
    event: ErrorEvent | Event
    metadata: MetadataObject
    type: ExceptionType
  }) {
    // 添加异常到数组
    const exception = this.initContext({ event, metadata, type })
    this.exceptions.push(exception)

    this.middlewareManager.execute(this.ctx)
  }

  // 使用中间件
  public use(middleware: Middleware<Context>) {
    this.middlewareManager.use(middleware)
  }
}

export { ExceptionCapture }
