import { renderAsync } from '@react-email/render';
import { ThankYouEmail } from './templates/thank-you-email.template';

interface RenderThankYouEmailProps {
  recipientEmail: string;
  customMessage?: string;
}

export const renderThankYouEmail = async (
  props: RenderThankYouEmailProps,
): Promise<string> => {
  return await renderAsync(ThankYouEmail(props));
};
