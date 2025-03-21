import MiddlewareManager from '@/Middleware'
import { type ExceptionContext, ExceptionType } from './types'
import { type Middleware } from '@/Middleware/types'

// 捕获错误
class ExceptionCapture {
  private middlewareManager: MiddlewareManager<ExceptionContext>

  constructor() {
    this.middlewareManager = new MiddlewareManager<ExceptionContext>()
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

  // 使用中间件
  public use(middleware: Middleware<ExceptionContext>) {
    this.middlewareManager.use(middleware)
  }

  // 初始化js错误
  private initJsError() {
    window.addEventListener(
      'error',
      (event) => {
        // 阻止控制台报错
        event.preventDefault()
        if (this.getExceptionType(event) !== ExceptionType.JS) {
          return
        }
        this.middlewareManager.execute(this.initContext(event))
      },
      true
    )
  }

  // 初始化资源错误
  private initResourceError() {
    window.addEventListener('error', (event) => {
      // 阻止控制台报错
      event.preventDefault()
      if (this.getExceptionType(event) !== ExceptionType.RS) {
        return
      }
      this.middlewareManager.execute(this.initContext(event))
    })
  }

  // 初始化Promise错误
  private initPromiseError() {
    window.addEventListener('unhandledrejection', (event) => {
      // 阻止控制台报错
      event.preventDefault()
      this.middlewareManager.execute(this.initContext(event))
    })
  }

  // 初始化HTTP错误
  private initHttpError() {}

  // 初始化CORS错误
  private initCorsError() {}

  // error事件会捕获到js错误，跨域js错误和静态资源加载错误
  private getExceptionType(event: ErrorEvent | Event): ExceptionType {
    const isJsException = event instanceof ErrorEvent
    if (!isJsException) {
      return ExceptionType.RS // 静态资源加载错误
    }
    return event.message === 'Script error.' ? ExceptionType.CS : ExceptionType.JS
  }

  // 初始化异常上下文
  private initContext(event: ErrorEvent | Event): ExceptionContext {
    return {
      error: event,
      timestamp: Date.now(),
      metadata: {},
      processed: false,
      shouldReport: true
    }
  }
}

export default ExceptionCapture
