import {sendEmail as sendEmailNode, sendEmailReport as sendEmailReportNode} from './nodemailer.js';
import { sendEmail as sendEmailSendGrid, sendEmailReport as sendEmailReportSendGrid } from './sendgrid.js';

export {
    sendEmailSendGrid as sendEmail,
    sendEmailReportSendGrid as sendEmailReport,
}