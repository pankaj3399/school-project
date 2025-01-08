process.env.FONTCONFIG_PATH = '/dev/null'

import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage, registerFont } from 'canvas';


function loadFontFromURL(url, familyName) {
  registerFont(url, { family: familyName });
}

const __dirname = dirname(fileURLToPath(import.meta.url));
export const generateCouponImage = async (
  noOfTokens,
  student,
  teacher,
  subject,
  date,
  schoolLogoURL,
  schoolName,
  teacherEmail,
  parentEmail,
) => {
  try {
    loadFontFromURL(path.join(__dirname, '../fonts/ARIAL.TTF'),'Arial')
    const backgroundImage = await loadImage(path.join(__dirname, './school_token.png'));
    const schoolLogo = await loadImage(schoolLogoURL);

    const canvas = createCanvas(690, 400)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    
    
    ctx.font = '15px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    console.log(ctx.font);
    
    ctx.fillText(`VALID ONLY AT ${schoolName.toUpperCase()} STORE`, canvas.width / 2, 40);
    ctx.font = '20px Arial'
    ctx.fillText(`Awarded to: ${student.toUpperCase()}`, canvas.width / 2, 150);
    ctx.font = '45px Arial'
    ctx.fillText(`${noOfTokens} E-TOKENS`, canvas.width / 2, 180);
    ctx.drawImage(schoolLogo, canvas.width/2 - 30, 200, 60, 60);
    ctx.font = '15px Arial'
    ctx.fillText(`EARNED AT ${subject.toUpperCase()} CLASS`, canvas.width / 2, 270);
    ctx.fillText(`ON ${date}`, canvas.width / 2, 290);
    ctx.fillText(`AWARDED BY TEACHER: ${teacher}`, canvas.width / 2, 310);
    ctx.fillText(`Parents: ${parentEmail}`, canvas.width / 2, 350);

    return canvas.toBuffer();
  } catch (error) {
    console.error('Error generating coupon image:', error);
    throw error;
  }
};



