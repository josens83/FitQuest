import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MfaService } from './mfa.service';
import {
  EnableMfaDto,
  VerifyMfaDto,
  DisableMfaDto,
  MfaSetupResponseDto,
  MfaStatusResponseDto,
  RegenerateBackupCodesResponseDto,
  TrustedDeviceDto,
} from './dto/mfa.dto';

// Placeholder for actual auth guard - would be imported from auth module
// import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('mfa')
@Controller({ path: 'auth/mfa', version: '1' })
// @UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get MFA status for current user' })
  @ApiResponse({
    status: 200,
    description: 'MFA status',
    type: MfaStatusResponseDto,
  })
  async getMfaStatus(@Req() req: any): Promise<MfaStatusResponseDto> {
    // In real implementation, this would fetch from database
    const userId = req.user?.sub;

    // Placeholder response
    return {
      enabled: false,
      backupCodesRemaining: 0,
    };
  }

  @Post('setup')
  @ApiOperation({ summary: 'Initialize MFA setup' })
  @ApiResponse({
    status: 200,
    description: 'MFA setup data including QR code',
    type: MfaSetupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'MFA already enabled',
  })
  async setupMfa(@Req() req: any): Promise<MfaSetupResponseDto> {
    const userId = req.user?.sub || 'test-user';
    const email = req.user?.email || 'user@example.com';

    const setup = await this.mfaService.generateMfaSetup(userId, email);

    return {
      secret: setup.secret,
      otpauthUrl: setup.otpauthUrl,
      qrCodeDataUrl: setup.qrCodeDataUrl,
      backupCodes: setup.backupCodes,
    };
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable MFA after verifying TOTP' })
  @ApiResponse({
    status: 200,
    description: 'MFA enabled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token or MFA already enabled',
  })
  async enableMfa(
    @Req() req: any,
    @Body() dto: EnableMfaDto,
  ): Promise<{ success: boolean; message: string }> {
    // Verify the TOTP token
    const isValid = this.mfaService.verifyTotp(dto.secret, dto.token);

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid verification code. Please try again.',
      };
    }

    // In real implementation:
    // 1. Encrypt and store the secret
    // 2. Hash and store backup codes
    // 3. Update user's MFA status
    // 4. Log audit event

    return {
      success: true,
      message: 'MFA has been enabled successfully.',
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA token during login' })
  @ApiResponse({
    status: 200,
    description: 'MFA verified successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid MFA token',
  })
  async verifyMfa(
    @Req() req: any,
    @Body() dto: VerifyMfaDto,
  ): Promise<{ success: boolean; message: string }> {
    this.mfaService.validateTokenFormat(dto.token);

    // In real implementation:
    // 1. Fetch user's encrypted secret and hashed backup codes
    // 2. Decrypt secret
    // 3. Verify TOTP or backup code
    // 4. If backup code used, remove it from list
    // 5. If trustDevice, create trusted device token
    // 6. Issue full access token

    return {
      success: true,
      message: 'MFA verification successful.',
    };
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({
    status: 200,
    description: 'MFA disabled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid password or token',
  })
  async disableMfa(
    @Req() req: any,
    @Body() dto: DisableMfaDto,
  ): Promise<{ success: boolean; message: string }> {
    // In real implementation:
    // 1. Verify password
    // 2. Verify TOTP or backup code
    // 3. Remove MFA secret and backup codes
    // 4. Remove trusted devices
    // 5. Log audit event

    return {
      success: true,
      message: 'MFA has been disabled.',
    };
  }

  @Post('backup-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate backup codes' })
  @ApiResponse({
    status: 200,
    description: 'New backup codes generated',
    type: RegenerateBackupCodesResponseDto,
  })
  async regenerateBackupCodes(
    @Req() req: any,
    @Body() body: { token: string },
  ): Promise<RegenerateBackupCodesResponseDto> {
    this.mfaService.validateTokenFormat(body.token);

    // In real implementation:
    // 1. Verify current TOTP token
    // 2. Generate new backup codes
    // 3. Hash and store new codes
    // 4. Return plaintext codes to user (only time they'll see them)

    const { codes } = this.mfaService.regenerateBackupCodes();

    return {
      backupCodes: codes,
      warning: 'Previous backup codes are now invalid. Store these codes securely.',
    };
  }

  @Get('trusted-devices')
  @ApiOperation({ summary: 'List trusted devices' })
  @ApiResponse({
    status: 200,
    description: 'List of trusted devices',
    type: [TrustedDeviceDto],
  })
  async getTrustedDevices(@Req() req: any): Promise<TrustedDeviceDto[]> {
    // In real implementation, fetch from database
    return [];
  }

  @Delete('trusted-devices/:deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a trusted device' })
  @ApiResponse({
    status: 204,
    description: 'Device removed',
  })
  async removeTrustedDevice(
    @Req() req: any,
    @Param('deviceId') deviceId: string,
  ): Promise<void> {
    // In real implementation:
    // 1. Verify device belongs to user
    // 2. Remove trusted device record
    // 3. Log audit event
  }

  @Delete('trusted-devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove all trusted devices' })
  @ApiResponse({
    status: 204,
    description: 'All devices removed',
  })
  async removeAllTrustedDevices(@Req() req: any): Promise<void> {
    // In real implementation:
    // 1. Remove all trusted device records for user
    // 2. Log audit event
  }
}
