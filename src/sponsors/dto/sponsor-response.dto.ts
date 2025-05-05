import { ApiProperty } from '@nestjs/swagger';

export class SponsorInquiryResponseDto {
  @ApiProperty({
    description: 'Whether the inquiry was sent successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Confirmation message',
    example:
      "Your inquiry has been sent to our sponsorship team. We'll be in touch soon!",
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp of when the inquiry was received',
    example: '2024-06-10T15:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Reference ID for this inquiry submission',
    example: 'inq-123e4567-e89b',
  })
  reference: string;
}
