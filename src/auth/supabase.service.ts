import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export enum SupabaseEnvironment {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
}

@Injectable()
export class SupabaseService {
  private prodSupabase: SupabaseClient;
  private devSupabase: SupabaseClient;
  private currentEnvironment: SupabaseEnvironment;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    this.logger.debug(`Current NODE_ENV value: "${nodeEnv}"`);

    this.currentEnvironment =
      nodeEnv === 'production'
        ? SupabaseEnvironment.PRODUCTION
        : SupabaseEnvironment.DEVELOPMENT;

    const prodSupabaseUrl = this.getConfigValue(
      'PROD_SUPABASE_URL',
      'SUPABASE_URL',
    );
    const prodServiceRole = this.getConfigValue(
      'PROD_SERVICE_ROLE',
      'SERVICE_ROLE',
    );
    const devSupabaseUrl = this.getConfigValue(
      'DEV_SUPABASE_URL',
      'SUPABASE_URL',
    );
    const devServiceRole = this.getConfigValue(
      'DEV_SERVICE_ROLE',
      'SERVICE_ROLE',
    );

    this.logger.debug(`Using DEV Supabase URL: ${devSupabaseUrl}`);
    this.logger.debug(`Using PROD Supabase URL: ${prodSupabaseUrl}`);

    // Initialize production client
    this.prodSupabase = createClient(prodSupabaseUrl, prodServiceRole);

    // Initialize development client
    this.devSupabase = createClient(devSupabaseUrl, devServiceRole);

    this.logger.log(
      `Initialized Supabase clients. Current environment: ${this.currentEnvironment}`,
    );
  }

  private getConfigValue(primaryKey: string, fallbackKey: string): string {
    const primaryValue = this.configService.get<string>(primaryKey);
    this.logger.debug(
      `Config key ${primaryKey}: ${primaryValue ? 'Found' : 'Not found'}`,
    );

    if (primaryValue) {
      return primaryValue;
    }

    const fallbackValue = this.configService.get<string>(fallbackKey);
    this.logger.debug(
      `Fallback config key ${fallbackKey}: ${fallbackValue ? 'Found' : 'Not found'}`,
    );

    if (fallbackValue) {
      return fallbackValue;
    }

    throw new Error(
      `Missing required configuration: ${primaryKey} or ${fallbackKey}`,
    );
  }

  getClient(): SupabaseClient {
    const client =
      this.currentEnvironment === SupabaseEnvironment.PRODUCTION
        ? this.prodSupabase
        : this.devSupabase;

    this.logger.debug(
      `getClient() returning client for environment: ${this.currentEnvironment}`,
    );
    return client;
  }

  getClientForEnvironment(environment: SupabaseEnvironment): SupabaseClient {
    this.logger.debug(`getClientForEnvironment(${environment}) called`);
    return environment === SupabaseEnvironment.PRODUCTION
      ? this.prodSupabase
      : this.devSupabase;
  }

  getCurrentEnvironment(): SupabaseEnvironment {
    return this.currentEnvironment;
  }
}
