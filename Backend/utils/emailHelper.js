import { FormType } from "../enum.js";
import { sendEmail, sendEmailReport } from "../services/nodemailer.js";
import { generateCouponImage, generateRecieptImage } from "./generateImage.js";

export const emailGenerator = async (form, {
    points,
    submission,
    teacher,
    student,
    schoolAdmin,
    school
}) => {
    let subject, body, attachment, attachmentName;

    if(!student && !teacher && !schoolAdmin){
        return {subject, body, attachment, attachmentName}
    }

    switch(form.formType){
        case FormType.AwardPoints: {
            subject = `GOOD NEWS, YOU EARNED ${points} E-TOKENS!`
            body = `
            <p>Congratulations <strong>${student.name}</strong>!</p>
            <p>The <strong>${teacher?.subject || "N/A"}</strong> teacher, <strong>${teacher.name}</strong>, has just awarded you with <strong>${points} E-Tokens</strong> for achieving your goals today.</p>
            <p>Please, check your E-Token's balance and exchange them at the AN Center or school store.</p>
            <p>Keep up the good work!!!</p>
            <p>
              ${schoolAdmin.name}<br>
              ${schoolAdmin.email}<br>
              Affective Needs Special Education Teacher<br>
              ${school.name}
            </p>
            `;
            attachment = await generateCouponImage(
                    points,
                    student.name,
                    teacher.name,
                    teacher?.subject || "N/A",
                    new Date().toDateString(),
                    school.logo,
                    school.name,
                    teacher.email,
                    student.parentEmail
                  );
             attachmentName='coupon.png'

            break;
        }
        case FormType.Feedback: {
            const teacherNames = teacher.name.split(" ");
            const teacherFirstName = teacherNames[0];
            const teacherLastName = teacherNames[teacherNames.length - 1];
            
            subject = `Hi, I have a feedback about ${student.name} from ${teacher.subject} class.`;
            
            const feedback = submission.answers.map((item) => `<p>${item.answer}</p>`).join(`<br/>`);
            
            body = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        /* Reset and base styles */
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        
                        /* Container styles */
                        .container {
                            font-family: Arial, sans-serif;
                            max-width: 800px;
                            margin: auto;
                            padding: 20px;
                            background-color: #ffffff;
                        }

                        /* Enhanced header styles */
                        .header {
                            position: relative;
                            margin-bottom: 40px;
                            padding: 20px 0;
                            display: flex;
                            justify-content: space-between;
                            width: 100%;
                            align-items: center;
                            border-bottom: 2px solid #eaeaea;
                        }

                        /* Logo styles */
                        .logo-left, .logo-right {
                            flex: 0 0 auto;
                            height: 100px;
                            width: auto;
                            max-width: 100px;
                            object-fit: contain;
                        }

                        /* Title styles */
                        .title {
                            flex: 1;
                            text-align: center;
                            font-size: 28px;
                            font-weight: bold;
                            color: #333333;
                            margin: 0 100px;
                            padding: 10px;
                            border-radius: 4px;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }

                        /* Responsive design */
                        @media (max-width: 600px) {
                            .header {
                                flex-direction: column;
                                gap: 15px;
                            }
                            .title {
                                font-size: 24px;
                                margin: 10px 0;
                            }
                            .logo-left, .logo-right {
                                height: 60px;
                            }
                        }

                        /* Rest of your existing styles */
                        .date-line { margin-bottom: 15px; }
                        .issued-by { margin-bottom: 20px; }
                        .feedback-content { margin: 30px 0; line-height: 1.6; }
                        .signature { margin-top: 40px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="https://vbf6zy27dq.ufs.sh/f/pcYMv9CYHjNs51BoBIgTOYRoHfL4zlTvXA8niZqxc1rsED3M" alt="Radu Logo" class="logo-left">
                            <h1 class="title">Feedback Note</h1>
                            <img src="${school.logo}" alt="School Logo" class="logo-right">
                        </div>

                        <div class="date-line">
                            <strong>Date:</strong> ${new Date().toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                            })}
                        </div>
                        
                        <div class="issued-by">
                            <strong>Issued By:</strong> ${teacherLastName} - ${teacher.subject}
                        </div>
                        
                        <div class="feedback-content">
                            ${feedback}
                        </div>
                        
                        <div class="signature">
                            ${teacherFirstName} ${teacherLastName}<br>
                            ${teacher.subject}<br>
                            ${school.name}<br>
                            ${school.district}
                        </div>
                    </div>
                </body>
                </html>
            `;
            break;
        }
        case FormType.DeductPoints: {
            subject = `Oopsie Points have been deducted.`
            body = `As a result of your infraction and our conversation, these are the points that have been subtracted from your balance.<br/> 
            <b>Oppsie Points deducted = ${points}<b/> <br/>
             <p>
              ${schoolAdmin.name}<br>
              ${schoolAdmin.email}<br>
              Affective Needs Special Education Teacher<br>
              ${school.name}
            </p>
            `;
            break;
        }
        case FormType.PointWithdraw: {
            subject = `${Math.abs(points)} points Withdrawn from student ${student.name}.`
            body = `${Math.abs(points)} points Withdrawn from student ${student.name}.`
            attachment = await generateRecieptImage(points,student.name,new Date().toLocaleDateString(),school.name,school.address,school.district)
            attachmentName='reciept.png'
            break;
        }
    }
    if (form.teacherEmail && teacher?.recieveMails)
        sendEmail(
         teacher.email,
         subject,
         body,
         body,
         attachment,
         attachmentName
       );
     if (form.studentEmail)
       sendEmail(
         student.email,
         subject,
         body,
         body,
         attachment,
         attachmentName
       );
     if (form.schoolAdminEmail)
       sendEmail(
         schoolAdmin.email,
         subject,
         body,
         body,
         attachment,
         attachmentName
       );
     if (
       form.parentEmail &&
       student.parentEmail &&
       student.sendNotifications
     )
       sendEmail(
         student.parentEmail,
         subject,
         body,
         body,
         attachment,
         attachmentName
       );
     if (
       form.parentEmail &&
       student.standard &&
       student.sendNotifications
     )
       sendEmail(
         student.standard,
         subject,
         body,
         body,
         attachment,
         attachmentName
       );
}

export const reportEmailGenerator = async (attachment, attachmentName, to, student) => {
  let subject, body;
  console.log(student);
  
  subject = `Radu Framework Report for ${attachmentName.replace('.pdf', '').replaceAll('_', ' ')}`
  body = `
  <p>Attached you will find the report for ${student.studentInfo.name}, ${student.studentInfo.grade} as of ${new Date().toLocaleDateString()}.</p>
  <p>Contact Info</p>
  <p>Parent/Guardian Email 1: ${student.studentInfo.parentEmail}</p>
  ${
    student.studentInfo.standard
      ? `<p>Parent/Guardian Email 2: ${student.studentInfo.standard}</p>`
      : ''
  }
  `
  sendEmailReport(
    to,
    subject,
    body,
    body,
    attachment,
    attachmentName
  )
}