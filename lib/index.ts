import { type Context } from './Middleware/types'
import { ExceptionCapture } from './ExceptionCapture'
import { flushDataMiddleware } from './FlushData'

function initCapture(ctx: Context = {}) {
  const exceptionCapture = new ExceptionCapture(ctx)
  exceptionCapture.use(flushDataMiddleware())
}

export default initCapture
