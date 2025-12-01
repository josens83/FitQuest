import { Controller, Get, Header, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';
import { HealthService } from './health.service';

@Controller()
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly healthService: HealthService,
  ) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getPrometheusMetrics(): string {
    return this.metricsService.getPrometheusMetrics();
  }

  @Get('metrics/json')
  @Header('Content-Type', 'application/json')
  getJsonMetrics(): Record<string, any> {
    return this.metricsService.getMetricsJson();
  }

  @Get('health')
  async getHealth(@Res() res: Response): Promise<void> {
    const health = await this.healthService.checkHealth();

    const statusCode =
      health.status === 'healthy'
        ? HttpStatus.OK
        : health.status === 'degraded'
          ? HttpStatus.OK // Still return 200 for degraded
          : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(health);
  }

  @Get('health/live')
  @HttpCode(HttpStatus.OK)
  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    return this.healthService.checkLiveness();
  }

  @Get('health/ready')
  async getReadiness(@Res() res: Response): Promise<void> {
    const readiness = await this.healthService.checkReadiness();

    const statusCode =
      readiness.status === 'ready'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(readiness);
  }
}
