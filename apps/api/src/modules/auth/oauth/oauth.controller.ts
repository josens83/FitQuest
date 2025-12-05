import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { OAuthService, OAuthLoginResult } from './oauth.service';
import { GoogleUser } from '../strategies/google.strategy';
import { ConfigService } from '@nestjs/config';

@ApiTags('oauth')
@Controller({ path: 'auth', version: '1' })
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly configService: ConfigService,
  ) {}

  // ============ Google OAuth ============

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  googleAuth() {
    // Guard handles redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiQuery({ name: 'code', required: true })
  @ApiResponse({ status: 302, description: 'Redirects to app with tokens' })
  async googleAuthCallback(
    @Req() req: { user: GoogleUser },
    @Res() res: Response,
  ) {
    const result = await this.oauthService.handleOAuthLogin({
      provider: 'google',
      providerId: req.user.googleId,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      picture: req.user.picture,
    });

    // Redirect to frontend with tokens
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const redirectUrl = new URL('/auth/callback', frontendUrl);
    redirectUrl.searchParams.set('token', result.tokens.accessToken);
    redirectUrl.searchParams.set('refresh', result.tokens.refreshToken);
    redirectUrl.searchParams.set('isNewUser', String(result.user.isNewUser));

    return res.redirect(redirectUrl.toString());
  }

  // ============ Apple OAuth ============

  @Post('apple')
  @ApiOperation({ summary: 'Apple Sign In with identity token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async appleAuth(
    @Body() body: { identityToken: string; user?: { email?: string; name?: { firstName?: string; lastName?: string } } },
  ): Promise<OAuthLoginResult> {
    // Apple sends identity token directly from client
    const appleUser = await this.oauthService.verifyAppleToken(body.identityToken);

    // Apple only sends user info on first login
    if (body.user) {
      appleUser.email = body.user.email || appleUser.email;
      appleUser.firstName = body.user.name?.firstName;
      appleUser.lastName = body.user.name?.lastName;
    }

    return this.oauthService.handleOAuthLogin(appleUser);
  }

  // ============ Provider Management ============

  @Get('providers')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get linked OAuth providers' })
  @ApiResponse({
    status: 200,
    description: 'List of linked providers',
    schema: {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: { type: 'string' },
          example: ['google', 'apple'],
        },
      },
    },
  })
  async getLinkedProviders(@Req() req: any): Promise<{ providers: string[] }> {
    const userId = req.user?.sub;
    const providers = await this.oauthService.getLinkedProviders(userId);
    return { providers };
  }

  @Post('link/:provider')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link OAuth provider to account' })
  @ApiResponse({ status: 200, description: 'Provider linked' })
  async linkProvider(
    @Req() req: any,
    @Param('provider') provider: string,
    @Body() body: { token: string },
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user?.sub;

    // Verify the OAuth token and get user info
    // In real implementation, verify the token with the provider

    return this.oauthService.linkOAuthProvider(userId, {
      provider: provider as 'google' | 'apple' | 'kakao',
      providerId: 'extracted-from-token',
      email: 'extracted-from-token',
    });
  }

  @Delete('unlink/:provider')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink OAuth provider from account' })
  @ApiResponse({ status: 200, description: 'Provider unlinked' })
  async unlinkProvider(
    @Req() req: any,
    @Param('provider') provider: string,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user?.sub;
    return this.oauthService.unlinkOAuthProvider(userId, provider);
  }

  // ============ Mobile OAuth ============

  @Post('mobile/google')
  @ApiOperation({ summary: 'Google Sign In for mobile apps' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async mobileGoogleAuth(
    @Body() body: { idToken: string },
  ): Promise<OAuthLoginResult> {
    // For mobile apps, verify the ID token directly
    // In real implementation:
    // 1. Verify idToken with Google
    // 2. Extract user info
    // 3. Handle login/registration

    return this.oauthService.handleOAuthLogin({
      provider: 'google',
      providerId: 'mobile-google-id',
      email: 'user@example.com',
    });
  }

  @Post('mobile/apple')
  @ApiOperation({ summary: 'Apple Sign In for mobile apps' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async mobileAppleAuth(
    @Body() body: { identityToken: string; authorizationCode: string; user?: { email?: string; name?: { firstName?: string; lastName?: string } } },
  ): Promise<OAuthLoginResult> {
    const appleUser = await this.oauthService.verifyAppleToken(body.identityToken);

    if (body.user) {
      appleUser.email = body.user.email || appleUser.email;
      appleUser.firstName = body.user.name?.firstName;
      appleUser.lastName = body.user.name?.lastName;
    }

    return this.oauthService.handleOAuthLogin(appleUser);
  }
}
