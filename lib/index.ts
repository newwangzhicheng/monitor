import MiddlewareManager from './Middleware'
import { type Context } from './Middleware/types'
import { exceptionCaptureMiddleware } from './ExceptionCapture'

function initCapture(ctx: Context = {}) {
  const middlewareManager = new MiddlewareManager<Context>()
  middlewareManager.use(exceptionCaptureMiddleware())
  middlewareManager.execute(ctx)
}

export default initCapture
