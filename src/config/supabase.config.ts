import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { Logger } from '@nestjs/common';

config();

const logger = new Logger('SupabaseConfig');

const nodeEnv = process.env.NODE_ENV;
logger.log(`Current NODE_ENV: ${nodeEnv}`);

let supabaseUrl: string;
let supabaseKey: string;

if (nodeEnv === 'production') {
  supabaseUrl = process.env.PROD_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  supabaseKey = process.env.PROD_SERVICE_ROLE ?? process.env.SERVICE_ROLE ?? '';
  logger.log('Using production Supabase configuration');
} else {
  supabaseUrl = process.env.DEV_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  supabaseKey = process.env.DEV_SERVICE_ROLE ?? process.env.SERVICE_ROLE ?? '';
  logger.log('Using development Supabase configuration');
}

logger.log(`Supabase URL: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
