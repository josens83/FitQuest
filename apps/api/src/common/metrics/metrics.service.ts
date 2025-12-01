import { Injectable, OnModuleInit } from '@nestjs/common';

export interface MetricLabels {
  [key: string]: string | number;
}

export interface CounterMetric {
  name: string;
  help: string;
  labelNames: string[];
}

export interface GaugeMetric {
  name: string;
  help: string;
  labelNames: string[];
}

export interface HistogramMetric {
  name: string;
  help: string;
  labelNames: string[];
  buckets: number[];
}

interface MetricValue {
  value: number;
  labels: MetricLabels;
  timestamp: number;
}

interface HistogramValue {
  sum: number;
  count: number;
  buckets: Map<number, number>;
  labels: MetricLabels;
  timestamp: number;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private counters: Map<string, Map<string, MetricValue>> = new Map();
  private gauges: Map<string, Map<string, MetricValue>> = new Map();
  private histograms: Map<string, Map<string, HistogramValue>> = new Map();

  private counterDefinitions: Map<string, CounterMetric> = new Map();
  private gaugeDefinitions: Map<string, GaugeMetric> = new Map();
  private histogramDefinitions: Map<string, HistogramMetric> = new Map();

  // Default histogram buckets (in ms for response times)
  private readonly DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

  onModuleInit() {
    this.registerDefaultMetrics();
  }

  private registerDefaultMetrics(): void {
    // HTTP metrics
    this.registerCounter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    });

    this.registerHistogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'path', 'status'],
      buckets: this.DEFAULT_BUCKETS,
    });

    // Database metrics
    this.registerCounter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table'],
    });

    this.registerHistogram({
      name: 'db_query_duration_ms',
      help: 'Database query duration in milliseconds',
      labelNames: ['operation', 'table'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    });

    // Cache metrics
    this.registerCounter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
    });

    this.registerCounter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
    });

    // Business metrics
    this.registerCounter({
      name: 'workouts_completed_total',
      help: 'Total number of completed workouts',
      labelNames: ['category', 'difficulty'],
    });

    this.registerCounter({
      name: 'achievements_unlocked_total',
      help: 'Total number of achievements unlocked',
      labelNames: ['achievement_type'],
    });

    this.registerGauge({
      name: 'active_users',
      help: 'Number of currently active users',
      labelNames: [],
    });

    this.registerGauge({
      name: 'active_sessions',
      help: 'Number of active workout sessions',
      labelNames: [],
    });

    // Circuit breaker metrics
    this.registerCounter({
      name: 'circuit_breaker_state_changes_total',
      help: 'Circuit breaker state changes',
      labelNames: ['circuit', 'from_state', 'to_state'],
    });

    this.registerGauge({
      name: 'circuit_breaker_state',
      help: 'Current circuit breaker state (0=closed, 1=open, 2=half-open)',
      labelNames: ['circuit'],
    });

    // Error metrics
    this.registerCounter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'code'],
    });

    // External service metrics
    this.registerCounter({
      name: 'external_requests_total',
      help: 'Total external service requests',
      labelNames: ['service', 'method', 'success'],
    });

    this.registerHistogram({
      name: 'external_request_duration_ms',
      help: 'External service request duration in milliseconds',
      labelNames: ['service', 'method'],
      buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
    });

    // Rate limiting metrics
    this.registerCounter({
      name: 'rate_limit_exceeded_total',
      help: 'Total rate limit exceeded events',
      labelNames: ['endpoint'],
    });

    // Authentication metrics
    this.registerCounter({
      name: 'auth_attempts_total',
      help: 'Total authentication attempts',
      labelNames: ['type', 'success'],
    });
  }

  // Counter methods
  registerCounter(metric: CounterMetric): void {
    this.counterDefinitions.set(metric.name, metric);
    this.counters.set(metric.name, new Map());
  }

  incrementCounter(name: string, labels: MetricLabels = {}, value: number = 1): void {
    const counter = this.counters.get(name);
    if (!counter) {
      console.warn(`Counter ${name} not registered`);
      return;
    }

    const labelKey = this.labelsToKey(labels);
    const existing = counter.get(labelKey);

    if (existing) {
      existing.value += value;
      existing.timestamp = Date.now();
    } else {
      counter.set(labelKey, {
        value,
        labels,
        timestamp: Date.now(),
      });
    }
  }

  // Gauge methods
  registerGauge(metric: GaugeMetric): void {
    this.gaugeDefinitions.set(metric.name, metric);
    this.gauges.set(metric.name, new Map());
  }

  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    const gauge = this.gauges.get(name);
    if (!gauge) {
      console.warn(`Gauge ${name} not registered`);
      return;
    }

    const labelKey = this.labelsToKey(labels);
    gauge.set(labelKey, {
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  incrementGauge(name: string, labels: MetricLabels = {}, value: number = 1): void {
    const gauge = this.gauges.get(name);
    if (!gauge) {
      console.warn(`Gauge ${name} not registered`);
      return;
    }

    const labelKey = this.labelsToKey(labels);
    const existing = gauge.get(labelKey);

    if (existing) {
      existing.value += value;
      existing.timestamp = Date.now();
    } else {
      gauge.set(labelKey, {
        value,
        labels,
        timestamp: Date.now(),
      });
    }
  }

  decrementGauge(name: string, labels: MetricLabels = {}, value: number = 1): void {
    this.incrementGauge(name, labels, -value);
  }

  // Histogram methods
  registerHistogram(metric: HistogramMetric): void {
    this.histogramDefinitions.set(metric.name, metric);
    this.histograms.set(metric.name, new Map());
  }

  observeHistogram(name: string, value: number, labels: MetricLabels = {}): void {
    const histogram = this.histograms.get(name);
    const definition = this.histogramDefinitions.get(name);

    if (!histogram || !definition) {
      console.warn(`Histogram ${name} not registered`);
      return;
    }

    const labelKey = this.labelsToKey(labels);
    let existing = histogram.get(labelKey);

    if (!existing) {
      existing = {
        sum: 0,
        count: 0,
        buckets: new Map(definition.buckets.map(b => [b, 0])),
        labels,
        timestamp: Date.now(),
      };
      histogram.set(labelKey, existing);
    }

    existing.sum += value;
    existing.count += 1;
    existing.timestamp = Date.now();

    // Update buckets
    for (const bucket of definition.buckets) {
      if (value <= bucket) {
        existing.buckets.set(bucket, (existing.buckets.get(bucket) || 0) + 1);
      }
    }
  }

  // Timer helper for histograms
  startTimer(name: string, labels: MetricLabels = {}): () => number {
    const start = process.hrtime.bigint();
    return () => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      this.observeHistogram(name, durationMs, labels);
      return durationMs;
    };
  }

  // Get metrics in Prometheus format
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // Output counters
    for (const [name, definition] of this.counterDefinitions) {
      const counter = this.counters.get(name);
      if (!counter) continue;

      lines.push(`# HELP ${name} ${definition.help}`);
      lines.push(`# TYPE ${name} counter`);

      for (const [, metric] of counter) {
        const labelStr = this.formatLabels(metric.labels);
        lines.push(`${name}${labelStr} ${metric.value}`);
      }
    }

    // Output gauges
    for (const [name, definition] of this.gaugeDefinitions) {
      const gauge = this.gauges.get(name);
      if (!gauge) continue;

      lines.push(`# HELP ${name} ${definition.help}`);
      lines.push(`# TYPE ${name} gauge`);

      for (const [, metric] of gauge) {
        const labelStr = this.formatLabels(metric.labels);
        lines.push(`${name}${labelStr} ${metric.value}`);
      }
    }

    // Output histograms
    for (const [name, definition] of this.histogramDefinitions) {
      const histogram = this.histograms.get(name);
      if (!histogram) continue;

      lines.push(`# HELP ${name} ${definition.help}`);
      lines.push(`# TYPE ${name} histogram`);

      for (const [, metric] of histogram) {
        const labelStr = this.formatLabels(metric.labels);
        const labelStrWithComma = labelStr ? labelStr.slice(0, -1) + ',' : '{';

        // Output buckets
        let cumulative = 0;
        for (const bucket of definition.buckets) {
          cumulative += metric.buckets.get(bucket) || 0;
          lines.push(`${name}_bucket${labelStrWithComma}le="${bucket}"} ${cumulative}`);
        }
        lines.push(`${name}_bucket${labelStrWithComma}le="+Inf"} ${metric.count}`);

        // Output sum and count
        lines.push(`${name}_sum${labelStr} ${metric.sum}`);
        lines.push(`${name}_count${labelStr} ${metric.count}`);
      }
    }

    return lines.join('\n');
  }

  // Get metrics as JSON (for internal dashboards)
  getMetricsJson(): Record<string, any> {
    const result: Record<string, any> = {
      counters: {},
      gauges: {},
      histograms: {},
    };

    for (const [name, counter] of this.counters) {
      result.counters[name] = Array.from(counter.values());
    }

    for (const [name, gauge] of this.gauges) {
      result.gauges[name] = Array.from(gauge.values());
    }

    for (const [name, histogram] of this.histograms) {
      result.histograms[name] = Array.from(histogram.entries()).map(([key, value]) => ({
        key,
        ...value,
        buckets: Object.fromEntries(value.buckets),
      }));
    }

    return result;
  }

  // Helper to reset all metrics (useful for testing)
  reset(): void {
    for (const counter of this.counters.values()) {
      counter.clear();
    }
    for (const gauge of this.gauges.values()) {
      gauge.clear();
    }
    for (const histogram of this.histograms.values()) {
      histogram.clear();
    }
  }

  private labelsToKey(labels: MetricLabels): string {
    const sortedKeys = Object.keys(labels).sort();
    return sortedKeys.map(k => `${k}=${labels[k]}`).join(',');
  }

  private formatLabels(labels: MetricLabels): string {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';

    const labelPairs = entries.map(([k, v]) => `${k}="${v}"`).join(',');
    return `{${labelPairs}}`;
  }
}

// Singleton instance for global access
let metricsServiceInstance: MetricsService | null = null;

export function getMetricsService(): MetricsService {
  if (!metricsServiceInstance) {
    metricsServiceInstance = new MetricsService();
    metricsServiceInstance.onModuleInit();
  }
  return metricsServiceInstance;
}

export function setMetricsService(service: MetricsService): void {
  metricsServiceInstance = service;
}
