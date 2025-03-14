import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';
import { AccountRoles } from './role.enum';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    user_id: string;
    email: string;
    user_roles: string[];
    [key: string]: unknown;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());
    const handlerName = context.getHandler().name;
    const className = context.getClass().name;

    this.logger.log(`===== RolesGuard Check =====`);
    this.logger.log(`Route: ${className}.${handlerName}`);

    if (!requiredRoles || !requiredRoles.length) {
      this.logger.log(`No roles required for this route - Access GRANTED`);
      return true;
    }

    this.logger.log(`Required roles: ${requiredRoles.join(', ')}`);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!user || !user.user_roles || !Array.isArray(user.user_roles)) {
      this.logger.error(
        `No user or user_roles found in request - Access DENIED`,
      );
      this.logger.error(`User object: ${JSON.stringify(user, null, 2)}`);
      throw new ForbiddenException(
        'User authentication or role information missing',
      );
    }

    this.logger.log(`User ID: ${user.user_id}`);
    this.logger.log(`User roles: ${user.user_roles.join(', ')}`);

    if (user.user_roles.includes(AccountRoles.ADMIN)) {
      this.logger.log(`User has ADMIN role - Access GRANTED`);
      return true;
    }

    const hasRequiredRole = requiredRoles.some((role) =>
      user.user_roles.includes(role),
    );

    if (hasRequiredRole) {
      this.logger.log(`User has required role - Access GRANTED`);
      return true;
    } else {
      this.logger.error(`User lacks required roles - Access DENIED`);
      this.logger.error(`User roles: ${JSON.stringify(user.user_roles)}`);
      this.logger.error(`Required roles: ${JSON.stringify(requiredRoles)}`);
      throw new ForbiddenException(
        'Insufficient permissions to access this resource',
      );
    }
  }
}
