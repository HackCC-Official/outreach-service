import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailsService } from '../emails/emails.service';
import { SendEmailDto } from '../emails/emails.dto';
import { SponsorInquiryDto } from './dto/sponsor-inquiry.dto';
import { SponsorInquiryResponseDto } from './dto/sponsor-response.dto';

@ApiTags('Sponsors')
@Controller('sponsors')
export class SponsorsController {
  constructor(private readonly emailsService: EmailsService) {}

  /**
   * Submit a sponsor inquiry
   * @param sponsorInquiryDto The sponsor inquiry data
   * @returns A confirmation response
   */
  @ApiOperation({
    summary: 'Submit a sponsor inquiry',
    description:
      'Submit an inquiry about sponsoring HackCC. This will send an email to the sponsorship team.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sponsor inquiry submitted successfully',
    type: SponsorInquiryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @Post('inquiry')
  async submitInquiry(
    @Body() sponsorInquiryDto: SponsorInquiryDto,
  ): Promise<SponsorInquiryResponseDto> {
    const { fullName, company, email, inquiry } = sponsorInquiryDto;

    const htmlContent = `
      <h2>New Sponsor Inquiry</h2>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <h3>Inquiry:</h3>
      <p>${inquiry}</p>
    `;

    const emailDto: SendEmailDto = {
      from: 'HackCC Sponsorship Portal <noreply@hackcc.net>',
      to: [{ email: 'sponsorship@hackcc.net' }],
      subject: `New Sponsor Inquiry from ${company}`,
      html: htmlContent,
    };

    const sentEmail = await this.emailsService.sendEmail(emailDto);

    const referenceId = `inq-${sentEmail.id.substring(0, 15)}`;

    return {
      success: true,
      message:
        "Your inquiry has been sent to our sponsorship team. We'll be in touch soon!",
      timestamp: new Date().toISOString(),
      reference: referenceId,
    };
  }
}
