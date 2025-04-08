import { type Middleware } from './types'

/**
 * 中间件管理器
 * @description 管理中间件的添加、移除、排序和执行
 * @template T - 上下文类型
 */
class MiddlewareManager<T> {
  private middlewares: Middleware<T>[] = []
  private sortedMiddlewares: Middleware<T>[] = []

  // 添加
  public use(middleware: Middleware<T>) {
    this.middlewares.push(middleware)
    // 更新排序的中间件列表
    this.sortedMiddlewares = this.getMiddlewares()
    return this
  }

  // 移除
  public remove(middleware: Middleware<T>) {
    this.middlewares = this.middlewares.filter((m) => m !== middleware)
    // 更新排序的中间件列表
    this.sortedMiddlewares = this.getMiddlewares()
    return this
  }

  // 获取排序好的中间件，数字越大，优先级越高
  public getMiddlewares() {
    return this.middlewares.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }

  /**
   * 执行中间件链
   * 每次调用都会从头开始执行所有中间件
   */
  public async execute(context: T): Promise<T> {
    // 确保排序的中间件列表是最新的
    this.sortedMiddlewares = this.getMiddlewares()
    // 从第一个中间件开始执行
    await this.executeNext(context, 0)
    return context
  }

  /**
   * 执行中间件链中的下一个中间件
   * @param context 上下文
   * @param startIndex 开始执行的索引
   */
  private async executeNext(context: T, startIndex: number): Promise<void> {
    // 如果已经执行完所有中间件，则返回
    if (startIndex >= this.sortedMiddlewares.length) {
      return
    }

    const currentMiddleware = this.sortedMiddlewares[startIndex]
    try {
      // 创建next函数，每次调用都会执行下一个中间件
      const next = async () => {
        await this.executeNext(context, startIndex + 1)
      }

      // 执行当前中间件
      await currentMiddleware.process(context, next)
    } catch (error) {
      console.error(`Middleware ${currentMiddleware.name} execution error:`, error)
      // 发生错误时，继续执行下一个中间件
      await this.executeNext(context, startIndex + 1)
    }
  }
}

export default MiddlewareManager
