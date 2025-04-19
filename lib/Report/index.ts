import { type Context, type Middleware } from '../Middleware/types'
import { type FlushedData, type FlushedHpException } from '../FlushData/types'
import { type RequestParams } from './types'
import { ExceptionType } from '../ExceptionCapture/types.d'

function reportMiddleware({
  type
}: {
  type: 'exception' | 'performanceMetrics'
}): Middleware<Context> {
  return {
    name: 'report',
    process: async (ctx, next) => {
      const reporter = new Reporter(ctx)
      switch (type) {
        case 'exception':
          reporter.reportException()
          break
        case 'performanceMetrics':
          reporter.reportPerformanceMetrics()
          break
      }
      await next()
    }
  }
}

class Reporter {
  private readonly ctx: Context
  constructor(ctx: Context) {
    this.ctx = ctx
  }

  // 上报性能指标
  public reportPerformanceMetrics() {
    this.report(this.ctx.flushedPerformanceMetrics)
  }

  // 上报异常
  public reportException() {
    this.report(this.ctx.currentFlushedException)
  }

  // 上报
  private report(currentFlushed?: FlushedData) {
    const report = this.ctx.report
    if (!currentFlushed || !report) {
      console.error('flushedData or report is not defined')
      return
    }

    const actions = {
      handleReport: () => this.handleReport(currentFlushed, report),
      url: () => this.sendBeacon(currentFlushed, report),
      'headers,url': () => this.fetch(currentFlushed, report),
      default: (...args: any[]) => console.error('report url is not defined', ...args)
    }
    const keys = Object.keys(report).sort().join(',') || 'default'
    const action = actions[keys as keyof typeof actions]
    action(currentFlushed, report)
  }

  // 处理上报请求
  private handleReport(flushedData: FlushedData, report: RequestParams) {
    if (this.checkIsReportRequest(flushedData, report)) {
      return
    }
    report.handleReport?.(flushedData)
  }

  // 发送Beacon请求
  private sendBeacon(flushedData: FlushedData, report: RequestParams) {
    if (!navigator.sendBeacon) {
      this.fetch(flushedData, report)
    }
    const url = report.url ?? ''
    try {
      navigator.sendBeacon(url, JSON.stringify(flushedData))
    } catch (error) {
      console.error('report error', error)
    }
  }

  // 发送fetch请求
  private async fetch(flushedData: FlushedData, report: RequestParams) {
    if (this.checkIsReportRequest(flushedData, report)) {
      return
    }
    const url = report.url
    const headers = report.headers ?? {}
    headers['Content-Type'] = 'application/json'
    headers['keep-alive'] = 'true'
    try {
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify(flushedData),
        headers
      })
    } catch (error) {
      console.error('report error', error)
    }
  }

  // 判断是否是report类型的请求
  private checkIsReportRequest(flushedData: FlushedData, report: RequestParams) {
    if (flushedData.flushed.type === ExceptionType.HP) {
      const url = (flushedData.flushed as FlushedHpException).url
      if (url === report.url) {
        return true
      }
    }
    return false
  }
}

export { reportMiddleware }
