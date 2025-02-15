/**
 * Represents an email record in the system
 */
export class Email {
  /**
   * Unique identifier for the email
   */
  id: string;

  /**
   * Email sender address
   */
  from: string;

  /**
   * Array of recipient email addresses
   */
  to: string[];

  /**
   * Email subject line
   */
  subject: string;

  /**
   * HTML content of the email
   */
  html: string;

  /**
   * Timestamp when the email was created
   */
  createdAt: Date;

  /**
   * Timestamp when the email was last updated
   */
  updatedAt: Date;

  /**
   * Current status of the email
   */
  status: 'delivered' | 'failed' | 'sending';
}
