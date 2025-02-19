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
            const teacherNameArray = teacher.name.split(" ")
            const teacherLastName = teacherNameArray[teacherNameArray.length - 1]
            subject = `Feedback issued. ${student.name} received a Feedback today from the teacher ${teacherLastName}.`
            const feedback = submission.answers.map((item) => `<p>${item.answer}</p>`).join(`<br/>`)
            body = `<p>On ${new Date().toLocaleDateString()}, the teacher ${teacherLastName} issued the next feedback about ${student.name}: <br/> ${feedback} </p>
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
            // body = `
            // <!DOCTYPE html>
            // <html>
            // <head>
            // <style>
            //     body { font-family: Arial, sans-serif; text-align: center; line-height: 1.6; margin: 0; padding: 0; }
            //     .container { margin: auto; padding: 20px; max-width: 600px; border: 1px solid #ccc; border-radius: 10px; background-color: #f9f9f9; }
            //     .header { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            //     .sub-header { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            //     .points { font-size: 36px; font-weight: bold; margin: 20px 0; }
            //     .footer { font-size: 14px; color: #555; margin-top: 20px; }
            // </style>
            // </head>
            // <body>
            // <div class="container">
            //     <div>
            //     ***********************************************
            //     </div>
            //     <div class="header">E-TOKEN EXCHANGE RECEIPT</div>
            //     <div>
            //     ***********************************************
            //     </div>
            //     <div class="sub-header">${school.district}</div>
            //     <div>${school.name}</div>
            //     <div>${school.address}</div>
            //     <div>SCHOOL STORE</div>
            //     <div>
            //     ***********************************************
            //     </div>
            //     <div><strong>DATE:</strong> ${new Date().toLocaleDateString()}</div>
            //     <div><strong>ISSUED TO:</strong> ${student.name}</div>
            //     <div class="points">${Math.abs(points)}</div><br>Points
            //     <div>
            //     ***********************************************
            //     </div>
            //     <div class="footer">THANK YOU!<br>Keep on the great job!!!</div>
            // </div>
            // </body>
            // </html>
            // `;
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


export const reportEmailGenerator = async (attachment, attachmentName, to) => {
  let subject, body;

  subject = `Yearly Report of ${attachmentName}`
  body = `Please find the attached report of ${attachmentName}`
  sendEmailReport(
    to,
    subject,
    body,
    body,
    attachment,
    attachmentName
  )
}