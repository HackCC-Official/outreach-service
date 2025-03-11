import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, firstValueFrom } from 'rxjs';
import { Request } from 'express';

/**
 * Interface for the user object with proper types
 */
interface JwtUser {
  user_id: string;
  email: string;
  user_roles: string[];
  [key: string]: unknown;
}

/**
 * Extended Request interface with user property
 */
interface AuthenticatedRequest extends Request {
  user: JwtUser;
}

/**
 * Enhanced JWT Authentication Guard with error handling and logging
 * Extends Passport's AuthGuard for JWT strategy
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  /**
   * Handles the JWT authentication and provides detailed error logging
   * @param context The execution context
   * @returns A boolean or an Observable<boolean> indicating if the user is authenticated
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('JwtAuthGuard: Verifying authentication...');

    try {
      // Call the parent AuthGuard canActivate method
      const result = await super.canActivate(context);

      // Handle Observable return type from parent class if needed
      const isAuthenticated =
        result instanceof Observable ? await firstValueFrom(result) : result;

      // If authentication succeeded
      if (isAuthenticated) {
        const request = context
          .switchToHttp()
          .getRequest<AuthenticatedRequest>();
        this.logger.log(
          `JwtAuthGuard: Authentication successful for request to ${request.path}`,
        );

        // Log the user object to help with debugging
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
      // Log the specific error for debugging
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `JwtAuthGuard: Authentication failed - ${errorMessage}`,
      );

      // Check for common JWT issues
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

      // For any other errors, provide a generic message
      throw new UnauthorizedException(
        'Authentication failed. Please check your credentials.',
      );
    }
  }
}
