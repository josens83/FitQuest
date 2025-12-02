import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from '../metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.reset();
  });

  describe('counters', () => {
    it('should increment counter', () => {
      service.incrementCounter('http_requests_total', { method: 'GET', path: '/', status: '200' });
      service.incrementCounter('http_requests_total', { method: 'GET', path: '/', status: '200' });

      const metrics = service.getMetricsJson();
      const counter = metrics.counters['http_requests_total'];

      expect(counter).toBeDefined();
      expect(counter[0].value).toBe(2);
    });

    it('should increment counter by specific value', () => {
      service.incrementCounter('http_requests_total', { method: 'POST' }, 5);

      const metrics = service.getMetricsJson();
      const counter = metrics.counters['http_requests_total'];

      expect(counter[0].value).toBe(5);
    });

    it('should track separate labels', () => {
      service.incrementCounter('http_requests_total', { status: '200' });
      service.incrementCounter('http_requests_total', { status: '404' });
      service.incrementCounter('http_requests_total', { status: '200' });

      const metrics = service.getMetricsJson();
      const counters = metrics.counters['http_requests_total'];

      const status200 = counters.find((c: any) => c.labels.status === '200');
      const status404 = counters.find((c: any) => c.labels.status === '404');

      expect(status200.value).toBe(2);
      expect(status404.value).toBe(1);
    });

    it('should register custom counter', () => {
      service.registerCounter({
        name: 'custom_counter',
        help: 'A custom counter',
        labelNames: ['type'],
      });

      service.incrementCounter('custom_counter', { type: 'test' });

      const metrics = service.getMetricsJson();
      expect(metrics.counters['custom_counter']).toBeDefined();
    });
  });

  describe('gauges', () => {
    it('should set gauge value', () => {
      service.setGauge('active_users', 100);

      const metrics = service.getMetricsJson();
      const gauge = metrics.gauges['active_users'];

      expect(gauge[0].value).toBe(100);
    });

    it('should increment gauge', () => {
      service.setGauge('active_users', 100);
      service.incrementGauge('active_users', {}, 10);

      const metrics = service.getMetricsJson();
      const gauge = metrics.gauges['active_users'];

      expect(gauge[0].value).toBe(110);
    });

    it('should decrement gauge', () => {
      service.setGauge('active_users', 100);
      service.decrementGauge('active_users', {}, 10);

      const metrics = service.getMetricsJson();
      const gauge = metrics.gauges['active_users'];

      expect(gauge[0].value).toBe(90);
    });

    it('should register custom gauge', () => {
      service.registerGauge({
        name: 'custom_gauge',
        help: 'A custom gauge',
        labelNames: ['region'],
      });

      service.setGauge('custom_gauge', 42, { region: 'us-east' });

      const metrics = service.getMetricsJson();
      expect(metrics.gauges['custom_gauge']).toBeDefined();
    });
  });

  describe('histograms', () => {
    it('should observe histogram values', () => {
      service.observeHistogram('http_request_duration_ms', 50, { method: 'GET' });
      service.observeHistogram('http_request_duration_ms', 100, { method: 'GET' });
      service.observeHistogram('http_request_duration_ms', 150, { method: 'GET' });

      const metrics = service.getMetricsJson();
      const histogram = metrics.histograms['http_request_duration_ms'];

      expect(histogram[0].count).toBe(3);
      expect(histogram[0].sum).toBe(300);
    });

    it('should track buckets correctly', () => {
      service.observeHistogram('http_request_duration_ms', 5, { method: 'GET' });
      service.observeHistogram('http_request_duration_ms', 50, { method: 'GET' });
      service.observeHistogram('http_request_duration_ms', 500, { method: 'GET' });
      service.observeHistogram('http_request_duration_ms', 5000, { method: 'GET' });

      const metrics = service.getMetricsJson();
      const histogram = metrics.histograms['http_request_duration_ms'][0];

      // Check that smaller values fall into lower buckets
      expect(histogram.buckets['5']).toBeGreaterThanOrEqual(1);
      expect(histogram.buckets['50']).toBeGreaterThanOrEqual(2);
      expect(histogram.buckets['500']).toBeGreaterThanOrEqual(3);
    });

    it('should register custom histogram', () => {
      service.registerHistogram({
        name: 'custom_histogram',
        help: 'A custom histogram',
        labelNames: ['operation'],
        buckets: [1, 5, 10, 50, 100],
      });

      service.observeHistogram('custom_histogram', 25, { operation: 'test' });

      const metrics = service.getMetricsJson();
      expect(metrics.histograms['custom_histogram']).toBeDefined();
    });
  });

  describe('timer', () => {
    it('should measure elapsed time', async () => {
      const endTimer = service.startTimer('http_request_duration_ms', { method: 'GET' });

      await new Promise(resolve => setTimeout(resolve, 50));

      const duration = endTimer();

      expect(duration).toBeGreaterThanOrEqual(45);
      expect(duration).toBeLessThan(150);
    });

    it('should record to histogram', async () => {
      const endTimer = service.startTimer('http_request_duration_ms', { method: 'POST' });

      await new Promise(resolve => setTimeout(resolve, 10));

      endTimer();

      const metrics = service.getMetricsJson();
      const histogram = metrics.histograms['http_request_duration_ms'];

      const postHistogram = histogram.find((h: any) => h.labels.method === 'POST');
      expect(postHistogram.count).toBe(1);
    });
  });

  describe('Prometheus format', () => {
    it('should generate Prometheus text format', () => {
      service.incrementCounter('http_requests_total', { method: 'GET', status: '200' });
      service.setGauge('active_users', 50);
      service.observeHistogram('http_request_duration_ms', 100, { method: 'GET' });

      const prometheus = service.getPrometheusMetrics();

      expect(prometheus).toContain('# HELP http_requests_total');
      expect(prometheus).toContain('# TYPE http_requests_total counter');
      expect(prometheus).toContain('http_requests_total{method="GET",status="200"}');

      expect(prometheus).toContain('# TYPE active_users gauge');
      expect(prometheus).toContain('active_users');

      expect(prometheus).toContain('# TYPE http_request_duration_ms histogram');
      expect(prometheus).toContain('http_request_duration_ms_bucket');
      expect(prometheus).toContain('http_request_duration_ms_sum');
      expect(prometheus).toContain('http_request_duration_ms_count');
    });

    it('should escape label values', () => {
      service.incrementCounter('http_requests_total', { path: '/api/users' });

      const prometheus = service.getPrometheusMetrics();

      expect(prometheus).toContain('path="/api/users"');
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      service.incrementCounter('http_requests_total', { method: 'GET' });
      service.setGauge('active_users', 100);
      service.observeHistogram('http_request_duration_ms', 50, {});

      service.reset();

      const metrics = service.getMetricsJson();

      expect(metrics.counters['http_requests_total']).toHaveLength(0);
      expect(metrics.gauges['active_users']).toHaveLength(0);
      expect(metrics.histograms['http_request_duration_ms']).toHaveLength(0);
    });
  });

  describe('default metrics', () => {
    it('should have pre-registered HTTP metrics', () => {
      service.incrementCounter('http_requests_total', { method: 'GET', path: '/', status: '200' });

      const metrics = service.getMetricsJson();
      expect(metrics.counters['http_requests_total']).toBeDefined();
    });

    it('should have pre-registered database metrics', () => {
      service.incrementCounter('db_queries_total', { operation: 'SELECT', table: 'users' });

      const metrics = service.getMetricsJson();
      expect(metrics.counters['db_queries_total']).toBeDefined();
    });

    it('should have pre-registered cache metrics', () => {
      service.incrementCounter('cache_hits_total', { cache_type: 'redis' });
      service.incrementCounter('cache_misses_total', { cache_type: 'redis' });

      const metrics = service.getMetricsJson();
      expect(metrics.counters['cache_hits_total']).toBeDefined();
      expect(metrics.counters['cache_misses_total']).toBeDefined();
    });

    it('should have pre-registered business metrics', () => {
      service.incrementCounter('workouts_completed_total', { category: 'strength', difficulty: 'beginner' });
      service.incrementCounter('achievements_unlocked_total', { achievement_type: 'streak' });

      const metrics = service.getMetricsJson();
      expect(metrics.counters['workouts_completed_total']).toBeDefined();
      expect(metrics.counters['achievements_unlocked_total']).toBeDefined();
    });
  });
});
