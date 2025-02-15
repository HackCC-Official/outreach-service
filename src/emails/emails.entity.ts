import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents an email record in the system
 */
export class Email {
  @ApiProperty({
    description: 'Unique identifier for the email',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Email sender address',
    example: 'sender@yourdomain.com',
  })
  from: string;

  @ApiProperty({
    description: 'Array of recipient email addresses',
    example: ['recipient1@example.com', 'recipient2@example.com'],
  })
  to: string[];

  @ApiProperty({
    description: 'Email subject line',
    example: 'Important Update',
  })
  subject: string;

  @ApiProperty({
    description: 'HTML content of the email',
    example: '<h1>Hello</h1><p>This is the email content.</p>',
  })
  html: string;

  @ApiProperty({
    description: 'Timestamp when the email was created',
    example: '2024-02-15T15:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the email was last updated',
    example: '2024-02-15T15:30:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Current status of the email',
    enum: ['delivered', 'failed', 'sending'],
    example: 'delivered',
  })
  status: 'delivered' | 'failed' | 'sending';
}
