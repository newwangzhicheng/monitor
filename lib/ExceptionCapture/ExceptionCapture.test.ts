/* eslint-disable max-lines-per-function */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exceptionCaptureMiddleware } from './index'
import { type Context } from '@/Middleware/types'

describe('exceptionCaptureMiddleware', () => {
  // 模拟window对象
  let mockWindow: any
  let originalWindow: any

  beforeEach(() => {
    // 保存原始window对象
    originalWindow = global.window

    // 创建模拟的window对象
    mockWindow = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }

    // 替换全局window对象
    global.window = mockWindow
  })

  afterEach(() => {
    // 恢复原始window对象
    global.window = originalWindow
    vi.clearAllMocks()
  })

  it('应该正确初始化中间件', () => {
    const middleware = exceptionCaptureMiddleware()

    expect(middleware.name).toBe('captureException')
    expect(typeof middleware.process).toBe('function')
  })

  it('应该在Context中初始化exceptions数组', async () => {
    const middleware = exceptionCaptureMiddleware()
    const ctx: Context = {}

    await middleware.process(ctx, async () => {})

    expect(ctx.exceptions).toBeDefined()
    expect(Array.isArray(ctx.exceptions)).toBe(true)
    expect(ctx.exceptions?.length).toBe(0)
  })

  it('应该注册所有错误事件监听器', async () => {
    const middleware = exceptionCaptureMiddleware()
    const ctx: Context = {}

    await middleware.process(ctx, async () => {})

    // 验证是否注册了所有错误事件监听器
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('error', expect.any(Function), true)
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function)
    )
  })

  it('应该正确捕获JS错误', async () => {
    const middleware = exceptionCaptureMiddleware()
    const ctx: Context = {}

    await middleware.process(ctx, async () => {})

    // 模拟JS错误事件
    const errorEvent = new ErrorEvent('error', {
      message: 'Test JS error',
      error: new Error('Test error')
    })

    // 获取注册的错误处理函数
    const errorHandler = mockWindow.addEventListener.mock.calls.find(
      (call: [string, (...args: any[]) => void, boolean]) =>
        call[1].toString().includes('ExceptionType.JS')
    )[1]

    // 调用处理函数
    errorHandler(errorEvent)

    // 验证错误是否被添加到exceptions数组
    expect(ctx.exceptions?.length).toBe(1)
    expect(ctx.exceptions?.[0].error).toBe(errorEvent)
    expect(ctx.exceptions?.[0].processed).toBe(false)
    expect(ctx.exceptions?.[0].shouldReport).toBe(true)
  })

  it('应该正确捕获资源错误', async () => {
    const middleware = exceptionCaptureMiddleware()
    const ctx: Context = {}

    await middleware.process(ctx, async () => {})

    // 模拟资源错误事件
    const resourceEvent = new Event('error')

    // 获取注册的错误处理函数
    const errorHandler = mockWindow.addEventListener.mock.calls.find(
      (call: [string, (...args: any[]) => void, boolean]) =>
        call[1].toString().includes('ExceptionType.RS')
    )[1]

    // 调用处理函数
    errorHandler(resourceEvent)

    // 验证错误是否被添加到exceptions数组
    expect(ctx.exceptions?.length).toBe(1)
    expect(ctx.exceptions?.[0].error).toBe(resourceEvent)
  })

  it('应该正确捕获Promise错误', async () => {
    const middleware = exceptionCaptureMiddleware()
    const ctx: Context = {}

    await middleware.process(ctx, async () => {})

    // 模拟Promise错误事件
    const promiseEvent = {
      type: 'unhandledrejection',
      reason: new Error('Promise rejected'),
      promise: Promise.reject(new Error('Promise rejected')),
      preventDefault: () => {}
    }

    // 获取注册的Promise错误处理函数
    const promiseHandler = mockWindow.addEventListener.mock.calls.find(
      (call: [string, (...args: any[]) => void]) => call[0] === 'unhandledrejection'
    )[1]

    // 调用处理函数
    promiseHandler(promiseEvent)

    // 验证错误是否被添加到exceptions数组
    expect(ctx.exceptions?.length).toBe(1)
    expect(ctx.exceptions?.[0].error).toBe(promiseEvent)
  })

  it('应该正确捕获CORS错误', async () => {
    const middleware = exceptionCaptureMiddleware()
    const ctx: Context = {}

    await middleware.process(ctx, async () => {})

    // 模拟CORS错误事件
    const corsEvent = new ErrorEvent('error', {
      message: 'Script error.'
    })

    // 获取注册的错误处理函数
    const errorHandler = mockWindow.addEventListener.mock.calls.find(
      (call: [string, (...args: any[]) => void, boolean]) =>
        call[1].toString().includes('ExceptionType.CS')
    )[1]

    // 调用处理函数
    errorHandler(corsEvent)

    // 验证错误是否被添加到exceptions数组
    expect(ctx.exceptions?.length).toBe(1)
    expect(ctx.exceptions?.[0].error).toBe(corsEvent)
  })

  it('应该正确调用next函数', async () => {
    const middleware = exceptionCaptureMiddleware()
    const ctx: Context = {}
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware.process(ctx, next)

    expect(next).toHaveBeenCalled()
  })
})
