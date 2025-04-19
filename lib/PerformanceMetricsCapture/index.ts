import { Context, Middleware } from '../Middleware/types'
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'
import MiddlewareManager from '../Middleware'
import { type Metrics, MetricsType } from './types.d'

class PerformanceMetricsCapture {
  private readonly ctx: Context
  private readonly middlewareManager: MiddlewareManager<Context>
  private readonly metrics: Metrics
  private readonly TIMEOUT: number = 1_000 // 超时强制提交
  private timer: ReturnType<typeof setTimeout> | undefined // 超时强制提交 定时器
  private readonly MAX_WS_RETRY: number = 3 // 最大白屏重试次数
  private readonly WS_RETRY_INTERVAL: number = this.TIMEOUT / this.MAX_WS_RETRY // 白屏重试间隔
  private readonly WS_ELEMENT_COUNT: number = 1 // 白屏元素个数
  private readonly WS_ROOT_SELECTOR: string = '#app' // 白屏根元素选择器
  private wsRetry: number = 0 // 白屏重试次数
  private wsTimer: ReturnType<typeof setInterval> | undefined // 白屏定时器

  constructor(ctx: Context) {
    this.ctx = ctx
    this.middlewareManager = new MiddlewareManager<Context>()
    this.metrics = {
      CLS: undefined, // Cumulative Layout Shift
      INP: undefined, // Interaction to Next Paint
      LCP: undefined, // Largest Contentful Paint
      FCP: undefined, // First Contentful Paint
      TTFB: undefined, // Time To First Byte

      DNS: undefined, // domainLookupEnd - domainLookupStart
      TCP: undefined, // connectEnd - connectStart
      SSL: undefined, // connectEnd - secureConnectionStart
      DOM: undefined, // domInteractive - responseEnd DOM解析时间
      RES: undefined, // loadEventStart - domContentLoadedEventEnd 同步加载资源时间
      FC: undefined, // loadEventEnd - fetchStart 首屏时间
      WS: undefined // 白屏
    }
    this.ctx.performanceMetrics = {
      type: MetricsType.PERFORMANCE_METRICS,
      metrics: this.metrics
    }
    this.init()
  }

  private init() {
    // web vitals
    onCLS((metric) => {
      this.metrics.CLS = metric.value
      this.tryExecute()
    })
    onINP((metric) => {
      this.metrics.INP = metric.value
      this.tryExecute()
    })
    onLCP((metric) => {
      this.metrics.LCP = metric.value
      this.tryExecute()
    })
    onFCP((metric) => {
      this.metrics.FCP = metric.value
      this.tryExecute()
    })
    onTTFB((metric) => {
      this.metrics.TTFB = metric.value
      this.tryExecute()
    })

    // performance navigation & white screen
    window.addEventListener('load', () => {
      // 直接获取loadEventEnd值为0
      setTimeout(() => {
        this.captureOthers()
        this.tryExecute()
      }, 100)

      // TIMEOUT后直接执行
      this.timer = setTimeout(() => {
        // 直接执行
        this.execute()
      }, this.TIMEOUT)
    })
  }

  private captureOthers() {
    const nav =
      performance.getEntriesByType('navigation').length > 0
        ? performance.getEntriesByType('navigation')[0]
        : performance.timing
    const {
      domainLookupEnd,
      domainLookupStart,
      connectEnd,
      connectStart,
      secureConnectionStart,
      domInteractive,
      responseEnd,
      loadEventStart,
      domContentLoadedEventEnd,
      loadEventEnd,
      fetchStart
    } = nav
    Object.assign(this.metrics, {
      DNS: domainLookupEnd - domainLookupStart,
      TCP: connectEnd - connectStart,
      SSL: secureConnectionStart ? connectEnd - secureConnectionStart : undefined,
      DOM: domInteractive - responseEnd,
      RES: loadEventStart - domContentLoadedEventEnd,
      FC: loadEventEnd - fetchStart
    })

    // 白屏检测
    this.wsTimer = setInterval(() => {
      if (this.wsRetry < this.MAX_WS_RETRY) {
        this.captureWhiteScreen()
      }
    }, this.WS_RETRY_INTERVAL)
    this.captureWhiteScreen()
  }

  // 检测白屏
  private captureWhiteScreen() {
    this.wsRetry++
    const app = document.querySelector(this.WS_ROOT_SELECTOR)
    if (!app) {
      return
    }
    let count = 0
    const treeWalker = document.createTreeWalker(app, NodeFilter.SHOW_ELEMENT)
    while (treeWalker.nextNode()) {
      count++
      if (count >= this.WS_ELEMENT_COUNT) {
        // 不是白屏，清除定时器
        this.metrics.WS = false
        clearInterval(this.wsTimer)
        return
      }
    }
    this.metrics.WS = true
  }

  // 是否应该执行下一步，所有指标都已获取
  private isAllMetricsCaptured() {
    return Object.values(this.metrics).every((value) => value !== undefined)
  }

  // 尝试执行下一步
  private tryExecute() {
    if (this.isAllMetricsCaptured()) {
      this.execute()
    }
  }

  // 执行下一步
  private execute() {
    clearTimeout(this.timer)
    clearInterval(this.wsTimer)
    this.middlewareManager.execute(this.ctx)
  }

  // 使用中间件
  public use(middleware: Middleware<Context>) {
    this.middlewareManager.use(middleware)
    return this
  }
}

export { PerformanceMetricsCapture }
