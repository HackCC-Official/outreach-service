/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

interface AccountRow {
  id: string;
  email: string;
  roles: string[]; // PostgreSQL text[] array type
  createdAt: string;
  deletedAt: string | null;
  teamId: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(SupabaseStrategy.name);

  public constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('NODE_ENV') === 'development'
          ? configService.get<string>('DEV_JWT_SECRET')
          : configService.get<string>('PROD_JWT_SECRET'),
    });

    this.logger.log('===== SupabaseStrategy initialized =====');
    this.logger.log('Environment:', configService.get('NODE_ENV'));
    this.logger.log(
      'Using JWT Secret from:',
      configService.get('NODE_ENV') === 'development'
        ? 'DEV_JWT_SECRET'
        : 'PROD_JWT_SECRET',
    );
    this.logger.log('=======================================');
  }

  async validate(payload: any): Promise<any> {
    this.logger.log('===== SupabaseStrategy.validate called =====');
    this.logger.log('JWT Payload:', JSON.stringify(payload, null, 2));
    this.logger.log('Auth Time:', new Date().toISOString());

    // Extract user ID and email from payload
    const userId = payload.sub || payload.user_id || null;
    const email = payload.email || null;

    this.logger.log('User ID from token:', userId || 'Not found');
    this.logger.log('Email from token:', email || 'Not found');

    // Default roles
    let userRoles: string[] = [];

    try {
      if (userId) {
        // Get the Supabase client
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
          .from('account')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          this.logger.error('Error fetching account:', error.message);
        } else if (data) {
          const account = data as AccountRow;
          this.logger.log('Found account:', JSON.stringify(account, null, 2));

          // Use the roles array directly - no parsing needed
          if (Array.isArray(account.roles)) {
            userRoles = account.roles;
            this.logger.log(
              'Roles from account:',
              JSON.stringify(userRoles, null, 2),
            );
          } else {
            this.logger.warn(
              'Account roles is not an array:',
              typeof account.roles,
            );
          }
        } else {
          this.logger.warn('No account found for userId:', userId);
        }
      } else {
        this.logger.warn('No userId in token to look up account');
      }
    } catch (error) {
      this.logger.error(
        'Error during account lookup:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    this.logger.log('Final User Roles:', JSON.stringify(userRoles, null, 2));

    // Enhance the payload with user_roles for the RolesGuard
    const enhancedPayload = {
      ...payload,
      user_id: userId,
      email: email,
      user_roles: userRoles,
    };

    this.logger.log(
      'Enhanced Payload:',
      JSON.stringify(enhancedPayload, null, 2),
    );
    this.logger.log('=========================================');

    return enhancedPayload;
  }
}
