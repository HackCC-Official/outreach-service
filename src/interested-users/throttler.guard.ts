import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class InterestedUsersThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(InterestedUsersThrottlerGuard.name);

  protected override getRequestResponse(context: ExecutionContext): {
    req: Request;
    res: Response;
  } {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const ip: string =
      (request.headers['x-forwarded-for'] as string) ||
      (request.socket?.remoteAddress as string) ||
      'unknown';

    this.logger.log(`Request from IP: ${ip} to ${request.path}`);

    return { req: request, res: response };
  }

  protected override getTracker(req: Request): Promise<string> {
    const ip: string =
      (req.headers['x-forwarded-for'] as string) ||
      (req.socket?.remoteAddress as string) ||
      'unknown';
    return Promise.resolve(ip);
  }
}
