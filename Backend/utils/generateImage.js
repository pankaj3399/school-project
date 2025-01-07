process.env.FONTCONFIG_PATH = '/dev/null'

import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage, registerFont } from 'canvas';
import fetch from 'node-fetch';
import fs from 'fs';
import os from 'os';

async function loadFontFromURL(url, familyName) {
  const tempDir = os.tmpdir(); // Temporary directory for serverless functions
  const fontPath = path.join(tempDir, `${familyName}.ttf`);

  // Download the font and save it to the temporary directory
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.statusText}`);
  }
  const fontBuffer = await response.arrayBuffer();
  fs.writeFileSync(fontPath, Buffer.from(fontBuffer));

  // Register the font
  registerFont(fontPath, { family: familyName });
}
////
//update
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
    await loadFontFromURL(
      'https://res.cloudinary.com/dvsl1aslo/raw/upload/v1735842623/ARIAL_i6tfdd.TTF', // Replace with your hosted font URL
      'Arial'
    );
    const backgroundImage = await loadImage(
      'https://res.cloudinary.com/dvsl1aslo/image/upload/v1735839196/school_token_qvqoxg.png'
    );
    const schoolLogo = await loadImage(schoolLogoURL);

    const canvas = createCanvas(690, 400)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(schoolLogo, 80, 80, 80, 80);

    // Set font and style for text
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

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


async function testLoadImage() {
    try {
        const __dirname = dirname(fileURLToPath(import.meta.url));
      const imgPath = "https://res.cloudinary.com/dvsl1aslo/image/upload/v1735839196/school_token_qvqoxg.png";
      console.log('Loading image from path:', imgPath);
      const image = await loadImage(imgPath);
      console.log('Image loaded successfully:', image);
      return image
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }
  