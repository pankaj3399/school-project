import { FormType } from "../enum.js";
import { sendEmail, sendEmailReport } from "../services/mail.js";
import { generateCouponImage, generateRecieptImage } from "./generateImage.js";

export const emailGenerator = async (form, {
    points,
    submission,
    teacher,
    student,
    schoolAdmin,
    school,
    leadTeacher = null
}) => {
    let subject, body, attachment, attachmentName;

    if(!student && !teacher && !schoolAdmin){
        return {subject, body, attachment, attachmentName}
    }

    switch(form.formType){
        case FormType['AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)']: 
        case FormType.AwardPoints: {
            subject = `GOOD NEWS, YOU EARNED ${points} E-TOKENS!`
            body = `
            <p>Congratulations <strong>${student.name}</strong>!</p>
            <p>The ${teacher.subject ? `<strong>${teacher?.subject || "N/A"}</strong> teacher`:`<strong>The RADU E-token System</strong>`}, <strong>${teacher.name}</strong>, has just awarded you with <strong>${points} E-Tokens</strong> for achieving your goals today.</p>
            <p>Please, check your E-Token's balance and exchange them at the AN Center or school store.</p>
            <p>Keep up the good work!!!</p>
            <p>
              ${schoolAdmin.name}<br>
              ${schoolAdmin.email}<br>
              The RADU E-token System Manager<br>
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
            
            subject = `Hi, I have a feedback about ${student.name} from ${!teacher.subject ? `grade ${student.grade}.`: `${teacher.subject} class.`}`;
            
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
                            height: 200px;
                            width: auto;
                            max-width: 250px;
                            object-fit: contain;
                        }

                        /* Title styles */
                        .title {
                            flex: 1;
                            text-align: center;
                            font-size: 28px;
                            font-weight: bold;
                            color: #333333;
                            margin: 0 20px;
                            padding: 10px;
                            border-radius: 4px;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }

                        /* Responsive design */
                        @media (max-width: 768px) {
                            .header {
                                flex-direction: column;
                                gap: 15px;
                            }
                            .title {
                                font-size: 24px;
                                margin: 10px 0;
                            }
                            .logo-left, .logo-right {
                                height: 150px;
                                max-width: 150px;
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
                            <img src="${process.env.LOGO_URL || "https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png"}" alt="RADU Logo" class="logo-left">
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
                            <strong>Issued By:</strong> ${teacherLastName} - ${teacher.subject ?? 'The RADU E-token System Manager'}
                        </div>
                        
                        <div class="feedback-content">
                            ${feedback}
                        </div>
                        
                        <div class="signature">
                            ${teacherFirstName} ${teacherLastName}<br>
                            ${teacher.subject ?? 'The RADU E-token System Manager'}<br>
                            ${school.name}<br>
                            ${school.district}
                        </div>
                    </div>
                </body>
                </html>
            `;
            if (leadTeacher){
              sendEmail(
                leadTeacher.email,
                subject,
                body,
                body,
                attachment,
                attachmentName
              );
              return;
            }
            break;
        }
        case FormType.DeductPoints: {
            const teacherNames = teacher.name.split(" ");
            const teacherFirstName = teacherNames[0];
            const teacherLastName = teacherNames[teacherNames.length - 1];
            
            subject = `Oopsie Points have been deducted from balance of ${student.name}, grade ${student.grade}.`
            
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
                            height: 200px;
                            width: auto;
                            max-width: 250px;
                            object-fit: contain;
                        }

                        /* Title styles */
                        .title {
                            flex: 1;
                            text-align: center;
                            font-size: 28px;
                            font-weight: bold;
                            color: #333333;
                            margin: 0 20px;
                            padding: 10px;
                            border-radius: 4px;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }

                        /* Responsive design */
                        @media (max-width: 768px) {
                            .header {
                                flex-direction: column;
                                gap: 15px;
                            }
                            .title {
                                font-size: 24px;
                                margin: 10px 0;
                            }
                            .logo-left, .logo-right {
                                height: 150px;
                                max-width: 150px;
                            }
                        }

                        /* Rest of your existing styles */
                        .date-line { margin-bottom: 15px; }
                        .issued-by { margin-bottom: 20px; }
                        .message-content { margin: 30px 0; line-height: 1.6; }
                        .signature { margin-top: 40px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="${process.env.LOGO_URL || "https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png"}" alt="RADU Logo" class="logo-left">
                            <h1 class="title">Oopsie Points</h1>
                            <img src="${school.logo}" alt="School Logo" class="logo-right">
                        </div>

                        <div class="date-line">
                            <strong>Date:</strong> ${new Date().toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                            })}
                        </div>
                        
                        <div class="message-content">
                            <p>Hello ${student.name}:</p>
                            <br/>
                            <p>As a result of your infraction and our conversation, these are the points that have been subtracted from your balance.</p>
                            <br/>
                            <p><strong>Oopsie Points deducted = ${Math.abs(points)} Points</strong>, now your balance is = <strong>${student.points} Points</strong>.</p>
                        </div>
                        
                        <div class="signature">
                            ${teacher.name}<br/>
                            ${teacher.type === "Lead" ? "LEADER/ LEAD TEACHER" : (teacher.subject || "The RADU E-token System Manager")}<br/>
                            ${teacher.grade}<br/>
                            ${school.name}
                        </div>
                    </div>
                </body>
                </html>
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

    
    
    if ((form.teacherEmail || form.formType == FormType.DeductPoints || form.formType == FormType.PointWithdraw ) && teacher?.recieveMails && teacher.isEmailVerified)
        sendEmail(
         teacher.email,
         subject,
         body,
         body,
         attachment,
         attachmentName
       );
     if ((form.studentEmail || form.type == FormType.DeductPoints || form.formType == FormType.PointWithdraw ) && form.type != FormType.Feedback)
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
       student.sendNotifications &&
       student.isParentOneEmailVerified
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
       student.sendNotifications &&
       student.isParentTwoEmailVerified
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

export const reportEmailGenerator = async (attachment, attachmentName, to, data) => {
  try {
    let subject, body;
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    subject = `RADU E-Token Report for ${attachmentName.replace('.pdf', '').replaceAll('_', ' ')}`
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
                            height: 200px;
                            width: auto;
                            max-width: 250px;
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

              /* Content styles */
              .report-content { margin: 30px 0; line-height: 1.6; }
              .contact-info { margin-top: 20px; }

              /* Footer styles */
              .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #eaeaea;
                  text-align: center;
                  color: #666;
                  font-size: 14px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                            <img src="${process.env.LOGO_URL || "https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png"}" alt="RADU Logo" class="logo-left">
                            <h1 class="title">E-Token Report</h1>
                            <img src="${data.schData.school.logo}" alt="School Logo" class="logo-right">
                        </div>

              <div class="report-content">
                <p>Attached you will find the report for ${data.stdData.studentInfo.name}, Grade ${data.stdData.studentInfo.grade} as of ${new Date().toLocaleDateString()}.</p>
                <div class="contact-info">
                  <p>Contact Info</p>
                  <p>Parent/Guardian Email 1: ${data.stdData.studentInfo.parentEmail}</p>
                  ${
                    data.stdData.studentInfo.standard
                      ? `<p>Parent/Guardian Email 2: ${data.stdData.studentInfo.standard}</p>`
                      : ''
                  }
                </div>
              </div>

              <div class="footer">
                  Created by The RADU E-Token © 2025 on ${currentDate}.
              </div>
          </div>
      </body>
      </html>
    `
    sendEmailReport(
      to,
      subject,
      body,
      body,
      attachment,
      attachmentName
    )
  } catch(err) {
    console.error(err)
  }
}