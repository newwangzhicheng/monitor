interface Middleware<T> {
  name: string // 中间件名称
  priority?: number // 中间件优先级，数字越大，优先级越高
  process: Process<T> // 中间件处理函数
}

type Process<T> = (context: T, next: Next) => Promise<void> | void

type Next = () => Promise<void> | void

export { type Middleware, type Next, type Process }
