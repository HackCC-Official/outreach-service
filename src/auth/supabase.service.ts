import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      configService.get<string>('AUTH_SUPABASE_URL')!,
      configService.get<string>('AUTH_SUPABASE_ANON_KEY')!,
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
