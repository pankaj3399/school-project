import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import fetch from 'node-fetch';

const getImageAsBase64 = async (input) => {
    try {
        if (Buffer.isBuffer(input)) {
            return input.toString('base64');
        }
        if (typeof input === 'string' && input.startsWith('http')) {
            const response = await fetch(input);
            const buffer = await response.buffer();
            return buffer.toString('base64');
        }
        return null;
    } catch (error) {
        console.error('Error processing image:', error);
        return null;
    }
};

// Helper function to format date according to timezone
const formatDateWithTimezone = (dateString, timezone) => {
    try {
        const date = new Date(dateString);
        
        // Parse timezone offset from string (e.g., "UTC-5" => -5)
        let offsetHours = 0;
        if (timezone && typeof timezone === 'string' && timezone.startsWith('UTC')) {
            offsetHours = parseInt(timezone.replace('UTC', '')) || 0;
        }
        
        // Apply timezone offset
        const adjustedDate = new Date(date.getTime() + (offsetHours * 60 * 60 * 1000));
        
        // Format the date
        return {
            date: adjustedDate.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            }),
            time: adjustedDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };
    } catch (error) {
        console.error('Error formatting date with timezone:', error);
        return { date: 'Invalid Date', time: 'Invalid Time' };
    }
};

export const generateStudentPDF = async ({
    studentData,
    schoolData,
    barChartImage,
    teacherData
}) => {
    try {
        console.log(studentData);
        
        const doc = new jsPDF('p', 'mm', 'a4');
        const lineSpacing = 1; // 1.5 line spacing
        const baseLineHeight = 12 * 0.3528; // Convert pt to mm (12pt = ~4.23mm)
        const lineHeight = baseLineHeight * lineSpacing; // Apply line spacing
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let yPos = margin;

        // Set default font to helvetica instead of arial
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);

        // Fixed RADU Framework logo (make sure this URL is accessible)
        const raduLogoUrl = process.env.VERTICAL_LOGO ?? 'https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png';
        try {
            const raduLogoBase64 = await getImageAsBase64(raduLogoUrl);
            if (raduLogoBase64) {
                doc.addImage(`data:image/png;base64,${raduLogoBase64}`, 'PNG', margin, yPos-5, 40, 60);
            }
        } catch (error) {
            console.error('Error loading RADU logo:', error);
        }

        // Add School logo on right
        if (schoolData.school.logo) {
            const logoBase64 = await getImageAsBase64(schoolData.school.logo);
            if (logoBase64) {
                doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', pageWidth - margin - 40, yPos, 40, 50);
            }
        }

        // Center headings with helvetica
        doc.setFont("helvetica", "bold");
        const centerX = pageWidth / 2;

        yPos += 10;
        ['THE RADU E-TOKEN SYSTEM', 'E-TOKEN SYSTEM', schoolData.school.name, teacherData.name, `Grade ${studentData.studentInfo.grade}`]
            .forEach(text => {
                doc.text(text, centerX, yPos, { align: 'center' });
                yPos += lineHeight;
            });

        // Student name with larger font but same family
        yPos += lineHeight;
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(studentData.studentInfo.name.toUpperCase(), centerX, yPos, { align: 'center' });
        
        yPos += lineHeight;
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`${studentData.studentInfo.email}`, centerX, yPos, { align: 'center' });
        
        yPos += lineHeight;
        const dateStr = new Date().toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
        });
        doc.text(`As of ${dateStr}`, centerX, yPos, { align: 'center' });

        // Bar chart
        if (barChartImage) {
            yPos += 20;
            const chartBase64 = await getImageAsBase64(barChartImage);
            if (chartBase64) {
                doc.addImage(`data:image/png;base64,${chartBase64}`, 'PNG', margin, yPos, 170, 80);
                yPos += 90;
            }
        }

        // Points table
        doc.autoTable({
            startY: yPos,
            head: [['E-Tokens', 'Oopsies', 'Withdrawals', 'Balance', 'Feedback']],
            body: [[
                studentData.totalPoints.eToken,
                Math.abs(studentData.totalPoints.oopsies),
                Math.abs(studentData.totalPoints.withdraw),
                (studentData.totalPoints.eToken - studentData.totalPoints.withdraw - studentData.totalPoints.oopsies) || 0,
                studentData.feedback.length
            ]],
            theme: 'grid',
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0],
                fontSize: 12,
                fontStyle: 'bold',
                cellPadding: 8,
                halign: 'center',
                lineWidth: 0.5,
                lineColor: [0, 0, 0],
                font: 'helvetica'
            },
            bodyStyles: {
                fontSize: 12,
                halign: 'center',
                lineWidth: 0.5,
                lineColor: [0, 0, 0],
                font: 'helvetica',
                cellPadding: {
                    top: 6 * lineSpacing,
                    bottom: 6 * lineSpacing,
                    left: 6,
                    right: 6
                }
            },
            styles: {
                cellPadding: 6,
                fontSize: 12,
                cellWidth: 'auto'
            },
            margin: { left: margin }
        });

        // Add footer to first page
        addFooter(doc, 1);

        // Second page
        doc.addPage();
        yPos = margin;

        // History section
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text('History', margin, yPos);
        yPos += 10;

        if (studentData.data.length > 0) {
            const timezone = schoolData.school.timeZone || 'UTC+0';
            
            const historyData = studentData.data.map(item => {
                const formattedDate = formatDateWithTimezone(item.submittedAt, timezone);
                return [
                    formattedDate.date,
                    formattedDate.time,
                    item.submittedByName,
                    item.formType,
                    item.points.toString()
                ];
            });

            doc.autoTable({
                startY: yPos,
                head: [['Date', 'Time', 'Teacher', 'Action', 'Points']],
                body: historyData,
                theme: 'grid',
                headStyles: {
                    fillColor: [240, 240, 240],
                    textColor: [0, 0, 0],
                    fontSize: 12,
                    fontStyle: 'bold',
                    cellPadding: 8,
                    halign: 'center',
                    lineWidth: 0.5,
                    lineColor: [0, 0, 0],
                    font: 'helvetica'
                  },
                  bodyStyles: {
                    fontSize: 10,
                    font: 'arial',
                    halign: 'center',
                    lineWidth: 0.5,
                    lineColor: [0, 0, 0],
                    font: 'helvetica',
                    cellPadding: {
                        top: 6 * lineSpacing,
                        bottom: 6 * lineSpacing,
                        left: 6,
                        right: 6
                    }
                  },
                  styles: {
                    overflow: 'linebreak',
                    minCellHeight: 6
                  },
                  columnStyles: {
                    0: { cellWidth: 'auto' },     // Date column
                    1: { cellWidth: 'auto' },     // Time column
                    2: { cellWidth: 35 },     // Student column
                    3: { cellWidth: 'auto'}, // Action column
                    4: { cellWidth: 'auto'}  // Points column
                  }
            });
        }

        // Feedback section
        if (studentData.feedback.length > 0) {
            yPos = (doc).lastAutoTable.finalY + 30;
            doc.text('Feedback', margin, yPos);
            yPos += 10;

            const timezone = schoolData.school.timeZone || 'UTC+0';
            
            const feedbackData = studentData.feedback.map(item => {
                const formattedDate = formatDateWithTimezone(item.createdAt, timezone);
                return [
                    formattedDate.date,
                    item.submittedByName,
                    item.feedback
                ];
            });

            doc.autoTable({
                startY: yPos,
                head: [['Date', 'Teacher', 'Feedback']],
                body: feedbackData,
                theme: 'grid',
                headStyles: {
                    fillColor: [240, 240, 240],
                    textColor: [0, 0, 0],
                    fontSize: 12,
                    fontStyle: 'bold',
                    cellPadding: 8,
                    halign: 'center',
                    lineWidth: 0.5,
                    lineColor: [0, 0, 0],
                    font: 'helvetica'
                  },
                  bodyStyles: {
                    fontSize: 12,
                    halign: 'left',
                    lineWidth: 0.5,
                    lineColor: [0, 0, 0],
                    font: 'helvetica',
                    cellPadding: {
                        top: 6 * lineSpacing,
                        bottom: 6 * lineSpacing,
                        left: 6,
                        right: 6
                    }
                  },
                  styles: {
                    cellPadding: 6,
                    fontSize: 10,
                    overflow: 'linebreak'
                  },
                  columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 100 }  // Fixed width for feedback column
                  }
            });
        }

        // Add footer to second page
        addFooter(doc, 2);

        return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw error;
    }
};

// Helper function for footer
const addFooter = (doc, pageNumber) => {
    const totalPages = 2;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const dateStr = new Date().toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
    });

    doc.text(`Page ${pageNumber} of ${totalPages}`, 20, pageHeight - 10);
    doc.text("The RADU E-token System", pageWidth/2, pageHeight - 10, { align: 'center' });
    doc.text(`Created On ${dateStr}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
};