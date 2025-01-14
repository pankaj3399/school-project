import { FormType } from "../enum.js";
import { sendEmail } from "../services/nodemailer.js";
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
            <p>The <strong>${teacher.subject}</strong> teacher, <strong>${teacher.name}</strong>, has just awarded you with <strong>${points} E-Tokens</strong> for achieving your goals today.</p>
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
                    teacher.subject,
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
            body = `${Math.abs(points)} points Withdrawn from student ${student.name}.`
            attachment = await generateRecieptImage(points,student.name,new Date().toLocaleDateString(),school.name,school.address,school.district)
            attachmentName='reciept.png'
            break;
        }
    }
    if (form.teacherEmail && teacher.recieveMails)
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
