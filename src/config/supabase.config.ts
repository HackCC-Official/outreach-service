import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { Logger } from '@nestjs/common';

config();

// Create a logger for debugging
const logger = new Logger('SupabaseConfig');

// Determine the current environment
const nodeEnv = process.env.NODE_ENV;
logger.log(`Current NODE_ENV: ${nodeEnv}`);

// Select the appropriate URL and key based on environment
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

// Log the selected URL (without credentials)
logger.log(`Supabase URL: ${supabaseUrl}`);

// Validate that we have the required credentials
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
