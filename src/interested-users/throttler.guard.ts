import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Custom throttler guard that logs IP addresses and applies rate limiting
 * to protect against spam for public endpoints
 */
@Injectable()
export class InterestedUsersThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(InterestedUsersThrottlerGuard.name);

  /**
   * Gets the request object from the execution context
   */
  protected override getRequestResponse(context: ExecutionContext): {
    req: Request;
    res: Response;
  } {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Log IP address for monitoring
    const ip: string =
      (request.headers['x-forwarded-for'] as string) ||
      (request.socket?.remoteAddress as string) ||
      'unknown';

    this.logger.log(`Request from IP: ${ip} to ${request.path}`);

    return { req: request, res: response };
  }

  /**
   * Extract the identifier from the request for tracking rate limits
   * Using IP address to track limits per IP
   */
  protected override getTracker(req: Request): Promise<string> {
    const ip: string =
      (req.headers['x-forwarded-for'] as string) ||
      (req.socket?.remoteAddress as string) ||
      'unknown';
    return Promise.resolve(ip);
  }
}
