import { type Context } from './Middleware/types'
import { ExceptionCapture } from './ExceptionCapture'
import { flushDataMiddleware } from './FlushData'
import { reportMiddleware } from './Report'
function initCapture(ctx: Context) {
  const exceptionCapture = new ExceptionCapture(ctx)
  exceptionCapture.use(flushDataMiddleware()).use(reportMiddleware())
}

export default initCapture
