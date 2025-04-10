import { type FlushedData } from '../FlushData/types'

interface RequestParams {
  url: string
  headers?: Record<string, string>
  handleReport?: (data: FlushedData) => void
}

export { type RequestParams }
