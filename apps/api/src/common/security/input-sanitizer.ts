import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

// Simple HTML entity encoding
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;',
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

// SQL injection patterns to detect (not for sanitization, but for logging/blocking)
const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
  /exec(\s|\+)+(s|x)p\w+/i,
  /UNION\s+SELECT/i,
  /SELECT\s+.*\s+FROM/i,
  /INSERT\s+INTO/i,
  /DELETE\s+FROM/i,
  /DROP\s+TABLE/i,
  /UPDATE\s+.*\s+SET/i,
];

// XSS patterns to detect
const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<script[^>]*>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:/gi,
];

export interface SanitizationResult {
  sanitized: any;
  threats: string[];
  modified: boolean;
}

export class InputSanitizer {
  /**
   * Sanitize a string value
   */
  static sanitizeString(value: string, options: { escapeHtml?: boolean } = {}): string {
    if (typeof value !== 'string') return value;

    let result = value.trim();

    // Remove null bytes
    result = result.replace(/\0/g, '');

    // Optionally escape HTML
    if (options.escapeHtml) {
      result = escapeHtml(result);
    }

    return result;
  }

  /**
   * Deep sanitize an object or value
   */
  static sanitize(value: any, options: { escapeHtml?: boolean } = {}): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value, options);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item, options));
    }

    if (typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        // Sanitize keys too
        const sanitizedKey = this.sanitizeString(key, { escapeHtml: false });
        sanitized[sanitizedKey] = this.sanitize(val, options);
      }
      return sanitized;
    }

    return value;
  }

  /**
   * Check for potential SQL injection
   */
  static detectSqlInjection(value: string): boolean {
    if (typeof value !== 'string') return false;
    return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
  }

  /**
   * Check for potential XSS
   */
  static detectXss(value: string): boolean {
    if (typeof value !== 'string') return false;
    return XSS_PATTERNS.some((pattern) => pattern.test(value));
  }

  /**
   * Detect threats in any value
   */
  static detectThreats(value: any): string[] {
    const threats: string[] = [];

    const checkValue = (val: any, path: string = ''): void => {
      if (typeof val === 'string') {
        if (this.detectSqlInjection(val)) {
          threats.push(`SQL injection detected at ${path || 'root'}`);
        }
        if (this.detectXss(val)) {
          threats.push(`XSS detected at ${path || 'root'}`);
        }
      } else if (Array.isArray(val)) {
        val.forEach((item, index) => checkValue(item, `${path}[${index}]`));
      } else if (val && typeof val === 'object') {
        for (const [key, v] of Object.entries(val)) {
          checkValue(v, path ? `${path}.${key}` : key);
        }
      }
    };

    checkValue(value);
    return threats;
  }

  /**
   * Sanitize and detect threats
   */
  static sanitizeWithReport(value: any, options: { escapeHtml?: boolean } = {}): SanitizationResult {
    const threats = this.detectThreats(value);
    const sanitized = this.sanitize(value, options);
    const modified = JSON.stringify(value) !== JSON.stringify(sanitized);

    return {
      sanitized,
      threats,
      modified,
    };
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Strip HTML tags from string
   */
  static stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, '');
  }

  /**
   * Normalize whitespace
   */
  static normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}

/**
 * NestJS Pipe for automatic input sanitization
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  constructor(private readonly options: { escapeHtml?: boolean } = {}) {}

  transform(value: any, metadata: ArgumentMetadata): any {
    // Only sanitize body, query, and params
    if (!['body', 'query', 'param'].includes(metadata.type)) {
      return value;
    }

    return InputSanitizer.sanitize(value, this.options);
  }
}

/**
 * Decorator for marking fields that should not be sanitized
 */
export const SKIP_SANITIZATION = Symbol('skipSanitization');

export function SkipSanitization(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(SKIP_SANITIZATION, true, target, propertyKey);
  };
}
