import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';

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
    // Resolve the directory name
    const __dirname = dirname(fileURLToPath(import.meta.url));
    
    // Load the background image
    const backgroundImage = await loadImage(path.join(__dirname, './WhatsApp Image 2025-01-02 at 22.39.52_337d2c07.jpg').replaceAll("\\","/"));
    
    // Load the school logo
    const schoolLogo = await loadImage(schoolLogoURL);
    console.log("loaded");
    
    
    // Create a canvas
    const canvas = createCanvas(690, 400); // Adjusted height for additional text
    const ctx = canvas.getContext('2d');
    
    // Draw the background image
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Draw the school logo in the top-left corner
    const logoWidth = 80; // Adjust size as needed
    const logoHeight = 80;
    ctx.drawImage(schoolLogo, 80, 80, logoWidth, logoHeight);

    // Set font and style for text
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add school name
    ctx.fillText(schoolName, canvas.width / 2, 40);

    // Add dynamic text
    ctx.fillText(`Student: ${student}`, canvas.width / 2, 150);
    ctx.fillText(`No. of Tokens: ${noOfTokens}`, canvas.width / 2, 180);
    ctx.fillText(`Teacher: ${teacher} (${subject})`, canvas.width / 2, 200);
    ctx.fillText(`Teacher Email: ${teacherEmail}`, canvas.width / 2, 230);
    ctx.fillText(`Parent Email: ${parentEmail}`, canvas.width / 2, 250);
    ctx.fillText(`Date: ${date}`, canvas.width / 2, 300);
    
    // Convert canvas to a buffer
    return canvas.toBuffer();
  } catch (error) {
    console.error('Error generating coupon image:', error);
    throw error;
  }
};

async function testLoadImage() {
    try {
        const __dirname = dirname(fileURLToPath(import.meta.url));
      const imgPath = path.join(__dirname, './ticket_base.png').replaceAll("\\", "/");
      console.log('Loading image from path:', imgPath);
      const image = await loadImage(imgPath);
      console.log('Image loaded successfully:', image);
      return image
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }
  
