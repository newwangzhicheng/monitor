// 错误类型
enum ExceptionType {
  JS = 'js',
  RS = 'resource',
  UJ = 'unhandledrejection',
  HP = 'http',
  CS = 'cors' // 跨域脚本错误,跨域的脚本内部发生错误
}

interface Exception {
  readonly error: Event | RequestInfo // 原始的错误
  readonly timestamp: number // 错误发生时间, 时间戳
  type: ExceptionType // 错误类型
  metadata: MetadataObject // 附加元数据，如环境等
  processed: boolean // 是否已处理
  shouldReport: boolean // 是否上报
}

interface MetadataObject {
  uid: string // 错误id
  [key: string]: any
}

enum HTTPExceptionType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  STATUS = 'status',
  UNKNOWN = 'unknown'
}

interface RequestInfo {
  url: string
  method: string
  headers: Record<string, string> | HeadersInit
  startTimestamp: number
  endTimestamp: number
  duration: number
  status: number
  statusText: string
  httpExceptionType: HTTPExceptionType
  error?: Error
}

// 资源错误Target
interface ResourceErrorTarget extends EventTarget {
  src?: string
  tagName?: string
  outerHTML?: string
}

export {
  ExceptionType,
  type Exception,
  type ResourceErrorTarget,
  type MetadataObject,
  type RequestInfo,
  HTTPExceptionType
}
