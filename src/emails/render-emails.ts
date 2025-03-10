import { renderAsync } from '@react-email/render';
import { ThankYouEmail } from './templates/thank-you-email.template';

/**
 * Props for rendering the thank you email
 */
interface RenderThankYouEmailProps {
  /**
   * The email address of the recipient
   */
  recipientEmail: string;

  /**
   * Optional custom message to include in the email
   */
  customMessage?: string;
}

/**
 * Renders the thank you email template to HTML
 *
 * @param props - The properties for the email template
 * @returns A promise that resolves to the HTML string
 */
export const renderThankYouEmail = async (
  props: RenderThankYouEmailProps,
): Promise<string> => {
  return await renderAsync(ThankYouEmail(props));
};
