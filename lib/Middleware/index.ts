import { type Middleware } from './types'

/**
 * 中间件管理器
 * @description 管理中间件的添加、移除、排序和执行
 * @template T - 上下文类型
 */
class MiddlewareManager<T> {
  private middlewares: Middleware<T>[] = []

  // 添加
  public use(middleware: Middleware<T>) {
    this.middlewares.push(middleware)
    return this
  }

  // 移除
  public remove(middleware: Middleware<T>) {
    this.middlewares = this.middlewares.filter((m) => m !== middleware)
    return this
  }

  // 获取排序好的中间件，数字越大，优先级越高
  public getMiddlewares() {
    return this.middlewares.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }

  // 执行中间件链
  public async execute(context: T): Promise<T> {
    const sortedMiddlewares = this.getMiddlewares()
    let index = 0

    // 递归执行
    const executeNext = async (): Promise<void> => {
      if (index >= sortedMiddlewares.length) {
        return
      }
      const currentMiddleware = sortedMiddlewares[index]
      index++
      try {
        await currentMiddleware.process(context, executeNext)
      } catch (error) {
        console.error(`Middleware ${currentMiddleware.name} execution error:`, error)
        // 执行下一个中间件
        await executeNext()
      }
    }
    await executeNext()
    return context
  }
}

export default MiddlewareManager
