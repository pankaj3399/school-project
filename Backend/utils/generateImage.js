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
    const backgroundImage = await loadImage(path.join(__dirname, './ticket_base.png').replaceAll("\\","/"));
    
    // Load the school logo
    const schoolLogo = await loadImage(schoolLogoURL);
    console.log("loaded");
    
    
    // Create a canvas
    const canvas = createCanvas(690, 345); // Adjusted height for additional text
    const ctx = canvas.getContext('2d');
    
    // Draw the background image
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Draw the school logo in the top-left corner
    const logoWidth = 100; // Adjust size as needed
    const logoHeight = 100;
    ctx.drawImage(schoolLogo, 20, 20, logoWidth, logoHeight);

    // Set font and style for text
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add school name
    ctx.fillText(schoolName, canvas.width / 2, 50);

    // Add dynamic text
    ctx.fillText(`Student: ${student}`, 400, 120);
    ctx.fillText(`No. of Tokens: ${noOfTokens}`, 400, 170);
    ctx.fillText(`Teacher: ${teacher} (${subject})`, 400, 220);
    ctx.fillText(`Parent Email: ${parentEmail}`, 400, 270);
    ctx.fillText(`Teacher Email: ${teacherEmail}`, 400, 320);
    ctx.fillText(`Date: ${date}`, 400, 370);
    
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
  