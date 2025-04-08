// 错误类型
enum ExceptionType {
  JS = 'js',
  RS = 'resource',
  UJ = 'unhandledrejection',
  HP = 'http',
  CS = 'cors' // 跨域脚本错误,跨域的脚本内部发生错误
}

interface Exception {
  readonly error: any // 原始的错误
  readonly timestamp: number // 错误发生时间, 时间戳
  type: ExceptionType // 错误类型
  metadata: object // 附加元数据，如环境等
  processed: boolean // 是否已处理
  shouldReport: boolean // 是否上报
}

// // 异常错误结构体
// export interface ExceptionData {
//   exception: ExceptionType // 错误
//   value?: string // 错误值
//   /**
//    * 如果不知道设置为'Unknown'
//    * js event.error?.name, SyntaxError,ReferenceError,RangeError,TypeError,URIError
//    * rs ResourceError
//    * uj event.reason?.name, PromiseRejectionEvent
//    */
//   type: string // 错误类型
//   stackTrace?: object // 错误堆栈
//   errorUid: string // 错误id
// }

// 资源错误Target
interface ResourceErrorTarget extends EventTarget {
  src?: string
  tagName?: string
  outerHTML?: string
}

export { ExceptionType, type Exception, type ResourceErrorTarget }
