import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt.auth.guard';
import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseService } from './supabase.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    // Ensure ConfigModule is properly configured to load environment variables
    ConfigModule.forRoot(),

    // PassportModule for authentication strategies
    PassportModule,

    // JwtModule configured asynchronously using ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      useFactory: (configService: ConfigService) => ({
        global: true, // Make JWT module global
        secret:
          configService.get('NODE_ENV') === 'development'
            ? configService.get('DEV_JWT_SECRET')
            : configService.get('PROD_JWT_SECRET'),
        signOptions: { expiresIn: '40000s' }, // Token expiration time
      }),
      inject: [ConfigService], // Inject ConfigService
    }),
  ],
  providers: [
    JwtAuthGuard, // Custom JWT guard
    SupabaseStrategy, // Custom Supabase Passport strategy
    SupabaseService, // Service for Supabase interactions
    RolesGuard, // Custom roles guard for RBAC
  ],
  exports: [
    JwtAuthGuard, // Export JwtAuthGuard for use in other modules
    JwtModule, // Export JwtModule for use in other modules
    SupabaseService, // Export SupabaseService for use in other modules
    SupabaseStrategy, // Export SupabaseStrategy so it can be injected into middleware
    RolesGuard, // Export RolesGuard for use in other modules
  ],
})
export class AuthModule {}
