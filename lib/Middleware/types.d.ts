import { type Exception } from '@/ExceptionCapture/types'
import { type FlushedData } from '@/FlushData/types'
import { type PerformanceMetrics } from '@/PerformanceMetricsCapture/types'
interface Middleware<T> {
  name: string // 中间件名称
  priority?: number // 中间件优先级，数字越大，优先级越高
  process: Process<T> // 中间件处理函数
}

interface Context {
  exceptions?: Exception[] // 所有的异常
  currentException?: Exception // 当前异常
  flushedExceptions?: FlushedData[] // 所有刷新后的异常数据
  currentFlushedException?: FlushedData // 当前刷新后的异常数据

  performanceMetrics?: PerformanceMetrics // 性能指标
  flushedPerformanceMetrics?: FlushedData // 刷新后的性能指标

  report?: RequestParams // 上报参数

  exception?: boolean // 是否开启异常监控
  performanceMetrics?: boolean // 是否开启性能指标监控

  // [key: string]: any
}

type Process<T> = (context: T, next: Next) => Promise<void> | void

type Next = () => Promise<void> | void

export { type Middleware, type Next, type Process, type Context }
