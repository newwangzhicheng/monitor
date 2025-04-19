import { type Context } from './Middleware/types'
import { ExceptionCapture } from './ExceptionCapture'
import { flushDataMiddleware } from './FlushData'
import { reportMiddleware } from './Report'
import { PerformanceMetricsCapture } from './PerformanceMetricsCapture'
function initCapture(ctx: Context) {
  if (ctx.exception) {
    const exceptionCapture = new ExceptionCapture(ctx)
    const options = {
      type: 'exception'
    } as const
    exceptionCapture.use(flushDataMiddleware(options)).use(reportMiddleware(options))
  }
  if (ctx.performanceMetrics) {
    const performanceMetricsCapture = new PerformanceMetricsCapture(ctx)
    const options = {
      type: 'performanceMetrics'
    } as const
    performanceMetricsCapture.use(flushDataMiddleware(options)).use(reportMiddleware(options))
  }
}

export default initCapture
