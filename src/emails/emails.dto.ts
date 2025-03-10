import {
  IsString,
  IsEmail,
  IsArray,
  IsOptional,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailAttachment {
  @ApiProperty({
    description: 'Path to the attachment file',
    example: '/path/to/file.pdf',
  })
  @IsString()
  path: string;

  @ApiProperty({
    description: 'Name of the attachment file',
    example: 'document.pdf',
  })
  @IsString()
  filename: string;
}

export class EmailRecipient {
  @ApiProperty({
    description: 'Email address of the recipient',
    example: 'recipient@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Name of the recipient',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  name?: string;
}

export class SendEmailDto {
  @ApiProperty({
    description: 'Email address of the sender',
    example: 'sender@yourdomain.com',
  })
  @IsEmail()
  from: string;

  @ApiProperty({
    description: 'List of recipients',
    type: [EmailRecipient],
  })
  @ValidateNested({ each: true })
  @Type(() => EmailRecipient)
  to: EmailRecipient[];

  @ApiProperty({
    description: 'Email subject line',
    example: 'Important Update',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'HTML content of the email',
    example: '<h1>Hello</h1><p>This is the email content.</p>',
  })
  @IsString()
  html: string;

  @ApiPropertyOptional({
    description: 'List of file attachments',
    type: [EmailAttachment],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachment)
  attachments?: EmailAttachment[];
}

export class SendBatchEmailsDto {
  @ApiProperty({
    description: 'Array of emails to send in a single batch operation',
    type: [SendEmailDto],
    example: [
      {
        from: 'Company <notifications@example.com>',
        to: [{ email: 'recipient1@example.com', name: 'John Doe' }],
        subject: 'First Email Subject',
        html: '<h1>Hello John</h1><p>This is the first email content.</p>',
      },
      {
        from: 'Company <notifications@example.com>',
        to: [{ email: 'recipient2@example.com', name: 'Jane Smith' }],
        subject: 'Second Email Subject',
        html: '<h1>Hello Jane</h1><p>This is the second email content.</p>',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendEmailDto)
  emails: SendEmailDto[];
}

export class UpdateEmailDto {
  @ApiProperty({
    description: 'Unique identifier of the email to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({
    description: 'New subject line for the email',
    example: 'Updated: Important Information',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'New HTML content for the email',
    example: '<h1>Updated Content</h1><p>This is the new email content.</p>',
  })
  @IsOptional()
  @IsString()
  html?: string;
}
