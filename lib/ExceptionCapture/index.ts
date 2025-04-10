import {
  type Exception,
  ExceptionType,
  type ResourceErrorTarget,
  type MetadataObject,
  type RequestInfo,
  HTTPExceptionType
} from './types.d'
import { type Context, type Middleware } from '../Middleware/types'
import MiddlewareManager from '../Middleware'

class ExceptionCapture {
  private readonly exceptions: Exception[] = []
  private readonly exceptionUids: Set<string> = new Set()
  private readonly ctx: Context
  private readonly middlewareManager: MiddlewareManager<Context>
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
  private initHttpError() {
    // 劫持xhr
    this.injectXHR()
    // 劫持fetch
    this.injectFetch()
  }

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

  /**
   * 劫持xhr
   * open方法获取url method
   * setRequestHeader方法获取请求头
   * send方法获取请求发起时间
   * load事件获取4xx 5xx响应
   * error事件获取错误信息
   * timeout事件获取超时信息
   */
  private injectXHR() {
    const requestMap = new WeakMap<XMLHttpRequest, RequestInfo>()

    this.injectXHROpen(requestMap)
    this.injectSetRequestHeader(requestMap)
    this.injectXHRSend(requestMap)
  }

  // 劫持xhr的open方法
  private injectXHROpen(requestMap: WeakMap<XMLHttpRequest, RequestInfo>) {
    const originalXHROpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) {
      const requestInfo: RequestInfo = {
        url: url.toString(),
        method,
        headers: {},
        startTimestamp: 0,
        endTimestamp: 0,
        duration: 0,
        status: 0,
        statusText: '',
        httpExceptionType: HTTPExceptionType.UNKNOWN
      }
      requestMap.set(this, requestInfo)
      originalXHROpen.apply(this, [method, url, async, username, password])
    }
  }

  // 劫持xhr的setRequestHeader方法
  private injectSetRequestHeader(requestMap: WeakMap<XMLHttpRequest, RequestInfo>) {
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader
    XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string) {
      const requestInfo = requestMap.get(this)
      if (requestInfo) {
        ;(requestInfo.headers as Record<string, string>)[name] = value
      }
      originalSetRequestHeader.apply(this, [name, value])
    }
  }
  // 劫持xhr的send方法
  private injectXHRSend(requestMap: WeakMap<XMLHttpRequest, RequestInfo>) {
    const instance = this
    const originalXHRSend = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.send = function (
      body?: Document | XMLHttpRequestBodyInit | null
    ): void {
      const requestInfo = requestMap.get(this)
      if (requestInfo) {
        requestInfo.startTimestamp = Date.now()
      }
      this.addEventListener('load', (e) => instance.handleXHRStatusException(e, requestInfo))
      this.addEventListener('error', (e) => instance.handleXHRNetworkException(e, requestInfo))
      this.addEventListener('timeout', (e) => instance.handleXHRTimeoutException(e, requestInfo))
      originalXHRSend.apply(this, [body])
    }
  }

  // 处理XHR HTTP状态错误
  private handleXHRStatusException(event: Event, requestInfo: RequestInfo | undefined) {
    if (requestInfo) {
      const target = event.target as XMLHttpRequest
      requestInfo.endTimestamp = Date.now()
      requestInfo.duration = requestInfo.endTimestamp - requestInfo.startTimestamp
      requestInfo.statusText = target.statusText
      requestInfo.status = target.status
      requestInfo.httpExceptionType = HTTPExceptionType.STATUS
      this.pushAndTriggerHttpException(
        `${requestInfo.url}-${requestInfo.method}-${requestInfo.httpExceptionType}-${requestInfo.status}`,
        requestInfo
      )
    }
  }

  // 处理XHR网络错误
  private handleXHRNetworkException(_: Event, requestInfo: RequestInfo | undefined) {
    if (requestInfo) {
      requestInfo.endTimestamp = Date.now()
      requestInfo.duration = requestInfo.endTimestamp - requestInfo.startTimestamp
      requestInfo.httpExceptionType = HTTPExceptionType.NETWORK
      this.pushAndTriggerHttpException(
        `${requestInfo.url}-${requestInfo.method}-${requestInfo.httpExceptionType}`,
        requestInfo
      )
    }
  }

  // 处理XHR超时错误
  private handleXHRTimeoutException(_: Event, requestInfo: RequestInfo | undefined) {
    if (requestInfo) {
      requestInfo.endTimestamp = Date.now()
      requestInfo.duration = requestInfo.endTimestamp - requestInfo.startTimestamp
      requestInfo.httpExceptionType = HTTPExceptionType.TIMEOUT
      this.pushAndTriggerHttpException(
        `${requestInfo.url}-${requestInfo.method}-${requestInfo.httpExceptionType}`,
        requestInfo
      )
    }
  }

  private pushAndTriggerHttpException(uid: string, requestInfo: RequestInfo) {
    const metadata = {
      uid: this.generateExceptionUid(uid)
    }
    if (!this.uniqueExceptionUids(metadata.uid)) {
      return
    }

    this.pushAndTriggerException({ event: requestInfo, metadata, type: ExceptionType.HP })
  }

  // 劫持fetch
  private injectFetch() {
    const originalFetch = window.fetch
    const instance = this

    window.fetch = async function (input: globalThis.RequestInfo | URL, init?: RequestInit) {
      // 检查是否是上报请求，如果是则直接调用原始fetch
      if (init?.headers && typeof init.headers === 'object') {
        const headers = init.headers as Record<string, string>
        // 检查是否包含监控上报的特殊标记头
        if (headers['x-monitor-report'] === 'true') {
          // 是上报请求，直接调用原始fetch
          return originalFetch.apply(this, [input, init])
        }
      }

      let url = ''
      if (input instanceof Request) {
        url = input.url
      } else {
        url = input.toString()
      }
      const requestInfo: RequestInfo = {
        url,
        method: init?.method ?? 'GET',
        headers: init?.headers ?? {},
        startTimestamp: 0,
        endTimestamp: 0,
        duration: 0,
        status: 0,
        statusText: '',
        httpExceptionType: HTTPExceptionType.UNKNOWN
      }
      try {
        const response = await originalFetch.apply(this, [input, init])
        // fetch status error
        instance.handleFetchStatusException.bind(instance)(response, requestInfo)
        return response
      } catch (error) {
        instance.handleFetchNetworkAndTimeoutException.bind(instance)(error as Error, requestInfo)
        throw error
      }
    }
  }

  // 处理fetch HTTP状态错误
  private handleFetchStatusException(response: Response, requestInfo: RequestInfo) {
    if (response.status >= 400) {
      requestInfo.status = response.status
      requestInfo.statusText = response.statusText
      requestInfo.httpExceptionType = HTTPExceptionType.STATUS
      this.pushAndTriggerHttpException(
        `${requestInfo.url}-${requestInfo.method}-${requestInfo.httpExceptionType}`,
        requestInfo
      )
    }
  }

  // 处理fetch网络错误和超时错误
  private handleFetchNetworkAndTimeoutException(error: Error, requestInfo: RequestInfo) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      // fetch timeout
      requestInfo.httpExceptionType = HTTPExceptionType.TIMEOUT
    } else if (error.message === '"Failed to fetch"') {
      // fetch network error
      requestInfo.httpExceptionType = HTTPExceptionType.NETWORK
    }
    requestInfo.error = error
    this.pushAndTriggerHttpException(
      `${requestInfo.url}-${requestInfo.method}-${requestInfo.httpExceptionType}-${error}`,
      requestInfo
    )
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
    event: Event | RequestInfo
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
    event: Event | RequestInfo
    metadata: MetadataObject
    type: ExceptionType
  }) {
    // 添加异常到数组
    const exception = this.initContext({ event, metadata, type })
    this.exceptions.push(exception)
    this.ctx.currentException = exception
    this.middlewareManager.execute(this.ctx)
  }

  // 使用中间件
  public use(middleware: Middleware<Context>) {
    this.middlewareManager.use(middleware)
    return this
  }
}

export { ExceptionCapture }
