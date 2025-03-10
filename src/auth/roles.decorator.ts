import { Reflector } from '@nestjs/core';
import { AccountRoles } from './role.enum';

export const Roles = Reflector.createDecorator<AccountRoles[]>();
