import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

export interface OAuthUser {
  provider: 'google' | 'apple' | 'kakao';
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface OAuthLoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    isNewUser: boolean;
  };
  tokens: OAuthTokens;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Handle OAuth login/registration
   */
  async handleOAuthLogin(oauthUser: OAuthUser): Promise<OAuthLoginResult> {
    this.logger.log(`OAuth login attempt: ${oauthUser.provider} - ${oauthUser.email}`);

    // In real implementation:
    // 1. Check if user exists by providerId or email
    // 2. If exists, update OAuth tokens and return user
    // 3. If not exists, create new user with OAuth provider linked
    // 4. Generate JWT tokens

    const isNewUser = false; // Would be determined by database lookup
    const userId = this.generateUserId(oauthUser);

    const tokens = await this.generateTokens({
      sub: userId,
      email: oauthUser.email,
      provider: oauthUser.provider,
    });

    return {
      user: {
        id: userId,
        email: oauthUser.email,
        name: `${oauthUser.firstName || ''} ${oauthUser.lastName || ''}`.trim(),
        picture: oauthUser.picture,
        isNewUser,
      },
      tokens,
    };
  }

  /**
   * Link OAuth provider to existing account
   */
  async linkOAuthProvider(
    userId: string,
    oauthUser: OAuthUser,
  ): Promise<{ success: boolean; message: string }> {
    // In real implementation:
    // 1. Verify user exists
    // 2. Check if provider already linked
    // 3. Check if provider is linked to another account
    // 4. Link provider to user account

    this.logger.log(`Linking ${oauthUser.provider} to user ${userId}`);

    return {
      success: true,
      message: `${oauthUser.provider} account linked successfully`,
    };
  }

  /**
   * Unlink OAuth provider from account
   */
  async unlinkOAuthProvider(
    userId: string,
    provider: string,
  ): Promise<{ success: boolean; message: string }> {
    // In real implementation:
    // 1. Verify user has password set (can't unlink all providers without password)
    // 2. Remove provider link

    this.logger.log(`Unlinking ${provider} from user ${userId}`);

    return {
      success: true,
      message: `${provider} account unlinked successfully`,
    };
  }

  /**
   * Get linked OAuth providers for user
   */
  async getLinkedProviders(userId: string): Promise<string[]> {
    // In real implementation, fetch from database
    return [];
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(payload: {
    sub: string;
    email: string;
    provider: string;
  }): Promise<OAuthTokens> {
    const accessTokenExpiry = this.configService.get('JWT_EXPIRATION', '1d');
    const refreshTokenExpiry = this.configService.get('JWT_REFRESH_EXPIRATION', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: accessTokenExpiry,
      }),
      this.jwtService.signAsync(
        { sub: payload.sub, type: 'refresh' },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: refreshTokenExpiry,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(accessTokenExpiry),
    };
  }

  /**
   * Generate deterministic user ID from OAuth data
   */
  private generateUserId(oauthUser: OAuthUser): string {
    // In real implementation, this would be from database
    // Using hash for demo purposes
    const hash = crypto
      .createHash('sha256')
      .update(`${oauthUser.provider}:${oauthUser.providerId}`)
      .digest('hex')
      .substring(0, 24);
    return `oauth_${hash}`;
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 86400; // Default 1 day

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 86400;
    }
  }

  /**
   * Verify Apple identity token
   */
  async verifyAppleToken(identityToken: string): Promise<OAuthUser> {
    // In real implementation:
    // 1. Fetch Apple's public keys from https://appleid.apple.com/auth/keys
    // 2. Verify JWT signature
    // 3. Validate claims (iss, aud, exp)
    // 4. Extract user info

    throw new UnauthorizedException('Apple Sign In not yet implemented');
  }

  /**
   * Generate state parameter for OAuth flow
   */
  generateStateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify state parameter
   */
  verifyStateToken(state: string, expectedState: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(state),
      Buffer.from(expectedState),
    );
  }
}
