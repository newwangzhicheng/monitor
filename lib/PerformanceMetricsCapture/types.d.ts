enum MetricsType {
  PERFORMANCE_METRICS = 'performanceMetrics'
}

interface Metrics {
  CLS?: number // Cumulative Layout Shift
  INP?: number // Interaction to Next Paint
  LCP?: number // Largest Contentful Paint
  FCP?: number // First Contentful Paint
  TTFB?: number // Time To First Byte

  DNS?: number // domainLookupEnd - domainLookupStart
  TCP?: number // connectEnd - connectStart
  SSL?: number // connectEnd - secureConnectionStart
  DOM?: number // domInteractive - responseEnd DOM解析时间
  RES?: number // loadEventStart - domContentLoadedEventEnd 同步加载资源时间
  FC?: number // loadEventEnd - fetchStart 首屏时间
  WS?: boolean // 白屏
}

interface PerformanceMetrics {
  type: MetricsType.PERFORMANCE_METRICS
  metrics: Metrics
}

export { type PerformanceMetrics, type Metrics, MetricsType }
