/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    const handlerName = context.getHandler().name;
    const className = context.getClass().name;

    this.logger.log(`===== RolesGuard Check =====`);
    this.logger.log(`Route: ${className}.${handlerName}`);

    // If no roles are required, allow access
    if (!roles || !roles.length) {
      this.logger.log(`No roles required for this route - Access GRANTED`);
      return true;
    }

    this.logger.log(`Required Roles: ${JSON.stringify(roles)}`);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.error(`No user object found in request - Access DENIED`);
      return false;
    }

    this.logger.log(`User from request: ${JSON.stringify(user)}`);

    if (!user.user_roles || !Array.isArray(user.user_roles)) {
      this.logger.error(
        `User has no roles or roles is not an array - Access DENIED`,
      );
      this.logger.error(`User roles: ${JSON.stringify(user.user_roles)}`);
      return false;
    }

    // Check for role match
    const hasRole = user.user_roles.some((userRole: string) =>
      roles.some(
        (requiredRole: string) => String(requiredRole) === String(userRole),
      ),
    );

    if (hasRole) {
      this.logger.log(`User has required role - Access GRANTED`);
    } else {
      this.logger.error(`User lacks required role - Access DENIED`);
      this.logger.error(`User roles: ${JSON.stringify(user.user_roles)}`);
      this.logger.error(`Required roles: ${JSON.stringify(roles)}`);
    }

    return hasRole;
  }
}
