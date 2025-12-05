import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

export interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface MfaVerifyResult {
  success: boolean;
  backupCodeUsed?: boolean;
}

@Injectable()
export class MfaService {
  private readonly issuer: string;
  private readonly backupCodeCount = 10;
  private readonly backupCodeLength = 8;

  constructor(private readonly configService: ConfigService) {
    this.issuer = this.configService.get('APP_NAME', 'FitQuest');

    // Configure otplib
    authenticator.options = {
      window: 1, // Allow 1 step before/after for clock drift
      digits: 6,
      step: 30, // 30 second window
    };
  }

  /**
   * Generate MFA secret and QR code for setup
   */
  async generateMfaSetup(userId: string, email: string): Promise<MfaSetupResult> {
    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate otpauth URL
    const otpauthUrl = authenticator.keyuri(email, this.issuer, secret);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 256,
      margin: 2,
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP token
   */
  verifyTotp(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  /**
   * Verify MFA with TOTP or backup code
   */
  verifyMfa(
    secret: string,
    token: string,
    hashedBackupCodes: string[],
  ): MfaVerifyResult {
    // First try TOTP
    if (this.verifyTotp(secret, token)) {
      return { success: true, backupCodeUsed: false };
    }

    // Then try backup codes (if token is 8 chars, it might be a backup code)
    if (token.length === this.backupCodeLength) {
      const hashedToken = this.hashBackupCode(token);
      const codeIndex = hashedBackupCodes.indexOf(hashedToken);

      if (codeIndex !== -1) {
        return { success: true, backupCodeUsed: true };
      }
    }

    return { success: false };
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < this.backupCodeCount; i++) {
      const code = crypto
        .randomBytes(this.backupCodeLength / 2)
        .toString('hex')
        .toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash backup codes for storage
   */
  hashBackupCodes(codes: string[]): string[] {
    return codes.map((code) => this.hashBackupCode(code));
  }

  /**
   * Hash a single backup code
   */
  hashBackupCode(code: string): string {
    return crypto
      .createHash('sha256')
      .update(code.toUpperCase())
      .digest('hex');
  }

  /**
   * Remove used backup code from list
   */
  removeUsedBackupCode(
    hashedBackupCodes: string[],
    usedCode: string,
  ): string[] {
    const hashedUsedCode = this.hashBackupCode(usedCode);
    return hashedBackupCodes.filter((code) => code !== hashedUsedCode);
  }

  /**
   * Generate new backup codes (regenerate all)
   */
  regenerateBackupCodes(): { codes: string[]; hashedCodes: string[] } {
    const codes = this.generateBackupCodes();
    const hashedCodes = this.hashBackupCodes(codes);
    return { codes, hashedCodes };
  }

  /**
   * Encrypt MFA secret for storage
   */
  encryptSecret(secret: string): string {
    const encryptionKey = this.configService.get('MFA_ENCRYPTION_KEY');

    if (!encryptionKey) {
      throw new Error('MFA_ENCRYPTION_KEY is not configured');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(encryptionKey, 'hex'),
      iv,
    );

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt MFA secret from storage
   */
  decryptSecret(encryptedSecret: string): string {
    const encryptionKey = this.configService.get('MFA_ENCRYPTION_KEY');

    if (!encryptionKey) {
      throw new Error('MFA_ENCRYPTION_KEY is not configured');
    }

    const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(encryptionKey, 'hex'),
      iv,
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Validate token format
   */
  validateTokenFormat(token: string): void {
    // TOTP is 6 digits, backup code is 8 hex chars
    const isTotpFormat = /^\d{6}$/.test(token);
    const isBackupCodeFormat = /^[A-Z0-9]{8}$/i.test(token);

    if (!isTotpFormat && !isBackupCodeFormat) {
      throw new BadRequestException(
        'Invalid token format. Expected 6-digit TOTP or 8-character backup code.',
      );
    }
  }
}
