import { Injectable } from '@nestjs/common';

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  responseTime?: number;
  message?: string;
  details?: Record<string, any>;
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptime: number;
  components: ComponentHealth[];
}

export type HealthCheckFn = () => Promise<ComponentHealth>;

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();
  private readonly version = process.env.APP_VERSION || '1.0.0';
  private healthChecks: Map<string, HealthCheckFn> = new Map();

  registerHealthCheck(name: string, checkFn: HealthCheckFn): void {
    this.healthChecks.set(name, checkFn);
  }

  unregisterHealthCheck(name: string): void {
    this.healthChecks.delete(name);
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const components: ComponentHealth[] = [];

    // Run all health checks in parallel
    const checkPromises = Array.from(this.healthChecks.entries()).map(
      async ([name, checkFn]) => {
        const start = Date.now();
        try {
          const result = await Promise.race([
            checkFn(),
            this.timeout(5000, name),
          ]);
          result.responseTime = Date.now() - start;
          return result;
        } catch (error) {
          return {
            name,
            status: HealthStatus.UNHEALTHY,
            responseTime: Date.now() - start,
            message: error instanceof Error ? error.message : 'Health check failed',
          };
        }
      },
    );

    const results = await Promise.all(checkPromises);
    components.push(...results);

    // Determine overall status
    const overallStatus = this.determineOverallStatus(components);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      components,
    };
  }

  async checkLiveness(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    // Basic liveness check - is the process running?
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async checkReadiness(): Promise<{
    status: 'ready' | 'not_ready';
    timestamp: string;
    checks: Record<string, boolean>;
  }> {
    const checks: Record<string, boolean> = {};

    // Run critical health checks
    const criticalChecks = ['database', 'redis'];

    for (const name of criticalChecks) {
      const checkFn = this.healthChecks.get(name);
      if (checkFn) {
        try {
          const result = await Promise.race([
            checkFn(),
            this.timeout(3000, name),
          ]);
          checks[name] = result.status === HealthStatus.HEALTHY;
        } catch {
          checks[name] = false;
        }
      }
    }

    const isReady = Object.values(checks).every(Boolean);

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private determineOverallStatus(components: ComponentHealth[]): HealthStatus {
    if (components.length === 0) {
      return HealthStatus.HEALTHY;
    }

    const hasUnhealthy = components.some(c => c.status === HealthStatus.UNHEALTHY);
    const hasDegraded = components.some(c => c.status === HealthStatus.DEGRADED);

    if (hasUnhealthy) {
      return HealthStatus.UNHEALTHY;
    }

    if (hasDegraded) {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.HEALTHY;
  }

  private timeout(ms: number, name: string): Promise<ComponentHealth> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check ${name} timed out after ${ms}ms`));
      }, ms);
    });
  }
}

// Default health check implementations
export const createDatabaseHealthCheck = (
  checkConnection: () => Promise<boolean>,
): HealthCheckFn => {
  return async (): Promise<ComponentHealth> => {
    try {
      const isConnected = await checkConnection();
      return {
        name: 'database',
        status: isConnected ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        message: isConnected ? 'Database connection is healthy' : 'Database connection failed',
      };
    } catch (error) {
      return {
        name: 'database',
        status: HealthStatus.UNHEALTHY,
        message: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  };
};

export const createRedisHealthCheck = (
  ping: () => Promise<string>,
): HealthCheckFn => {
  return async (): Promise<ComponentHealth> => {
    try {
      const result = await ping();
      const isHealthy = result === 'PONG';
      return {
        name: 'redis',
        status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        message: isHealthy ? 'Redis connection is healthy' : 'Redis ping failed',
      };
    } catch (error) {
      return {
        name: 'redis',
        status: HealthStatus.DEGRADED, // Redis failure shouldn't make system unhealthy
        message: error instanceof Error ? error.message : 'Redis check failed',
      };
    }
  };
};

export const createMemoryHealthCheck = (
  maxHeapUsedPercent: number = 90,
): HealthCheckFn => {
  return async (): Promise<ComponentHealth> => {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    let status: HealthStatus;
    if (heapUsedPercent >= maxHeapUsedPercent) {
      status = HealthStatus.UNHEALTHY;
    } else if (heapUsedPercent >= maxHeapUsedPercent * 0.8) {
      status = HealthStatus.DEGRADED;
    } else {
      status = HealthStatus.HEALTHY;
    }

    return {
      name: 'memory',
      status,
      message: `Heap usage: ${heapUsedPercent.toFixed(2)}%`,
      details: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
    };
  };
};

export const createDiskHealthCheck = async (): Promise<ComponentHealth> => {
  // Note: In a real implementation, you'd use a library like 'diskusage'
  // This is a placeholder that always returns healthy
  return {
    name: 'disk',
    status: HealthStatus.HEALTHY,
    message: 'Disk space check not implemented',
  };
};
