import { sendEmail as sendEmailNode, sendEmailReport as sendEmailReportNode } from './nodemailer.js';
import { sendEmail as sendEmailSendGrid, sendEmailReport as sendEmailReportSendGrid } from './sendgrid.js';
import EmailLog from '../models/EmailLog.js';

const useSendGrid = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim() !== '';
const provider = useSendGrid ? 'sendgrid' : 'nodemailer';

const senderAddress = () => {
  const value = useSendGrid ? process.env.FROM_EMAIL : process.env.EMAIL_USER;
  return typeof value === 'string' ? value.trim() : '';
};

const recordEmail = async (entry) => {
  try {
    await EmailLog.create(entry);
  } catch (error) {
    console.error('Failed to write email log:', error.message);
  }
};

const trace = (send) => async (...args) => {
  const [to, subject, , , attachment, , replyTo] = args;
  const started = Date.now();
  const base = {
    direction: 'outbound',
    to: typeof to === 'string' ? to : '',
    from: senderAddress(),
    replyTo: typeof replyTo === 'string' ? replyTo : '',
    subject: typeof subject === 'string' ? subject : '',
    provider,
    hasAttachment: Boolean(attachment),
  };

  try {
    const result = await send(...args);
    await recordEmail({
      ...base,
      status: 'sent',
      durationMs: Date.now() - started,
    });
    return result;
  } catch (error) {
    await recordEmail({
      ...base,
      status: 'failed',
      error: String(error?.message || error).slice(0, 2000),
      durationMs: Date.now() - started,
    });
    throw error;
  }
};

export const sendEmail = trace(useSendGrid ? sendEmailSendGrid : sendEmailNode);
export const sendEmailReport = trace(useSendGrid ? sendEmailReportSendGrid : sendEmailReportNode);
