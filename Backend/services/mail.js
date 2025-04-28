import {sendEmail as sendEmailNode, sendEmailReport as sendEmailReportNode} from './nodemailer.js';
import { sendEmail as sendEmailResend, sendEmailReport as sendEmaiReportResend } from './resend.js';

export {
    sendEmailResend as sendEmail,
    sendEmaiReportResend as sendEmailReport,
}