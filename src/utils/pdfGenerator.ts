import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Database } from '@/integrations/supabase/types';

type Certificate = Database['public']['Tables']['certificates']['Row'];

export const generateCertificatePDF = async (certificate: Certificate): Promise<void> => {
  try {
    // Get the certificate template element
    const element = document.getElementById('certificate-template');
    if (!element) {
      throw new Error('Certificate template not found');
    }

    // Create canvas from the certificate template
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 1200,
      height: 800,
      logging: false
    });

    // Calculate dimensions for PDF (A4 landscape)
    const imgWidth = 297; // A4 width in mm (landscape)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add the image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Save the PDF
    const fileName = `Certificate_${certificate.student_name.replace(/\s+/g, '_')}_${certificate.certificate_id}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF certificate');
  }
};

export const previewCertificatePDF = async (certificate: Certificate): Promise<string> => {
  try {
    // Get the certificate template element
    const element = document.getElementById('certificate-template');
    if (!element) {
      throw new Error('Certificate template not found');
    }

    // Create canvas from the certificate template
    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 1200,
      height: 800,
      logging: false
    });

    // Return data URL for preview
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw new Error('Failed to generate PDF preview');
  }
};