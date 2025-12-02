import { Test, TestingModule } from '@nestjs/testing';
import {
  AuditService,
  AuditAction,
  AuditSeverity,
  MemoryAuditStore,
} from '../audit.service';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();

    service = module.get<AuditService>(AuditService);
    service.onModuleInit();
  });

  describe('log', () => {
    it('should log an audit event', async () => {
      await service.log(
        AuditAction.LOGIN,
        'User logged in',
        {
          actorId: 'user-123',
          context: { ipAddress: '192.168.1.1' },
        }
      );

      const entries = await service.query({ actorId: 'user-123' });

      expect(entries).toHaveLength(1);
      expect(entries[0].action).toBe(AuditAction.LOGIN);
      expect(entries[0].description).toBe('User logged in');
    });

    it('should assign correct severity based on action', async () => {
      await service.log(AuditAction.LOGIN, 'Normal login', { actorId: 'user-1' });
      await service.log(AuditAction.LOGIN_FAILED, 'Failed login', { actorId: 'user-2' });
      await service.log(AuditAction.UNAUTHORIZED_ACCESS, 'Unauthorized', { actorId: 'user-3' });

      const entries = await service.query({});

      const loginEntry = entries.find(e => e.action === AuditAction.LOGIN);
      const failedEntry = entries.find(e => e.action === AuditAction.LOGIN_FAILED);
      const unauthEntry = entries.find(e => e.action === AuditAction.UNAUTHORIZED_ACCESS);

      expect(loginEntry?.severity).toBe(AuditSeverity.INFO);
      expect(failedEntry?.severity).toBe(AuditSeverity.WARN);
      expect(unauthEntry?.severity).toBe(AuditSeverity.CRITICAL);
    });

    it('should include metadata and changes', async () => {
      await service.log(
        'user.update',
        'User updated profile',
        {
          actorId: 'user-123',
          targetId: 'user-123',
          metadata: { source: 'web' },
          changes: {
            before: { name: 'Old Name' },
            after: { name: 'New Name' },
          },
        }
      );

      const entries = await service.query({ actorId: 'user-123' });

      expect(entries[0].metadata).toEqual({ source: 'web' });
      expect(entries[0].changes?.before).toEqual({ name: 'Old Name' });
      expect(entries[0].changes?.after).toEqual({ name: 'New Name' });
    });
  });

  describe('logAuth', () => {
    it('should log successful authentication', async () => {
      await service.logAuth(
        AuditAction.LOGIN,
        'user-123',
        { ipAddress: '192.168.1.1' },
        true
      );

      const entries = await service.query({ actorId: 'user-123' });

      expect(entries[0].severity).toBe(AuditSeverity.INFO);
    });

    it('should log failed authentication with warning', async () => {
      await service.logAuth(
        AuditAction.LOGIN,
        'user-123',
        { ipAddress: '192.168.1.1' },
        false
      );

      const entries = await service.query({ actorId: 'user-123' });

      expect(entries[0].severity).toBe(AuditSeverity.WARN);
    });
  });

  describe('logDataAccess', () => {
    it('should log data view access', async () => {
      await service.logDataAccess(
        'workout',
        'workout-456',
        'user-123',
        'view',
        {}
      );

      const entries = await service.query({ actorId: 'user-123' });

      expect(entries[0].action).toBe('data.view');
      expect(entries[0].targetType).toBe('workout');
      expect(entries[0].targetId).toBe('workout-456');
    });

    it('should log data export access', async () => {
      await service.logDataAccess(
        'user_data',
        'user-123',
        'user-123',
        'export',
        {}
      );

      const entries = await service.query({ actorId: 'user-123' });

      expect(entries[0].action).toBe('data.export');
    });
  });

  describe('logDataChange', () => {
    it('should log data creation', async () => {
      await service.logDataChange(
        'workout',
        'workout-789',
        'user-123',
        'create',
        undefined,
        { title: 'New Workout' },
        {}
      );

      const entries = await service.query({ actorId: 'user-123' });

      expect(entries[0].action).toBe('workout.create');
      expect(entries[0].changes?.after).toEqual({ title: 'New Workout' });
    });

    it('should log data update with before/after', async () => {
      await service.logDataChange(
        'workout',
        'workout-789',
        'user-123',
        'update',
        { title: 'Old Title' },
        { title: 'New Title' },
        {}
      );

      const entries = await service.query({ actorId: 'user-123' });

      expect(entries[0].changes?.before).toEqual({ title: 'Old Title' });
      expect(entries[0].changes?.after).toEqual({ title: 'New Title' });
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security events as critical', async () => {
      await service.logSecurityEvent(
        AuditAction.SUSPICIOUS_ACTIVITY,
        'Multiple failed login attempts detected',
        { ipAddress: '192.168.1.1' },
        'user-123'
      );

      const entries = await service.query({ actorId: 'user-123' });

      expect(entries[0].severity).toBe(AuditSeverity.CRITICAL);
    });
  });

  describe('logAdminAction', () => {
    it('should log admin actions with warning severity', async () => {
      await service.logAdminAction(
        AuditAction.ADMIN_USER_EDIT,
        'admin-1',
        'user-123',
        'Admin modified user account',
        {}
      );

      const entries = await service.query({ actorId: 'admin-1' });

      expect(entries[0].actorType).toBe('admin');
      expect(entries[0].severity).toBe(AuditSeverity.WARN);
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      // Add some test data
      await service.log(AuditAction.LOGIN, 'Login 1', { actorId: 'user-1' });
      await service.log(AuditAction.LOGIN, 'Login 2', { actorId: 'user-2' });
      await service.log(AuditAction.LOGOUT, 'Logout 1', { actorId: 'user-1' });
      await service.logSecurityEvent(AuditAction.SUSPICIOUS_ACTIVITY, 'Suspicious', {}, 'user-1');
    });

    it('should filter by action', async () => {
      const entries = await service.query({ action: AuditAction.LOGIN });

      expect(entries).toHaveLength(2);
      entries.forEach(e => expect(e.action).toBe(AuditAction.LOGIN));
    });

    it('should filter by actorId', async () => {
      const entries = await service.query({ actorId: 'user-1' });

      expect(entries).toHaveLength(3);
      entries.forEach(e => expect(e.actorId).toBe('user-1'));
    });

    it('should filter by severity', async () => {
      const entries = await service.query({ severity: AuditSeverity.CRITICAL });

      expect(entries).toHaveLength(1);
      expect(entries[0].action).toBe(AuditAction.SUSPICIOUS_ACTIVITY);
    });

    it('should respect limit', async () => {
      const entries = await service.query({ limit: 2 });

      expect(entries).toHaveLength(2);
    });

    it('should respect offset', async () => {
      const allEntries = await service.query({});
      const offsetEntries = await service.query({ offset: 2 });

      expect(offsetEntries).toHaveLength(allEntries.length - 2);
    });
  });

  describe('getUserAuditTrail', () => {
    it('should get all audit entries for a user', async () => {
      await service.log(AuditAction.LOGIN, 'Login', { actorId: 'trail-user' });
      await service.log(AuditAction.LOGOUT, 'Logout', { actorId: 'trail-user' });
      await service.log(AuditAction.LOGIN, 'Other user', { actorId: 'other-user' });

      const trail = await service.getUserAuditTrail('trail-user');

      expect(trail).toHaveLength(2);
      trail.forEach(e => expect(e.actorId).toBe('trail-user'));
    });
  });

  describe('getSecurityEvents', () => {
    it('should get recent critical security events', async () => {
      await service.logSecurityEvent(AuditAction.SUSPICIOUS_ACTIVITY, 'Event 1', {});
      await service.logSecurityEvent(AuditAction.UNAUTHORIZED_ACCESS, 'Event 2', {});
      await service.log(AuditAction.LOGIN, 'Normal event', { actorId: 'user' });

      const events = await service.getSecurityEvents({ hours: 1 });

      expect(events.length).toBeGreaterThanOrEqual(2);
      events.forEach(e => expect(e.severity).toBe(AuditSeverity.CRITICAL));
    });
  });

  describe('setEnabled', () => {
    it('should not log when disabled', async () => {
      service.setEnabled(false);

      await service.log(AuditAction.LOGIN, 'Should not log', { actorId: 'user' });

      const entries = await service.query({ actorId: 'user' });

      // Re-enable for other tests
      service.setEnabled(true);

      expect(entries).toHaveLength(0);
    });
  });
});

describe('MemoryAuditStore', () => {
  let store: MemoryAuditStore;

  beforeEach(() => {
    store = new MemoryAuditStore();
  });

  it('should save and query entries', async () => {
    await store.save({
      id: 'audit-1',
      timestamp: new Date().toISOString(),
      action: AuditAction.LOGIN,
      severity: AuditSeverity.INFO,
      actorType: 'user',
      actorId: 'user-123',
      description: 'Test entry',
      context: {},
    });

    const entries = await store.query({ actorId: 'user-123' });

    expect(entries).toHaveLength(1);
  });

  it('should count entries', async () => {
    await store.save({
      id: 'audit-1',
      timestamp: new Date().toISOString(),
      action: AuditAction.LOGIN,
      severity: AuditSeverity.INFO,
      actorType: 'user',
      actorId: 'user-123',
      description: 'Test 1',
      context: {},
    });

    await store.save({
      id: 'audit-2',
      timestamp: new Date().toISOString(),
      action: AuditAction.LOGIN,
      severity: AuditSeverity.INFO,
      actorType: 'user',
      actorId: 'user-123',
      description: 'Test 2',
      context: {},
    });

    const count = await store.count({ actorId: 'user-123' });

    expect(count).toBe(2);
  });
});
