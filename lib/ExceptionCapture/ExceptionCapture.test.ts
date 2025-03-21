import ExceptionCapture from './index'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { type ExceptionContext } from './types'

describe('ExceptionCapture', () => {
  let exceptionCapture: ExceptionCapture
  let mockMiddleware: any

  beforeEach(() => {
    exceptionCapture = new ExceptionCapture()
    mockMiddleware = {
      name: 'test',
      process: vi.fn(async (ctx: ExceptionContext, next: () => Promise<void>) => {
        await next()
      })
    }
    exceptionCapture.use(mockMiddleware)
  })

  test('should capture js error', () => {
    const errorEvent = new ErrorEvent('error', {
      error: new Error('测试js错误'),
      message: '测试js错误',
      lineno: 1,
      colno: 1,
      filename: 'test.js'
    })

    window.dispatchEvent(errorEvent)

    expect(mockMiddleware.process).toHaveBeenCalled()
    const context = mockMiddleware.process.mock.calls[0][0]
    expect(context.error).toBe(errorEvent)
    expect(context.processed).toBe(false)
    expect(context.shouldReport).toBe(true)
    expect(context.timestamp).toBeDefined()
  })
})
