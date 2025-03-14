import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, firstValueFrom } from 'rxjs';
import { Request } from 'express';

interface JwtUser {
  user_id: string;
  email: string;
  user_roles: string[];
  [key: string]: unknown;
}

interface AuthenticatedRequest extends Request {
  user: JwtUser;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('JwtAuthGuard: Verifying authentication...');

    try {
      const result = await super.canActivate(context);

      const isAuthenticated =
        result instanceof Observable ? await firstValueFrom(result) : result;

      if (isAuthenticated) {
        const request = context
          .switchToHttp()
          .getRequest<AuthenticatedRequest>();
        this.logger.log(
          `JwtAuthGuard: Authentication successful for request to ${request.path}`,
        );

        if (request.user) {
          this.logger.log(
            `JwtAuthGuard: User authenticated with ID: ${request.user.user_id}`,
          );
          this.logger.log(
            `JwtAuthGuard: User roles: ${JSON.stringify(request.user.user_roles)}`,
          );
        } else {
          this.logger.warn(
            'JwtAuthGuard: Authentication successful but no user object found in request',
          );
        }
      }

      return isAuthenticated;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `JwtAuthGuard: Authentication failed - ${errorMessage}`,
      );

      if (error instanceof Error) {
        if (error.message.includes('jwt expired')) {
          throw new UnauthorizedException(
            'Your session has expired. Please login again.',
          );
        }

        if (error.message.includes('invalid signature')) {
          throw new UnauthorizedException('Invalid authentication token.');
        }
      }

      throw new UnauthorizedException(
        'Authentication failed. Please check your credentials.',
      );
    }
  }
}
