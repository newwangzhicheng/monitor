import MiddlewareManager from './index'
import { type Middleware } from './types'
import { describe, test, expect, beforeEach, vi } from 'vitest'
describe('MiddlewareManager', () => {
  interface TestContext {
    value: number
    history: string[]
  }

  let manager: MiddlewareManager<TestContext>
  let context: TestContext

  beforeEach(() => {
    manager = new MiddlewareManager<TestContext>()
    context = {
      value: 0,
      history: []
    }
  })

  // 测试中间件添加
  test('should add middleware correctly', () => {
    const middleware: Middleware<TestContext> = {
      name: 'test',
      process: async (ctx, next) => {
        await next()
      }
    }

    manager.use(middleware)
    expect(manager.getMiddlewares()).toHaveLength(1)
    expect(manager.getMiddlewares()[0]).toBe(middleware)
  })

  // 测试中间件移除
  test('should remove middleware correctly', () => {
    const middleware: Middleware<TestContext> = {
      name: 'test',
      process: async (ctx, next) => {
        await next()
      }
    }

    manager.use(middleware)
    manager.remove(middleware)
    expect(manager.getMiddlewares()).toHaveLength(0)
  })

  // 测试中间件优先级排序
  test('should sort middlewares by priority', () => {
    const middleware1: Middleware<TestContext> = {
      name: 'test1',
      priority: 1,
      process: async (ctx, next) => {
        await next()
      }
    }

    const middleware2: Middleware<TestContext> = {
      name: 'test2',
      priority: 2,
      process: async (ctx, next) => {
        await next()
      }
    }

    manager.use(middleware1).use(middleware2)
    const sortedMiddlewares = manager.getMiddlewares()
    expect(sortedMiddlewares[0]).toBe(middleware2)
    expect(sortedMiddlewares[1]).toBe(middleware1)
  })

  // 测试中间件执行顺序
  test('should execute middlewares in correct order', async () => {
    const middleware1: Middleware<TestContext> = {
      name: 'test1',
      process: async (ctx, next) => {
        ctx.history.push('before1')
        await next()
        ctx.history.push('after1')
      }
    }

    const middleware2: Middleware<TestContext> = {
      name: 'test2',
      process: async (ctx, next) => {
        ctx.history.push('before2')
        await next()
        ctx.history.push('after2')
      }
    }

    manager.use(middleware1).use(middleware2)
    await manager.execute(context)

    expect(context.history).toEqual(['before1', 'before2', 'after2', 'after1'])
  })

  // 测试中间件错误处理
  test('should handle middleware errors gracefully', async () => {
    const errorMiddleware: Middleware<TestContext> = {
      name: 'error',
      process: async () => {
        throw new Error('Test error')
      }
    }

    const nextMiddleware: Middleware<TestContext> = {
      name: 'next',
      process: async (ctx, next) => {
        ctx.value = 1
        await next()
      }
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    manager.use(errorMiddleware).use(nextMiddleware)
    await manager.execute(context)

    expect(consoleSpy).toHaveBeenCalled()
    expect(context.value).toBe(1)

    consoleSpy.mockRestore()
  })
})
