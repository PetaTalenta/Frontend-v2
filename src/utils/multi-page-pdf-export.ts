import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AssessmentResult } from '../types/assessment-results';

/**
 * Helper function to safely get persona title with fallbacks
 */
function getPersonaTitle(result: AssessmentResult): string {
  if (!result.persona_profile) {
    return 'Profil Persona';
  }
  return result.persona_profile.archetype ||
         result.persona_profile.title ||
         'Profil Persona';
}

export interface MultiPagePDFOptions {
  quality?: number;
  scale?: number;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  waitTime?: number;
}

/**
 * Export PDF with screenshots from multiple pages using window.open approach
 */
export async function exportMultiPagePDF(
  resultId: string,
  result: AssessmentResult,
  options: MultiPagePDFOptions = {}
): Promise<Blob> {
  const defaultOptions: MultiPagePDFOptions = {
    quality: 0.95,
    scale: 1.2,
    format: 'a4',
    orientation: 'portrait',
    margin: 5,
    waitTime: 3000,
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
    addMultiPageCoverPage(pdf, result, { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! });

    // Define pages to capture
    const pages = [
      { title: 'Hasil Assessment Utama', url: `/results/${resultId}` },
      { title: 'Detail RIASEC', url: `/results/${resultId}/riasec` },
      { title: 'Detail Big Five (OCEAN)', url: `/results/${resultId}/ocean` },
      { title: 'Detail VIA Character Strengths', url: `/results/${resultId}/via` }
    ];

    // Capture each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      pdf.addPage();
      
      try {
        await capturePageInNewWindow(
          pdf, 
          page.title, 
          page.url,
          { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! },
          defaultOptions
        );
      } catch (error) {
        console.error(`Failed to capture ${page.title}:`, error);
        addErrorPage(pdf, page.title, { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! });
      }
    }

    // Add footer to all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addMultiPageFooter(pdf, i, totalPages, { pageWidth, pageHeight, margin: defaultOptions.margin! });
    }

    // Return PDF as blob
    return new Promise((resolve) => {
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
    });

  } catch (error) {
    console.error('Error creating multi-page PDF:', error);
    throw new Error('Failed to create multi-page PDF export');
  }
}

/**
 * Capture page in new window and add to PDF
 */
async function capturePageInNewWindow(
  pdf: jsPDF,
  title: string,
  url: string,
  dimensions: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number },
  options: MultiPagePDFOptions
): Promise<void> {
  // Add page title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, dimensions.margin, dimensions.margin + 8);

  return new Promise(async (resolve, reject) => {
    try {
      const fullUrl = window.location.origin + url;
      
      // Open new window
      const newWindow = window.open(fullUrl, '_blank', 'width=1200,height=800,scrollbars=yes');
      
      if (!newWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Wait for window to load
      let loadAttempts = 0;
      const maxAttempts = 20;
      
      const checkLoaded = async () => {
        loadAttempts++;
        
        try {
          // Check if window is loaded
          if (newWindow.document && newWindow.document.readyState === 'complete') {
            // Wait additional time for dynamic content
            await new Promise(resolve => setTimeout(resolve, options.waitTime || 3000));
            
            // Scroll to top
            newWindow.scrollTo(0, 0);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Capture screenshot
            const canvas = await html2canvas(newWindow.document.body, {
              scale: options.scale || 1.2,
              backgroundColor: '#ffffff',
              useCORS: true,
              allowTaint: false,
              width: 1200,
              height: Math.min(newWindow.document.body.scrollHeight, 4000),
              logging: false,
              removeContainer: true
            });

            // Calculate image dimensions
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

            // Close window
            newWindow.close();
            resolve();
            
          } else if (loadAttempts >= maxAttempts) {
            newWindow.close();
            throw new Error('Page load timeout');
          } else {
            setTimeout(checkLoaded, 500);
          }
        } catch (error) {
          newWindow.close();
          reject(error);
        }
      };

      // Start checking
      setTimeout(checkLoaded, 1000);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Add cover page
 */
function addMultiPageCoverPage(
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
  const personaTitle = getPersonaTitle(result);
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
  
  // Note about screenshots
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  const noteText = 'PDF ini berisi screenshot dari semua halaman assessment';
  const noteWidth = pdf.getTextWidth(noteText);
  pdf.text(noteText, centerX - (noteWidth / 2), 155);
}

/**
 * Add error page when capture fails
 */
function addErrorPage(
  pdf: jsPDF,
  title: string,
  dimensions: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number }
): void {
  // Add page title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, dimensions.margin, dimensions.margin + 8);

  // Add error message
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Gagal mengambil screenshot halaman ini.', dimensions.margin, dimensions.margin + 30);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Silakan kunjungi halaman web untuk melihat detail lengkap.', dimensions.margin, dimensions.margin + 50);
}

/**
 * Add footer
 */
function addMultiPageFooter(
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
export function downloadMultiPagePDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
