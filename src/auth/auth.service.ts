import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub?: string;
  user_id?: string;
  user_roles?: string[];
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Decode a JWT token without validating it
   * Use this for logging and debugging only
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      this.logger.log('===== MANUALLY DECODING TOKEN =====');
      // Simple decode without verification
      const decoded: unknown = this.jwtService.decode(token);
      this.logger.log('Decoded Token:', JSON.stringify(decoded, null, 2));
      return decoded as JwtPayload;
    } catch (error) {
      this.logger.error(
        'Error decoding token:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return null;
    } finally {
      this.logger.log('===================================');
    }
  }

  /**
   * Validate a JWT token against our secret
   * This manually runs the verification process
   */
  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      this.logger.log('===== MANUALLY VALIDATING TOKEN =====');
      const secret =
        this.configService.get('NODE_ENV') === 'development'
          ? this.configService.get<string>('DEV_JWT_SECRET')
          : this.configService.get<string>('PROD_JWT_SECRET');

      this.logger.log(
        'Using secret from:',
        this.configService.get('NODE_ENV') === 'development'
          ? 'DEV_JWT_SECRET'
          : 'PROD_JWT_SECRET',
      );

      const verified = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });
      this.logger.log('Token validation: SUCCESS');
      this.logger.log('Verified Token:', JSON.stringify(verified, null, 2));
      return verified;
    } catch (error) {
      this.logger.error('Token validation: FAILED');
      this.logger.error(
        'Validation error:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return null;
    } finally {
      this.logger.log('====================================');
    }
  }

  /**
   * Generate a test token with the provided email
   * This is for debugging and testing purposes only
   */
  generateTestToken(email: string = 'outreach@hackcc.net'): string {
    try {
      this.logger.log('===== GENERATING TEST TOKEN =====');
      const payload = {
        sub: 'test-user-id',
        user_id: 'test-user-id',
        email: email, // Include email for account lookup
        name: 'Test User',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
      };

      const secret =
        this.configService.get('NODE_ENV') === 'development'
          ? this.configService.get<string>('DEV_JWT_SECRET')
          : this.configService.get<string>('PROD_JWT_SECRET');

      const token = this.jwtService.sign(payload, { secret });
      this.logger.log('Generated test token for email:', email);
      this.logger.log('Token payload:', JSON.stringify(payload, null, 2));
      return token;
    } catch (error) {
      this.logger.error(
        'Error generating test token:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return '';
    } finally {
      this.logger.log('=================================');
    }
  }
}
