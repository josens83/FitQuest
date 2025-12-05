import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class EnableMfaDto {
  @ApiProperty({
    description: 'MFA secret from setup',
    example: 'JBSWY3DPEHPK3PXP',
  })
  @IsString()
  @IsNotEmpty()
  secret: string;

  @ApiProperty({
    description: '6-digit TOTP token to verify setup',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Token must be a 6-digit number' })
  token: string;
}

export class VerifyMfaDto {
  @ApiProperty({
    description: '6-digit TOTP token or 8-character backup code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\d{6}|[A-Z0-9]{8})$/i, {
    message: 'Token must be a 6-digit TOTP or 8-character backup code',
  })
  token: string;

  @ApiPropertyOptional({
    description: 'Trust this device for 30 days',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  trustDevice?: boolean;
}

export class DisableMfaDto {
  @ApiProperty({
    description: 'Current password to confirm MFA disable',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Current TOTP token or backup code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\d{6}|[A-Z0-9]{8})$/i)
  token: string;
}

export class MfaSetupResponseDto {
  @ApiProperty({
    description: 'Base32-encoded secret key',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'OTPAuth URL for manual entry',
    example: 'otpauth://totp/FitQuest:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=FitQuest',
  })
  otpauthUrl: string;

  @ApiProperty({
    description: 'QR code as base64 data URL',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  qrCodeDataUrl: string;

  @ApiProperty({
    description: 'One-time use backup codes',
    type: [String],
    example: ['A1B2C3D4', 'E5F6G7H8', '...'],
  })
  backupCodes: string[];
}

export class MfaStatusResponseDto {
  @ApiProperty({
    description: 'Whether MFA is enabled',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Number of remaining backup codes',
    example: 8,
  })
  backupCodesRemaining: number;

  @ApiPropertyOptional({
    description: 'When MFA was enabled',
    example: '2024-01-15T10:30:00.000Z',
  })
  enabledAt?: Date;

  @ApiPropertyOptional({
    description: 'Number of trusted devices',
    example: 2,
  })
  trustedDevices?: number;
}

export class RegenerateBackupCodesResponseDto {
  @ApiProperty({
    description: 'New backup codes (store these securely)',
    type: [String],
    example: ['A1B2C3D4', 'E5F6G7H8', '...'],
  })
  backupCodes: string[];

  @ApiProperty({
    description: 'Warning message',
    example: 'Previous backup codes are now invalid',
  })
  warning: string;
}

export class TrustedDeviceDto {
  @ApiProperty({
    description: 'Device ID',
    example: 'dev_abc123',
  })
  id: string;

  @ApiProperty({
    description: 'Device name/user agent',
    example: 'Chrome on Windows',
  })
  name: string;

  @ApiProperty({
    description: 'When the device was trusted',
  })
  trustedAt: Date;

  @ApiProperty({
    description: 'When the trust expires',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Last used timestamp',
  })
  lastUsedAt: Date;
}

export class MfaChallengeResponseDto {
  @ApiProperty({
    description: 'MFA challenge token for verification step',
    example: 'mfa_challenge_abc123',
  })
  challengeToken: string;

  @ApiProperty({
    description: 'Challenge expires at',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Hint about available MFA methods',
    example: 'TOTP app or backup code',
  })
  hint: string;
}
