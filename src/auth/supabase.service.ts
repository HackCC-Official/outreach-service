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
    // Determine current environment
    this.currentEnvironment =
      this.configService.get<string>('NODE_ENV') === 'production'
        ? SupabaseEnvironment.PRODUCTION
        : SupabaseEnvironment.DEVELOPMENT;

    // Get configuration values with fallbacks
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

    // Initialize production client
    this.prodSupabase = createClient(prodSupabaseUrl, prodServiceRole);

    // Initialize development client
    this.devSupabase = createClient(devSupabaseUrl, devServiceRole);

    this.logger.log(
      `Initialized Supabase clients. Current environment: ${this.currentEnvironment}`,
    );
  }

  /**
   * Gets a configuration value with a fallback
   * @param primaryKey - The primary configuration key to check
   * @param fallbackKey - The fallback configuration key if primary is not found
   * @returns The configuration value as a string
   * @throws Error if neither the primary nor fallback configuration values exist
   */
  private getConfigValue(primaryKey: string, fallbackKey: string): string {
    const primaryValue = this.configService.get<string>(primaryKey);
    if (primaryValue) {
      return primaryValue;
    }

    const fallbackValue = this.configService.get<string>(fallbackKey);
    if (fallbackValue) {
      return fallbackValue;
    }

    throw new Error(
      `Missing required configuration: ${primaryKey} or ${fallbackKey}`,
    );
  }

  /**
   * Returns the Supabase client for the current environment
   */
  getClient(): SupabaseClient {
    return this.currentEnvironment === SupabaseEnvironment.PRODUCTION
      ? this.prodSupabase
      : this.devSupabase;
  }

  /**
   * Returns the Supabase client for the specified environment
   * @param environment - The environment to get the client for
   */
  getClientForEnvironment(environment: SupabaseEnvironment): SupabaseClient {
    return environment === SupabaseEnvironment.PRODUCTION
      ? this.prodSupabase
      : this.devSupabase;
  }

  /**
   * Returns the current Supabase environment
   */
  getCurrentEnvironment(): SupabaseEnvironment {
    return this.currentEnvironment;
  }
}
