import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '../logging';

export enum AuditAction {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  PASSWORD_CHANGE = 'auth.password_change',
  PASSWORD_RESET_REQUEST = 'auth.password_reset_request',
  PASSWORD_RESET = 'auth.password_reset',
  TOKEN_REFRESH = 'auth.token_refresh',
  MFA_ENABLED = 'auth.mfa_enabled',
  MFA_DISABLED = 'auth.mfa_disabled',

  // User management
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_DEACTIVATE = 'user.deactivate',
  USER_REACTIVATE = 'user.reactivate',
  PROFILE_UPDATE = 'user.profile_update',
  EMAIL_CHANGE = 'user.email_change',

  // Data access
  DATA_VIEW = 'data.view',
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  DATA_DELETE = 'data.delete',

  // Subscription
  SUBSCRIPTION_CREATE = 'subscription.create',
  SUBSCRIPTION_UPDATE = 'subscription.update',
  SUBSCRIPTION_CANCEL = 'subscription.cancel',
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',

  // Admin actions
  ADMIN_USER_VIEW = 'admin.user_view',
  ADMIN_USER_EDIT = 'admin.user_edit',
  ADMIN_CONFIG_CHANGE = 'admin.config_change',
  ADMIN_ROLE_ASSIGN = 'admin.role_assign',
  ADMIN_PERMISSION_GRANT = 'admin.permission_grant',

  // Security events
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'security.unauthorized_access',
  PERMISSION_DENIED = 'security.permission_denied',
}

export enum AuditSeverity {
  INFO = 'info',
  WARN = 'warn',
  CRITICAL = 'critical',
}

export interface AuditContext {
  userId?: string;
  targetUserId?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  sessionId?: string;
  [key: string]: any;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction | string;
  severity: AuditSeverity;
  actorId?: string;
  actorType: 'user' | 'system' | 'admin' | 'api';
  targetType?: string;
  targetId?: string;
  description: string;
  context: AuditContext;
  metadata?: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

export interface AuditStore {
  save(entry: AuditEntry): Promise<void>;
  query(options: AuditQueryOptions): Promise<AuditEntry[]>;
  count(options: AuditQueryOptions): Promise<number>;
}

export interface AuditQueryOptions {
  action?: AuditAction | string;
  actorId?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: AuditSeverity;
  limit?: number;
  offset?: number;
}

/**
 * In-memory audit store (for development/testing)
 */
export class MemoryAuditStore implements AuditStore {
  private entries: AuditEntry[] = [];
  private maxEntries = 10000;

  async save(entry: AuditEntry): Promise<void> {
    this.entries.unshift(entry);

    // Trim old entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
  }

  async query(options: AuditQueryOptions): Promise<AuditEntry[]> {
    let filtered = [...this.entries];

    if (options.action) {
      filtered = filtered.filter(e => e.action === options.action);
    }

    if (options.actorId) {
      filtered = filtered.filter(e => e.actorId === options.actorId);
    }

    if (options.targetId) {
      filtered = filtered.filter(e => e.targetId === options.targetId);
    }

    if (options.severity) {
      filtered = filtered.filter(e => e.severity === options.severity);
    }

    if (options.startDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= options.startDate!);
    }

    if (options.endDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= options.endDate!);
    }

    const offset = options.offset || 0;
    const limit = options.limit || 100;

    return filtered.slice(offset, offset + limit);
  }

  async count(options: AuditQueryOptions): Promise<number> {
    const results = await this.query({ ...options, limit: Infinity, offset: 0 });
    return results.length;
  }
}

@Injectable()
export class AuditService implements OnModuleInit {
  private store: AuditStore;
  private readonly logger = new LoggerService();
  private enabled = true;

  constructor() {
    this.store = new MemoryAuditStore();
    this.logger.setContext('Audit');
  }

  onModuleInit() {
    this.logger.log('Audit service initialized');
  }

  setStore(store: AuditStore): void {
    this.store = store;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Log an audit event
   */
  async log(
    action: AuditAction | string,
    description: string,
    options: {
      actorId?: string;
      actorType?: 'user' | 'system' | 'admin' | 'api';
      targetType?: string;
      targetId?: string;
      severity?: AuditSeverity;
      context?: AuditContext;
      metadata?: Record<string, any>;
      changes?: { before?: Record<string, any>; after?: Record<string, any> };
    } = {},
  ): Promise<void> {
    if (!this.enabled) return;

    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action,
      severity: options.severity || this.getSeverityForAction(action),
      actorId: options.actorId,
      actorType: options.actorType || 'user',
      targetType: options.targetType,
      targetId: options.targetId,
      description,
      context: options.context || {},
      metadata: options.metadata,
      changes: options.changes,
    };

    try {
      await this.store.save(entry);

      // Also log to structured logger for immediate visibility
      const logMethod = entry.severity === AuditSeverity.CRITICAL
        ? 'error'
        : entry.severity === AuditSeverity.WARN
          ? 'warn'
          : 'log';

      this.logger[logMethod](`[AUDIT] ${action}: ${description}`, {
        auditId: entry.id,
        actorId: entry.actorId,
        targetId: entry.targetId,
        ...entry.context,
      });
    } catch (error) {
      this.logger.error('Failed to save audit entry', error as Error);
    }
  }

  /**
   * Log authentication event
   */
  async logAuth(
    action: AuditAction,
    userId: string | undefined,
    context: AuditContext,
    success: boolean = true,
  ): Promise<void> {
    const description = this.getAuthDescription(action, success);
    await this.log(action, description, {
      actorId: userId,
      actorType: 'user',
      context,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARN,
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    resourceType: string,
    resourceId: string,
    userId: string,
    accessType: 'view' | 'export' | 'delete',
    context: AuditContext,
  ): Promise<void> {
    const action = `data.${accessType}`;
    const description = `User accessed ${resourceType} (${accessType})`;

    await this.log(action, description, {
      actorId: userId,
      actorType: 'user',
      targetType: resourceType,
      targetId: resourceId,
      context,
    });
  }

  /**
   * Log data modification with before/after state
   */
  async logDataChange(
    resourceType: string,
    resourceId: string,
    userId: string,
    changeType: 'create' | 'update' | 'delete',
    before: Record<string, any> | undefined,
    after: Record<string, any> | undefined,
    context: AuditContext,
  ): Promise<void> {
    const action = `${resourceType}.${changeType}`;
    const description = `${resourceType} ${changeType}d`;

    await this.log(action, description, {
      actorId: userId,
      actorType: 'user',
      targetType: resourceType,
      targetId: resourceId,
      context,
      changes: { before, after },
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    action: AuditAction,
    description: string,
    context: AuditContext,
    userId?: string,
  ): Promise<void> {
    await this.log(action, description, {
      actorId: userId,
      actorType: userId ? 'user' : 'system',
      context,
      severity: AuditSeverity.CRITICAL,
    });
  }

  /**
   * Log admin action
   */
  async logAdminAction(
    action: AuditAction,
    adminId: string,
    targetUserId: string | undefined,
    description: string,
    context: AuditContext,
  ): Promise<void> {
    await this.log(action, description, {
      actorId: adminId,
      actorType: 'admin',
      targetType: 'user',
      targetId: targetUserId,
      context,
      severity: AuditSeverity.WARN,
    });
  }

  /**
   * Query audit logs
   */
  async query(options: AuditQueryOptions): Promise<AuditEntry[]> {
    return this.store.query(options);
  }

  /**
   * Count audit entries matching criteria
   */
  async count(options: AuditQueryOptions): Promise<number> {
    return this.store.count(options);
  }

  /**
   * Get user's audit trail
   */
  async getUserAuditTrail(
    userId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<AuditEntry[]> {
    return this.store.query({
      actorId: userId,
      limit: options.limit || 100,
      offset: options.offset || 0,
    });
  }

  /**
   * Get recent security events
   */
  async getSecurityEvents(
    options: { limit?: number; hours?: number } = {},
  ): Promise<AuditEntry[]> {
    const hours = options.hours || 24;
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.store.query({
      severity: AuditSeverity.CRITICAL,
      startDate,
      limit: options.limit || 100,
    });
  }

  private getSeverityForAction(action: AuditAction | string): AuditSeverity {
    const criticalActions = [
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.UNAUTHORIZED_ACCESS,
      AuditAction.ADMIN_PERMISSION_GRANT,
      AuditAction.USER_DELETE,
      AuditAction.DATA_DELETE,
    ];

    const warnActions = [
      AuditAction.LOGIN_FAILED,
      AuditAction.PERMISSION_DENIED,
      AuditAction.RATE_LIMIT_EXCEEDED,
      AuditAction.PASSWORD_RESET_REQUEST,
      AuditAction.ADMIN_USER_EDIT,
      AuditAction.ADMIN_CONFIG_CHANGE,
    ];

    if (criticalActions.includes(action as AuditAction)) {
      return AuditSeverity.CRITICAL;
    }

    if (warnActions.includes(action as AuditAction)) {
      return AuditSeverity.WARN;
    }

    return AuditSeverity.INFO;
  }

  private getAuthDescription(action: AuditAction, success: boolean): string {
    const descriptions: Record<string, string> = {
      [AuditAction.LOGIN]: success ? 'User logged in successfully' : 'Login attempt failed',
      [AuditAction.LOGOUT]: 'User logged out',
      [AuditAction.LOGIN_FAILED]: 'Login attempt failed',
      [AuditAction.PASSWORD_CHANGE]: 'Password changed',
      [AuditAction.PASSWORD_RESET_REQUEST]: 'Password reset requested',
      [AuditAction.PASSWORD_RESET]: 'Password reset completed',
      [AuditAction.TOKEN_REFRESH]: 'Authentication token refreshed',
      [AuditAction.MFA_ENABLED]: 'Multi-factor authentication enabled',
      [AuditAction.MFA_DISABLED]: 'Multi-factor authentication disabled',
    };

    return descriptions[action] || action;
  }
}
