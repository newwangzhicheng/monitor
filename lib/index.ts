export enum mechanismType {
  JS = 'js',
  RS = 'resource',
  UJ = 'unhandledrejection',
  HP = 'http',
  CS = 'cors'
  // VUE = 'vue'
}

// 异常错误结构体
export interface ExceptionMetrics {
  mechanism: mechanismType // 错误
  value?: string // 错误值
  type: string // 错误类型
  stackTrace?: object // 错误堆栈
  errorUid: string // 错误id
  meta?: any // 错误元数据
}

// 初始化类
export default class ErrorVitals {
  // 上报错误的实例
  private engineInstance: any
  // 已上报错误id
  private submitErrorUids: Array<string>

  constructor(engineInstance: any) {
    this.engineInstance = engineInstance
    this.submitErrorUids = []
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

  // 错误上报
  // private errorSendHandler(data: ExceptionMetrics) {}

  private initJsError() {}

  private initResourceError() {}

  private initPromiseError() {}

  private initHttpError() {}

  private initCorsError() {}
}
