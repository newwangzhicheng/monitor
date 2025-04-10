import { type Context, type Middleware } from '../Middleware/types'
import { type FlushedData } from '../FlushData/types'
import { type RequestParams } from './types'
function reportMiddleware(): Middleware<Context> {
  return {
    name: 'report',
    process: async (ctx, next) => {
      const reporter = new Reporter(ctx)
      reporter.report()
      await next()
    }
  }
}

class Reporter {
  private readonly ctx: Context
  constructor(ctx: Context) {
    this.ctx = ctx
  }

  public report() {
    const currentFlushed = this.ctx.currentFlushed
    const report = this.ctx.report
    if (!currentFlushed || !report) {
      console.error('flushedData or report is not defined')
      return
    }

    const actions = {
      handleReport: () => report.handleReport?.(currentFlushed, report),
      url: () => this.sendBeacon(currentFlushed, report),
      'headers,url': () => this.fetch(currentFlushed, report),
      default: (...args: any[]) => console.error('report url is not defined', ...args)
    }
    const keys = Object.keys(report).sort().join(',') || 'default'
    const action = actions[keys as keyof typeof actions]
    action(currentFlushed, report)
  }

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

  private async fetch(flushedData: FlushedData, report: RequestParams) {
    const url = report.url ?? ''
    const headers = report.headers ?? {}
    headers['Content-Type'] = 'application/json'
    headers['keep-alive'] = 'true'
    try {
      headers['x-monitor-report'] = 'true'
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify(flushedData),
        headers
      })
    } catch (error) {
      console.error('report error', error)
    }
  }
}

export { reportMiddleware }
