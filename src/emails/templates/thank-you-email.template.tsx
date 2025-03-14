import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface ThankYouEmailProps {
  recipientEmail: string;
  customMessage?: string;
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const header = {
  padding: '0 24px',
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '0 24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#333',
};

const subjectLine = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginTop: '16px',
  marginBottom: '16px',
  color: '#111',
};

const footer = {
  padding: '0 24px',
  marginTop: '32px',
  textAlign: 'center' as const,
  fontSize: '14px',
  color: '#666',
};

const unsubscribeLink = {
  color: '#666',
  textDecoration: 'underline',
};

export const ThankYouEmail = ({
  recipientEmail,
  customMessage,
}: ThankYouEmailProps): React.ReactElement => {
  return (
    <Html>
      <Head />
      <Preview>Thank you for your interest in HackCC!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={`https://minio.hackcc.net/public-bucket/logo.svg`}
              width={120}
              height={45}
              alt="HackCC Logo"
              style={logo}
            />
          </Section>

          <Section style={content}>
            {/* Email Subject */}
            <Heading style={subjectLine}>
              Thank you for your interest in HackCC!
            </Heading>

            {/* Email Body */}
            <>
              <Text style={paragraph}>Hello there,</Text>

              <Text style={paragraph}>
                Thank you for signing up to receive updates about upcoming
                HackCC events! We&apos;re thrilled to have you join our
                community of hackers and innovators.
              </Text>

              <Text style={paragraph}>
                {customMessage ||
                  `You'll be among the first to hear about registration openings, 
                                exciting workshops, and all the details for our next hackathon. 
                                We have some amazing things planned and can't wait to share them with you!`}
              </Text>

              <Text style={paragraph}>
                If you have any questions in the meantime, don&apos;t hesitate
                to reach out to us.
              </Text>

              <Text style={paragraph}>See you soon!</Text>

              <Text style={paragraph}>Best regards,</Text>

              <Text style={paragraph}>The HackCC Team</Text>
            </>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text>
              © {new Date().getFullYear()} HackCC. All rights reserved.
            </Text>
            <Text>
              You received this email because you signed up for updates about
              HackCC events with the email address: {recipientEmail}
            </Text>
            <Text>
              <a
                href={`https://hackcc.net/mailing/unsubscribe?email=${encodeURIComponent(recipientEmail)}`}
                style={unsubscribeLink}
              >
                Unsubscribe from emails
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ThankYouEmail;
