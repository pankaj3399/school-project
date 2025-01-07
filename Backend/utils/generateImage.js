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
    ctx.drawImage(schoolLogo, 80, 80, 80, 80);

  
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    console.log(ctx.font);
    
    ctx.fillText(schoolName, canvas.width / 2, 40);
    ctx.fillText(`Student: ${student}`, canvas.width / 2, 150);
    ctx.fillText(`No. of Tokens: ${noOfTokens}`, canvas.width / 2, 180);
    ctx.fillText(`Teacher: ${teacher} (${subject})`, canvas.width / 2, 200);
    ctx.fillText(`Teacher Email: ${teacherEmail}`, canvas.width / 2, 230);
    ctx.fillText(`Parent Email: ${parentEmail}`, canvas.width / 2, 250);
    ctx.fillText(`Date: ${date}`, canvas.width / 2, 300);

    return canvas.toBuffer();
  } catch (error) {
    console.error('Error generating coupon image:', error);
    throw error;
  }
};



