import { Bulkhead, BulkheadConfig, BulkheadRejectedError } from '../bulkhead';

describe('Bulkhead', () => {
  let bulkhead: Bulkhead;

  beforeEach(() => {
    bulkhead = new Bulkhead('test-bulkhead', {
      maxConcurrent: 2,
      maxQueue: 2,
      queueTimeout: 1000,
    });
  });

  afterEach(() => {
    bulkhead.reset();
  });

  describe('concurrent execution limiting', () => {
    it('should allow execution within concurrency limit', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await bulkhead.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should execute up to maxConcurrent simultaneously', async () => {
      const executionOrder: number[] = [];
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const createTask = (id: number, delay: number) => async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        executionOrder.push(id);
        await new Promise(resolve => setTimeout(resolve, delay));
        concurrentCount--;
        return id;
      };

      const promises = [
        bulkhead.execute(createTask(1, 50)),
        bulkhead.execute(createTask(2, 50)),
        bulkhead.execute(createTask(3, 50)),
        bulkhead.execute(createTask(4, 50)),
      ];

      const results = await Promise.all(promises);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
      expect(results).toHaveLength(4);
    });

    it('should queue tasks when at concurrency limit', async () => {
      const completionOrder: number[] = [];

      const createTask = (id: number, delay: number) => async () => {
        await new Promise(resolve => setTimeout(resolve, delay));
        completionOrder.push(id);
        return id;
      };

      // Task 1 and 2 start immediately, 3 and 4 queue
      const promises = [
        bulkhead.execute(createTask(1, 100)),
        bulkhead.execute(createTask(2, 50)),
        bulkhead.execute(createTask(3, 10)),
        bulkhead.execute(createTask(4, 10)),
      ];

      await Promise.all(promises);

      // Task 2 completes first, then 3 starts and completes quickly
      // Task 1 completes, then 4 starts and completes
      expect(completionOrder[0]).toBe(2); // 2 completes first (50ms)
    });
  });

  describe('queue management', () => {
    it('should reject when queue is full', async () => {
      const slowTask = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'done';
      };

      // Fill up concurrent slots (2) and queue (2)
      const p1 = bulkhead.execute(slowTask);
      const p2 = bulkhead.execute(slowTask);
      const p3 = bulkhead.execute(slowTask);
      const p4 = bulkhead.execute(slowTask);

      // 5th task should be rejected
      await expect(
        bulkhead.execute(slowTask)
      ).rejects.toThrow(BulkheadRejectedError);

      // Clean up
      bulkhead.reset();
    });

    it('should timeout queued tasks', async () => {
      const bulkheadShortTimeout = new Bulkhead('short-timeout', {
        maxConcurrent: 1,
        maxQueue: 2,
        queueTimeout: 50,
      });

      const slowTask = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'done';
      };

      const p1 = bulkheadShortTimeout.execute(slowTask);
      const p2 = bulkheadShortTimeout.execute(slowTask);

      // p2 should timeout while waiting in queue
      await expect(p2).rejects.toThrow('timeout');

      bulkheadShortTimeout.reset();
    });
  });

  describe('statistics', () => {
    it('should track execution statistics', async () => {
      const task = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      };

      await bulkhead.execute(task);
      await bulkhead.execute(task);

      const stats = bulkhead.getStats();

      expect(stats.totalExecutions).toBe(2);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(0);
    });

    it('should track failed executions', async () => {
      const failingTask = async () => {
        throw new Error('fail');
      };

      try {
        await bulkhead.execute(failingTask);
      } catch {}

      const stats = bulkhead.getStats();

      expect(stats.totalExecutions).toBe(1);
      expect(stats.failed).toBe(1);
    });

    it('should track current active and queued counts', async () => {
      const slowTask = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done';
      };

      // Start tasks but don't await
      const p1 = bulkhead.execute(slowTask);
      const p2 = bulkhead.execute(slowTask);
      const p3 = bulkhead.execute(slowTask);

      // Check stats while tasks are running
      const stats = bulkhead.getStats();

      expect(stats.activeCount).toBe(2);
      expect(stats.queuedCount).toBe(1);

      // Clean up
      await Promise.all([p1, p2, p3]);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from executed functions', async () => {
      const error = new Error('Task failed');
      const failingTask = async () => { throw error; };

      await expect(bulkhead.execute(failingTask)).rejects.toThrow('Task failed');
    });

    it('should continue processing after errors', async () => {
      const failingTask = async () => { throw new Error('fail'); };
      const successTask = async () => 'success';

      try {
        await bulkhead.execute(failingTask);
      } catch {}

      const result = await bulkhead.execute(successTask);

      expect(result).toBe('success');
    });
  });

  describe('reset functionality', () => {
    it('should reset statistics', async () => {
      await bulkhead.execute(async () => 'done');

      bulkhead.reset();

      const stats = bulkhead.getStats();
      expect(stats.totalExecutions).toBe(0);
    });

    it('should clear queue on reset', async () => {
      const slowTask = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'done';
      };

      // Fill concurrent and queue
      bulkhead.execute(slowTask);
      bulkhead.execute(slowTask);
      bulkhead.execute(slowTask);
      bulkhead.execute(slowTask);

      const statsBefore = bulkhead.getStats();
      expect(statsBefore.queuedCount).toBeGreaterThan(0);

      bulkhead.reset();

      const statsAfter = bulkhead.getStats();
      expect(statsAfter.queuedCount).toBe(0);
    });
  });
});
