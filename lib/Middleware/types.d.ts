import { type Exception } from '@/ExceptionCapture/types'

interface Middleware<T> {
  name: string // 中间件名称
  priority?: number // 中间件优先级，数字越大，优先级越高
  process: Process<T> // 中间件处理函数
}

interface Context {
  exceptionHandler?: (ctx: any) => void
  exceptions?: Exception[]
  [key: string]: any
}

type Process<T> = (context: T, next: Next) => Promise<void> | void

type Next = () => Promise<void> | void

export { type Middleware, type Next, type Process, type Context }
