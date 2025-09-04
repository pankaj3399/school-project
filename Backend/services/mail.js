import {sendEmail as sendEmailNode, sendEmailReport as sendEmailReportNode} from './nodemailer.js';
import { sendEmail as sendEmailSendGrid, sendEmailReport as sendEmailReportSendGrid } from './sendgrid.js';

const useSendGrid = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim() !== '';

export const sendEmail = useSendGrid ? sendEmailSendGrid : sendEmailNode;
export const sendEmailReport = useSendGrid ? sendEmailReportSendGrid : sendEmailReportNode;