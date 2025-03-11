import {
  Controller,
  Post,
  Body,
  Logger,
  Get,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt.auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { AccountRoles } from './role.enum';

class TokenDebugDto {
  token: string;
}

interface JwtPayload {
  sub?: string;
  user_id?: string;
  user_roles?: string[];
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

interface TokenDebugResponse {
  success: boolean;
  message?: string;
  decoded: JwtPayload | string;
  verified: string;
  tokenInfo: JwtPayload | string;
}

interface RequestWithUser extends Request {
  user: JwtPayload;
}

interface AuthTestResponse {
  message: string;
  user: JwtPayload;
  timestamp: string;
}

@ApiTags('Auth Debug')
@Controller('auth-debug')
export class AuthDebugController {
  private readonly logger = new Logger(AuthDebugController.name);

  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Debug a JWT token' })
  @ApiBody({
    description: 'JWT token to debug',
    type: TokenDebugDto,
  })
  @Post('debug-token')
  async debugToken(
    @Body() tokenDto: TokenDebugDto,
  ): Promise<TokenDebugResponse> {
    this.logger.log('===== Debug Token Request =====');

    if (!tokenDto.token) {
      this.logger.error('No token provided');
      return {
        success: false,
        message: 'No token provided',
        decoded: 'No token provided',
        verified: 'Token verification failed',
        tokenInfo: 'Invalid token',
      };
    }

    // First decode without verification
    const decoded = this.authService.decodeToken(tokenDto.token) as JwtPayload;

    // Then verify with our secret
    const verified = (await this.authService.validateToken(
      tokenDto.token,
    )) as JwtPayload;

    return {
      success: true,
      decoded: decoded || 'Failed to decode token',
      verified: verified
        ? 'Token verified successfully'
        : 'Token verification failed',
      tokenInfo: verified || 'Invalid token',
    };
  }

  @ApiOperation({ summary: 'Test authentication and roles' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
  @Get('test-auth')
  testAuth(@Request() req: RequestWithUser): AuthTestResponse {
    this.logger.log('===== Test Auth Endpoint =====');
    this.logger.log(`User: ${JSON.stringify(req.user, null, 2)}`);

    return {
      message: 'If you see this, authentication and authorization are working!',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Generate a test token for a specific email' })
  @Get('generate-test-token')
  generateTestToken(@Query('email') email?: string): {
    token: string;
    email: string;
    swagger_instructions: string;
  } {
    this.logger.log('===== Generate Test Token Request =====');

    // Default emails that exist in your account table
    const validEmails = [
      'dev@hackcc.net',
      'eangchheangly@gmail.com',
      'lyeangchheang@gmail.com',
      'outreach@hackcc.net',
    ];

    // Use provided email or default to outreach@hackcc.net
    const targetEmail =
      email && email.trim() ? email.trim() : 'outreach@hackcc.net';

    this.logger.log(`Generating token for email: ${targetEmail}`);

    // Check if email exists in our known list
    if (!validEmails.includes(targetEmail) && email) {
      this.logger.warn(
        `Warning: ${targetEmail} is not in our known list of emails with roles`,
      );
    }

    const token = this.authService.generateTestToken(targetEmail);

    return {
      token,
      email: targetEmail,
      swagger_instructions:
        "Copy ONLY this token and paste it in the Swagger Authorize popup. Do not include 'Bearer' prefix.",
    };
  }

  @ApiOperation({ summary: 'Get information about Swagger authorization' })
  @Get('swagger-help')
  getSwaggerHelp(): { instructions: string; example: string } {
    return {
      instructions:
        'To use authenticated endpoints in Swagger UI:\n' +
        "1. Click the 'Authorize' button at the top of the page\n" +
        "2. In the popup, enter ONLY your JWT token (without the 'Bearer' prefix)\n" +
        "3. Click 'Authorize' and close the popup\n" +
        '4. Now your requests will include the proper Authorization header',
      example:
        "If your token is 'eyJhbGciOiJIUzI1NiIs...', enter just that in the Authorize popup.",
    };
  }
}
