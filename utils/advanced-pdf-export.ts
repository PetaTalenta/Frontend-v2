import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AssessmentResult } from '../types/assessment-results';

export interface AdvancedPDFOptions {
  quality?: number;
  scale?: number;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
}

/**
 * Export PDF with screenshots from multiple pages using a more reliable approach
 */
export async function exportAdvancedPDF(
  resultId: string,
  result: AssessmentResult,
  options: AdvancedPDFOptions = {}
): Promise<Blob> {
  const defaultOptions: AdvancedPDFOptions = {
    quality: 0.95,
    scale: 1.5,
    format: 'a4',
    orientation: 'portrait',
    margin: 5,
    ...options
  };

  try {
    // Create PDF document
    const pdf = new jsPDF({
      orientation: defaultOptions.orientation,
      unit: 'mm',
      format: defaultOptions.format
    });

    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (defaultOptions.margin! * 2);
    const contentHeight = pageHeight - (defaultOptions.margin! * 2);

    // Add cover page
    addAdvancedCoverPage(pdf, result, { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! });

    // Capture current page (main results)
    pdf.addPage();
    await captureAndAddCurrentPage(pdf, 'Hasil Assessment Utama', { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! }, defaultOptions);

    // Add instruction pages for other sections
    pdf.addPage();
    addInstructionPage(pdf, 'Detail RIASEC Holland Codes', resultId, 'riasec', { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! });

    pdf.addPage();
    addInstructionPage(pdf, 'Detail Big Five (OCEAN)', resultId, 'ocean', { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! });

    pdf.addPage();
    addInstructionPage(pdf, 'Detail VIA Character Strengths', resultId, 'via', { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! });

    // Add footer to all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addAdvancedFooter(pdf, i, totalPages, { pageWidth, pageHeight, margin: defaultOptions.margin! });
    }

    // Return PDF as blob
    return new Promise((resolve) => {
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
    });

  } catch (error) {
    console.error('Error creating advanced PDF:', error);
    throw new Error('Failed to create advanced PDF export');
  }
}

/**
 * Add advanced cover page
 */
function addAdvancedCoverPage(
  pdf: jsPDF,
  result: AssessmentResult,
  dimensions: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number }
): void {
  const centerX = dimensions.pageWidth / 2;
  
  // Title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const titleText = 'Laporan Hasil Assessment';
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.text(titleText, centerX - (titleWidth / 2), 50);
  
  // Subtitle
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = 'PetaTalenta Assessment Report';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, centerX - (subtitleWidth / 2), 70);
  
  // Persona title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const personaTitle = result.persona_profile.title;
  const personaTitleWidth = pdf.getTextWidth(personaTitle);
  pdf.text(personaTitle, centerX - (personaTitleWidth / 2), 100);
  
  // Date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const date = new Date(result.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const dateText = `Tanggal: ${date}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, centerX - (dateWidth / 2), 120);
  
  // ID
  const idText = `ID: ${result.id}`;
  const idWidth = pdf.getTextWidth(idText);
  pdf.text(idText, centerX - (idWidth / 2), 135);
  
  // Description
  const descriptionY = 160;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const description = result.persona_profile.description;
  const lines = pdf.splitTextToSize(description, dimensions.contentWidth - 40);
  pdf.text(lines, dimensions.margin + 20, descriptionY);
  
  // Strengths
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Kekuatan Utama:', dimensions.margin, descriptionY + 40);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  result.persona_profile.strengths.slice(0, 5).forEach((strength, index) => {
    pdf.text(`• ${strength}`, dimensions.margin + 5, descriptionY + 55 + (index * 8));
  });
}

/**
 * Capture current page and add to PDF
 */
async function captureAndAddCurrentPage(
  pdf: jsPDF,
  title: string,
  dimensions: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number },
  options: AdvancedPDFOptions
): Promise<void> {
  // Add page title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, dimensions.margin, dimensions.margin + 8);

  try {
    // Scroll to top
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capture screenshot of current page
    const canvas = await html2canvas(document.body, {
      scale: options.scale || 1.5,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      width: 1200,
      height: Math.min(document.body.scrollHeight, 4000),
      logging: false,
      removeContainer: true
    });

    // Calculate image dimensions to fit page
    const maxImgWidth = dimensions.contentWidth;
    const maxImgHeight = dimensions.contentHeight - 20;
    
    const imgWidth = maxImgWidth;
    const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, maxImgHeight);
    
    // Add image to PDF
    const imgData = canvas.toDataURL('image/png', options.quality || 0.95);
    pdf.addImage(
      imgData,
      'PNG',
      dimensions.margin,
      dimensions.margin + 15,
      imgWidth,
      imgHeight
    );

  } catch (error) {
    console.error(`Error capturing current page:`, error);
    
    // Add error message
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Error mengambil screenshot halaman ini.', dimensions.margin, dimensions.margin + 30);
  }
}

/**
 * Add instruction page for other sections
 */
function addInstructionPage(
  pdf: jsPDF,
  title: string,
  resultId: string,
  section: string,
  dimensions: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number }
): void {
  // Add page title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, dimensions.margin, dimensions.margin + 8);

  // Add instruction
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Untuk melihat detail lengkap dari bagian ini, silakan kunjungi:', dimensions.margin, dimensions.margin + 30);
  
  // Add URL
  const url = `${window.location.origin}/results/${resultId}/${section}`;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(url, dimensions.margin, dimensions.margin + 45);
  
  // Add note
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Catatan: Untuk mendapatkan PDF dengan screenshot lengkap semua halaman,', dimensions.margin, dimensions.margin + 65);
  pdf.text('silakan kunjungi setiap halaman secara manual dan gunakan fitur export.', dimensions.margin, dimensions.margin + 80);
}

/**
 * Add footer
 */
function addAdvancedFooter(
  pdf: jsPDF,
  pageNumber: number,
  totalPages: number,
  dimensions: { pageWidth: number; pageHeight: number; margin: number }
): void {
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  // Page number
  const pageText = `Halaman ${pageNumber} dari ${totalPages}`;
  const pageTextWidth = pdf.getTextWidth(pageText);
  pdf.text(
    pageText,
    dimensions.pageWidth - dimensions.margin - pageTextWidth,
    dimensions.pageHeight - dimensions.margin
  );
  
  // Footer text
  pdf.text(
    'PetaTalenta Assessment Report',
    dimensions.margin,
    dimensions.pageHeight - dimensions.margin
  );
}

/**
 * Download PDF blob
 */
export function downloadAdvancedPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
