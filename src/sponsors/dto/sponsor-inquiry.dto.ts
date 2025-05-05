import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SponsorInquiryDto {
  @ApiProperty({
    description: 'Full name of the sponsor representative',
    example: 'Jane Smith',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Company name of the sponsor',
    example: 'Microsoft',
  })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({
    description: 'Email address of the sponsor representative',
    example: 'jane.smith@microsoft.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Inquiry details about sponsoring the event',
    example:
      "We're interested in sponsoring your upcoming hackathon. Please send us information about Gold tier sponsorship packages.",
  })
  @IsString()
  @IsNotEmpty()
  inquiry: string;
}
