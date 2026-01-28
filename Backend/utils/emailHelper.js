import { FormType } from "../enum.js";
import { sendEmail, sendEmailReport } from "../services/mail.js";
import { generateCouponImage, generateRecieptImage } from "./generateImage.js";
import { timezoneManager } from "./luxon.js";

export const emailGenerator = async (
  form,
  {
    points,
    submission,
    submittedAt,
    teacher,
    student,
    schoolAdmin,
    school,
    leadTeacher = null,
  }
) => {
  let subject = '', body = '', attachment, attachmentName;

  if (!student && !teacher && !schoolAdmin) {
    return { subject, body, attachment, attachmentName };
  }

  // Get school timezone for consistent date formatting
  const schoolTimezone = school.timeZone || "UTC+0";
  const currentDateFormatted = timezoneManager.formatForSchool(
    new Date(submittedAt || Date.now()),
    schoolTimezone,
    "MM/dd/yyyy"
  );

  switch (form.formType) {
    case FormType.AwardPointsIEP:
    case FormType.AwardPoints: {
      subject = `GOOD NEWS, YOU EARNED ${points} E-TOKENS!`;
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

                        /* Content styles */
                        .date-line { margin-bottom: 15px; }
                        .message-content { margin: 30px 0; line-height: 1.6; }
                        .signature { margin-top: 40px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="${
                              process.env.LOGO_URL ||
                              "https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png"
                            }" alt="RADU Logo" class="logo-left">
                            <h1 class="title">Award Points</h1>
                            <img src="${
                              school.logo
                            }" alt="School Logo" class="logo-right">
                        </div>

                        <div class="date-line">
                            <strong>Date:</strong> ${currentDateFormatted}
                        </div>

                        <div class="message-content">
                            <p>Congratulations <strong>${student.name}</strong>!</p>
                            <br/>
                            <p>The ${
                              teacher.subject
                                ? `<strong>${teacher?.subject || "N/A"}</strong> teacher`
                                : `<strong>The RADU E-Token System</strong>`
                            }, <strong>${
                              teacher.name
                            }</strong>, has just awarded you with <strong>${points} E-Tokens</strong> for achieving your goals today.</p>
                            <br/>
                            <p>Please, check your E-Token's balance and exchange them at the AN Center or school store.</p>
                            <br/>
                            <p>Keep up the good work!!!</p>
                        </div>

                        <div class="signature">
                            ${schoolAdmin.name}<br>
                            ${schoolAdmin.email}<br>
                            The RADU E-Token System Manager<br>
                            ${school.name}, ${school.address || school.district || school.state}
                        </div>
                    </div>
                </body>
                </html>
            `;
      attachment = await generateCouponImage(
        points,
        student.name,
        teacher.name,
        teacher?.subject || "N/A",
        currentDateFormatted,
        school.logo,
        school.name,
        teacher.email,
        student.parentEmail
      );
      attachmentName = "coupon.png";

      break;
    }
    case FormType.Feedback: {
      const teacherNames = teacher.name.split(" ");
      const teacherFirstName = teacherNames[0];
      const teacherLastName = teacherNames[teacherNames.length - 1];

      subject = `Hi, I have a feedback about ${student.name} from ${
        !teacher.subject
          ? `grade ${student.grade}.`
          : `${teacher.subject} class.`
      }`;

      const feedback = submission.answers
        .map((item) => `<p>${item.answer}</p>`)
        .join(`<br/>`);

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
                            <img src="${
                              process.env.LOGO_URL ||
                              "https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png"
                            }" alt="RADU Logo" class="logo-left">
                            <h1 class="title">Feedback Note</h1>
                            <img src="${
                              school.logo
                            }" alt="School Logo" class="logo-right">
                        </div>

                        <div class="date-line">
                            <strong>Date:</strong> ${currentDateFormatted}
                        </div>
                        
                        <div class="issued-by">
                            <strong>From:</strong> ${teacherLastName} - ${
                              teacher.subject ??
                              "The RADU E-Token System Manager"
                            }
                        </div>
                        
                        <div class="feedback-content">
                            <p>Hello <strong>${student.name}</strong>,</p>
                            <br/>
                            <p>Here is feedback about your progress:</p>
                            <br/>
                            ${feedback}
                        </div>
                        
                        <div class="signature">
                            ${teacherFirstName} ${teacherLastName}<br>
                            ${
                              teacher.subject ??
                              "The RADU E-Token System Manager"
                            }<br>
                            ${school.name}, ${school.address || school.district || school.state}
                        </div>
                    </div>
                </body>
                </html>
            `;

      // Send to lead teacher if available (existing logic)
      if (leadTeacher) {
        const leadTeacherSubject = `Hi, I have a feedback about ${student.name} from ${
          !teacher.subject
            ? `grade ${student.grade}.`
            : `${teacher.subject} class.`
        }`;
        sendEmail(
          leadTeacher.email,
          leadTeacherSubject,
          body,
          body,
          attachment,
          attachmentName
        );
      }
      break;
    }
    case FormType.DeductPoints: {
      const teacherNames = teacher.name.split(" ");
      const teacherFirstName = teacherNames[0];
      const teacherLastName = teacherNames[teacherNames.length - 1];

      subject = `Oopsie Points have been deducted from balance of ${student.name}, grade ${student.grade}.`;

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
                            <img src="${
                              process.env.LOGO_URL ||
                              "https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png"
                            }" alt="RADU Logo" class="logo-left">
                            <h1 class="title">Oopsie Points</h1>
                            <img src="${
                              school.logo
                            }" alt="School Logo" class="logo-right">
                        </div>

                        <div class="date-line">
                            <strong>Date:</strong> ${currentDateFormatted}
                        </div>
                        
                        <div class="message-content">
                            <p>Hello ${student.name}:</p>
                            <br/>
                            <p>As a result of your infraction and our conversation, these are the points that have been subtracted from your balance.</p>
                            <br/>
                            <p><strong>Oopsie Points deducted = ${Math.abs(
                              points
                            )} Points</strong>, now your balance is = <strong>${
                              student.points
                            } Points</strong>.</p>
                        </div>
                        
                        <div class="signature">
                            ${teacher.name}<br/>
                            ${
                              teacher.type === "Lead"
                                ? "LEADER/ LEAD TEACHER"
                                : teacher.subject ||
                                  "The RADU E-Token System Manager"
                            }<br/>
                            ${teacher.grade && teacher.grade !== 'undefined' ? `Grade ${teacher.grade}<br/>` : ''}
                            ${school.name}, ${school.address || school.district || school.state}
                        </div>
                    </div>
                </body>
                </html>
            `;
      break;
    }
    case FormType.PointWithdraw: {
      subject = `${Math.abs(points)} points Withdrawn from student ${
        student.name
      }.`;
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
                        .message-content { margin: 30px 0; line-height: 1.6; }
                        .signature { margin-top: 40px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="${
                              process.env.LOGO_URL ||
                              "https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png"
                            }" alt="RADU Logo" class="logo-left">
                            <h1 class="title">Points Withdrawal</h1>
                            <img src="${
                              school.logo
                            }" alt="School Logo" class="logo-right">
                        </div>

                        <div class="date-line">
                            <strong>Date:</strong> ${currentDateFormatted}
                        </div>

                        <div class="message-content">
                            <p>Hello <strong>${student.name}</strong>,</p>
                            <br/>
                            <p><strong>${Math.abs(points)} points</strong> have been withdrawn from your account.</p>
                            <br/>
                            <p>Your current balance is: <strong>${student.points} points</strong></p>
                            <br/>
                            <p>Thank you for using the RADU E-Token System!</p>
                        </div>

                        <div class="signature">
                            ${schoolAdmin.name}<br>
                            The RADU E-Token System Manager<br>
                            ${school.name}, ${school.address || school.district || school.state}
                        </div>
                    </div>
                </body>
                </html>
            `;
      attachment = await generateRecieptImage(
        points,
        student.name,
        currentDateFormatted, // Use school timezone formatted date
        school.name,
        school.address,
        school.district,
        student.points // Pass current balance to display on receipt
      );
      attachmentName = "Receipt.png";
      break;
    }
  }

  // Send email to teacher for all point-related form types (AwardPoints, AwardPointsIEP, DeductPoints, PointWithdraw)
  // Teacher will receive email if:
  // 1. Form has teacherEmail enabled OR it's a DeductPoints/PointWithdraw form (always notify)
  // 2. Teacher has opted in to receive emails (recieveMails = true)
  // 3. Teacher's email is verified
  if (
    (form.teacherEmail ||
      form.formType == FormType.DeductPoints ||
      form.formType == FormType.PointWithdraw ||
      form.formType == FormType.AwardPoints ||
      form.formType == FormType.AwardPointsIEP) &&
    teacher?.recieveMails &&
    teacher.isEmailVerified
  )
    sendEmail(teacher.email, subject, body, body, attachment, attachmentName);
  const parentEmailRequired = form.parentEmail;
  const parentEmailsVerified = (student.parentEmail && student.isParentOneEmailVerified) ||
                               (student.standard && student.isParentTwoEmailVerified);
  const shouldFallbackToStudent = parentEmailRequired && !parentEmailsVerified;

  if (
    (form.studentEmail ||
      form.formType == FormType.DeductPoints ||
      form.formType == FormType.PointWithdraw ||
      form.formType == FormType.Feedback ||
      shouldFallbackToStudent) &&
    student?.isStudentEmailVerified
  )
    sendEmail(student.email, subject, body, body, attachment, attachmentName);
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
};

export const reportEmailGenerator = async (
  attachment,
  attachmentName,
  to,
  data
) => {
  try {
    let subject, body;

    // Use school timezone for report date
    const schoolTimezone = data.schData.school.timeZone || "UTC+0";
    const currentDate = timezoneManager.formatForSchool(
      new Date(),
      schoolTimezone,
      "MM/dd/yyyy"
    );
    const reportDate = timezoneManager.formatForSchool(
      new Date(),
      schoolTimezone,
      "MM/dd/yyyy"
    );

    subject = `RADU E-Token Report for ${attachmentName
      .replace("Etoken Report-", "")
      .replace(".pdf", "")
      .replaceAll("_", " ")
      .split("-As")[0]}`;
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
                  <img src="${
                    process.env.LOGO_URL ||
                    "https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png"
                  }" alt="RADU Logo" class="logo-left">
                  <h1 class="title">E-Token Report</h1>
                  <img src="${
                    data.schData.school.logo
                  }" alt="School Logo" class="logo-right">
              </div>

              <div class="report-content">
                <p>Attached you will find the report for ${
                  data.stdData.studentInfo.name
                }, Grade ${
                  data.stdData.studentInfo.grade
                } as of ${reportDate}.</p>
                <div class="contact-info">
                  <p>Contact Info</p>
                  <p>Parent/Guardian Email 1: ${
                    data.stdData.studentInfo.parentEmail
                  }</p>
                  ${
                    data.stdData.studentInfo.standard
                      ? `<p>Parent/Guardian Email 2: ${data.stdData.studentInfo.standard}</p>`
                      : ""
                  }
                </div>
              </div>

              <div class="footer">
                  Created by The RADU E-Token © 2025 on ${currentDate}.
              </div>
          </div>
      </body>
      </html>
    `;
    sendEmailReport(to, subject, body, body, attachment, attachmentName);
  } catch (err) {
    console.error(err);
  }
};
