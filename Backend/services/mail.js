import {sendEmail as sendEmailNode, sendEmailReport as sendEmailReportNode} from './nodemailer.js';
import { sendEmail as sendEmailResend, sendEmailReport as sendEmailReportResend } from './resend.js';

export {
    sendEmailNode as sendEmail,
    sendEmailReportNode as sendEmailReport,
}