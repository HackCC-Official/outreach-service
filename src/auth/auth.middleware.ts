import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseStrategy } from './supabase.strategy';

interface JwtHeader {
  alg: string;
  typ: string;
  [key: string]: string;
}

interface JwtPayload {
  [key: string]: unknown;
}

// Define the enhanced payload structure that matches what SupabaseStrategy.validate() returns
interface EnhancedUserPayload {
  user_id: string | null;
  email: string | null;
  user_roles: string[];
  [key: string]: unknown;
}

// Extend Express Request interface to include user property
interface RequestWithUser extends Request {
  user: EnhancedUserPayload;
}

@Injectable()
export class AuthLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthLoggerMiddleware.name);

  constructor(private readonly supabaseStrategy: SupabaseStrategy) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log('===== INCOMING REQUEST =====');
    this.logger.log(`Path: ${req.path}`);
    this.logger.log(`Method: ${req.method}`);

    // Log authorization header if present
    if (req.headers.authorization) {
      this.logger.log(
        `Authorization Header Present: ${req.headers.authorization.substring(0, 15)}...`,
      );

      // Try to parse the token if it's Bearer format
      const parts = req.headers.authorization.split(' ');
      this.logger.log(`Auth header parts count: ${parts.length}`);
      this.logger.log(`Auth header prefix: "${parts[0]}"`);

      // Check if token is properly formatted with Bearer prefix
      if (parts.length === 2) {
        if (parts[0] === 'Bearer') {
          try {
            // Log parts of the token without displaying the full token
            const token = parts[1];
            const tokenPreview =
              token.length > 10
                ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}`
                : 'Invalid token format';

            this.logger.log(`Token format: ${tokenPreview}`);

            // Also log if the token has any spaces or extra characters
            if (token.includes(' ')) {
              this.logger.warn(
                'WARNING: Token contains spaces which may cause validation issues',
              );
            }

            // Try to decode header to see if it's a valid JWT
            const tokenParts = token.split('.');
            this.logger.log(`JWT parts count: ${tokenParts.length}`);

            if (tokenParts.length === 3) {
              try {
                const headerText = Buffer.from(
                  tokenParts[0],
                  'base64',
                ).toString();
                const header = JSON.parse(headerText) as JwtHeader;
                this.logger.log(
                  `JWT Header: ${JSON.stringify(header, null, 2)}`,
                );

                // Decode the payload
                try {
                  const payloadText = Buffer.from(
                    tokenParts[1],
                    'base64',
                  ).toString();
                  const payload = JSON.parse(payloadText) as JwtPayload;
                  this.logger.log(
                    `JWT Payload (Decoded): ${JSON.stringify(payload, null, 2)}`,
                  );

                  // Call the validate method from SupabaseStrategy
                  this.logger.log('Calling SupabaseStrategy.validate()');
                  this.supabaseStrategy
                    .validate(payload)
                    .then((enhancedPayload: EnhancedUserPayload) => {
                      this.logger.log(
                        'SupabaseStrategy.validate() completed successfully',
                      );
                      // You can attach the enhancedPayload to the request object if needed
                      (req as RequestWithUser).user = enhancedPayload;
                    })
                    .catch((error) => {
                      this.logger.error(
                        `Error in SupabaseStrategy.validate(): ${
                          error instanceof Error
                            ? error.message
                            : 'Unknown error'
                        }`,
                      );
                    })
                    .finally(() => {
                      // Always call next() to continue the request pipeline
                      next();
                    });

                  // Return early since we're handling next() in the Promise chain
                  return;
                } catch (error) {
                  this.logger.error(
                    `Could not decode JWT payload: ${
                      error instanceof Error ? error.message : 'Unknown error'
                    }`,
                  );
                }
              } catch (error) {
                this.logger.error(
                  `Could not decode JWT header: ${
                    error instanceof Error ? error.message : 'Unknown error'
                  }`,
                );
              }
            } else {
              this.logger.warn(
                `Invalid JWT format: expected 3 parts, got ${tokenParts.length}`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Error parsing authorization header: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            );
          }
        } else {
          this.logger.warn(
            `Invalid auth scheme: expected "Bearer", got "${parts[0]}"`,
          );
        }
      } else {
        this.logger.warn(
          `Malformed authorization header: expected 2 parts, got ${parts.length}`,
        );
      }
    } else {
      this.logger.log('No Authorization Header');
    }

    this.logger.log(`Time: ${new Date().toISOString()}`);
    this.logger.log('===========================');

    // Don't call next() if we returned early after calling validate()
    next();
  }
}
