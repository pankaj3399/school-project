process.env.FONTCONFIG_PATH = '/dev/null'

import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'canvas';

const { createCanvas, loadImage, registerFont } = pkg

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
    loadFontFromURL(path.join(__dirname, '../fonts/courbd.ttf'),'Courier New Bold')
    const backgroundImage = await loadImage(path.join(__dirname, './school_token.png'));
    
    const schoolLogo = await loadImage(schoolLogoURL);
    
    const canvas = createCanvas(690, 400)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    
    
    ctx.font = 'bold 15px "Courier New Bold"';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText(`VALID ONLY AT ${schoolName.toUpperCase()} STORE`, canvas.width / 2, 40);
    ctx.font = 'bold 20px "Courier New Bold"'
    ctx.fillText(`Awarded to: ${student.toUpperCase()}`, canvas.width / 2, 150);
    ctx.font = 'bold 45px "Courier New Bold"'
    ctx.fillText(`${noOfTokens} E-TOKENS`, canvas.width / 2, 180);
    ctx.drawImage(schoolLogo, canvas.width/2 - 30, 200, 60, 60);
    ctx.font = 'bold 20px "Courier New Bold"'
    ctx.fillText(`EARNED AT THE ${subject.toUpperCase()} CLASS`, canvas.width / 2, 270);
    ctx.fillText(`ON ${date}`, canvas.width / 2, 290);
    ctx.fillText(`AWARDED BY: ${teacher}`, canvas.width / 2, 310);
    ctx.fillText(`cc: ${parentEmail}`, canvas.width / 2, 350);

    return canvas.toBuffer();
  } catch (error) {
    console.error('Error generating coupon image:', error);
    throw error;
  }
};

export const generateRecieptImage = async (
  noOfTokens,
  student,
  date,
  schoolName,
  schoolAddress,
  schoolDistrict,
) => {
  try {
    loadFontFromURL(path.join(__dirname, '../fonts/courbd.ttf'),'Courier New Bold')
    const backgroundImage = await loadImage(path.join(__dirname, './Withdraw_reciept.png'));
    
    const canvas = createCanvas(404, 621)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    
    
    ctx.font = 'bold 15px "Courier New Bold"';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 30px "Courier New Bold"'
    ctx.fillText(`THE RADU`, canvas.width / 2, 80);
    ctx.fillText(`E-TOKEN SYSTEM`, canvas.width / 2, 110);
    ctx.fillText(`EXCHANGE RECEIPT`, canvas.width / 2, 140);
    
    ctx.font = 'bold 16px "Courier New Bold"'
    ctx.fillText(`${schoolDistrict.toUpperCase()}`, canvas.width / 2, 200);
    ctx.fillText(`${schoolName.toUpperCase()}`, canvas.width / 2, 220);
    ctx.fillText(`${schoolAddress.toUpperCase()}`, canvas.width / 2, 240);
    ctx.fillText(`DATE: ${date}`, canvas.width /2, 310);
    ctx.fillText(`ISUUED TO: ${student.toUpperCase()}`, canvas.width /2, 330);
    ctx.font = 'bold 100px "Courier New Bold"'
    ctx.fillText(`${Math.abs(noOfTokens)}`, canvas.width / 2, 420);
    return canvas.toBuffer();
  } catch (error) {
    console.error('Error generating coupon image:', error);
    throw error;
  }
};



