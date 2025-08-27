import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AssessmentResult, extractScoresFromApiData } from '../types/assessment-results';

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

/**
 * Helper function to safely get persona description with fallbacks
 */
function getPersonaDescription(result: AssessmentResult): string {
  if (!result.persona_profile) {
    return 'Deskripsi profil tidak tersedia.';
  }
  return result.persona_profile.description ||
         result.persona_profile.shortSummary ||
         'Deskripsi profil tidak tersedia.';
}

/**
 * Helper function to safely get persona strengths with fallbacks
 */
function getPersonaStrengths(result: AssessmentResult): string[] {
  if (!result.persona_profile || !result.persona_profile.strengths) {
    return ['Kekuatan belum tersedia'];
  }
  return result.persona_profile.strengths;
}

/**
 * Helper function to safely get career recommendations with fallbacks
 */
function getCareerRecommendations(result: AssessmentResult): any[] {
  if (!result.persona_profile || !result.persona_profile.careerRecommendation) {
    return [{ careerName: 'Rekomendasi karir belum tersedia', matchPercentage: 0 }];
  }
  return result.persona_profile.careerRecommendation;
}

/**
 * Helper function to safely get role models with fallbacks
 */
function getRoleModels(result: AssessmentResult): string[] {
  if (!result.persona_profile || !result.persona_profile.roleModel) {
    return [];
  }
  return result.persona_profile.roleModel.map((rm: any) => typeof rm === 'string' ? rm : (rm?.title ? `${rm.name} — ${rm.title}` : rm.name));
}

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
    scale: 1.2,
    format: 'a4',
    orientation: 'portrait',
    margin: 15,
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

    // Capture current page (main results) - skip for now to avoid screenshot issues
    // pdf.addPage();
    // await captureAndAddCurrentPage(pdf, 'Hasil Assessment Utama', { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! }, defaultOptions);

    // Add detailed content pages with actual data
    pdf.addPage();
    addRiasecDetailPage(pdf, result, { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! });

    pdf.addPage();
    addOceanDetailPage(pdf, result, { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! });

    pdf.addPage();
    addViaDetailPage(pdf, result, { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! });

    pdf.addPage();
    addPersonaDetailPage(pdf, result, { pageWidth, pageHeight, contentWidth, contentHeight, margin: defaultOptions.margin! });

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
  let yPosition = 40;

  // Header decoration
  pdf.setFillColor(66, 117, 233);
  pdf.rect(0, 0, dimensions.pageWidth, 8, 'F');

  // Title
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(66, 117, 233);
  const titleText = 'Laporan Hasil Assessment';
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.text(titleText, centerX - (titleWidth / 2), yPosition);
  yPosition += 20;

  // Subtitle
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  const subtitleText = 'PetaTalenta Assessment Report';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, centerX - (subtitleWidth / 2), yPosition);
  yPosition += 30;

  // Persona title with background
  pdf.setFillColor(240, 248, 255);
  pdf.rect(dimensions.margin, yPosition - 5, dimensions.contentWidth, 25, 'F');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(66, 117, 233);
  const personaTitle = getPersonaTitle(result);
  const personaTitleWidth = pdf.getTextWidth(personaTitle);
  pdf.text(personaTitle, centerX - (personaTitleWidth / 2), yPosition + 10);
  yPosition += 40;

  // Assessment details box
  pdf.setFillColor(250, 250, 250);
  pdf.rect(dimensions.margin + 20, yPosition, dimensions.contentWidth - 40, 60, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(dimensions.margin + 20, yPosition, dimensions.contentWidth - 40, 60, 'S');

  yPosition += 15;

  // Date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 80, 80);
  const date = new Date(result.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const dateText = `Tanggal Assessment: ${date}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, centerX - (dateWidth / 2), yPosition);
  yPosition += 15;

  // ID
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(120, 120, 120);
  const idText = `ID Hasil: ${result.id}`;
  const idWidth = pdf.getTextWidth(idText);
  pdf.text(idText, centerX - (idWidth / 2), yPosition);
  yPosition += 15;

  // Assessment type
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  const typeText = 'Assessment Komprehensif: RIASEC • Big Five • VIA Character Strengths';
  const typeWidth = pdf.getTextWidth(typeText);
  pdf.text(typeText, centerX - (typeWidth / 2), yPosition);

  // Footer note
  yPosition = dimensions.pageHeight - 50;
  pdf.setFillColor(240, 248, 255);
  pdf.rect(dimensions.margin, yPosition - 5, dimensions.contentWidth, 35, 'F');
  pdf.setDrawColor(66, 117, 233);
  pdf.rect(dimensions.margin, yPosition - 5, dimensions.contentWidth, 35, 'S');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(66, 117, 233);
  const noteTitle = 'Laporan Lengkap Tersedia';
  const noteTitleWidth = pdf.getTextWidth(noteTitle);
  pdf.text(noteTitle, centerX - (noteTitleWidth / 2), yPosition + 5);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  const noteText = 'PDF ini berisi semua detail halaman assessment termasuk analisis RIASEC,';
  const noteText2 = 'Big Five (OCEAN), VIA Character Strengths, dan profil persona lengkap.';
  const noteTextWidth = pdf.getTextWidth(noteText);
  const noteText2Width = pdf.getTextWidth(noteText2);
  pdf.text(noteText, centerX - (noteTextWidth / 2), yPosition + 15);
  pdf.text(noteText2, centerX - (noteText2Width / 2), yPosition + 23);

  // Reset text color for next pages
  pdf.setTextColor(0, 0, 0);

  // Description
  const descriptionY = 160;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const description = getPersonaDescription(result);
  const lines = pdf.splitTextToSize(description, dimensions.contentWidth - 40);
  pdf.text(lines, dimensions.margin + 20, descriptionY);

  // Strengths
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Kekuatan Utama:', dimensions.margin, descriptionY + 40);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const strengths = getPersonaStrengths(result);
  strengths.slice(0, 5).forEach((strength, index) => {
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
 * Add RIASEC detail page
 */
function addRiasecDetailPage(
  pdf: jsPDF,
  result: AssessmentResult,
  dimensions: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number }
): void {
  const riasecData = result.assessment_data.riasec;
  let yPosition = dimensions.margin + 10;

  // Header decoration
  pdf.setFillColor(34, 197, 94);
  pdf.rect(0, 0, dimensions.pageWidth, 6, 'F');

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(34, 197, 94);
  pdf.text('Detail RIASEC (Holland Codes)', dimensions.margin, yPosition);
  yPosition += 25;

  // Description
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  const description = 'RIASEC adalah model yang mengidentifikasi enam tipe kepribadian kerja berdasarkan minat dan preferensi aktivitas. Model ini membantu memahami lingkungan kerja yang paling sesuai dengan kepribadian Anda.';
  const descLines = pdf.splitTextToSize(description, dimensions.contentWidth);
  pdf.text(descLines, dimensions.margin, yPosition);
  yPosition += 25;

  // Top 3 scores highlight
  const sortedRiasec = Object.entries(riasecData)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3);

  pdf.setFillColor(248, 250, 252);
  pdf.rect(dimensions.margin, yPosition - 5, dimensions.contentWidth, 25, 'F');
  pdf.setDrawColor(34, 197, 94);
  pdf.rect(dimensions.margin, yPosition - 5, dimensions.contentWidth, 25, 'S');

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(34, 197, 94);
  pdf.text('Top 3 Tipe Kepribadian Anda:', dimensions.margin + 5, yPosition + 5);

  // Map full names to codes for display
  const keyToCodeMap: { [key: string]: string } = {
    'realistic': 'REALISTIC',
    'investigative': 'INVESTIGATIVE',
    'artistic': 'ARTISTIC',
    'social': 'SOCIAL',
    'enterprising': 'ENTERPRISING',
    'conventional': 'CONVENTIONAL'
  };

  const topTypesText = sortedRiasec.map(([key, score]) => `${keyToCodeMap[key] || key.toUpperCase()}: ${score}%`).join(' • ');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text(topTypesText, dimensions.margin + 5, yPosition + 15);
  yPosition += 35;

  // Reset text color
  pdf.setTextColor(0, 0, 0);

  // RIASEC scores with color coding
  const riasecTypes = [
    { code: 'R', key: 'realistic', name: 'Realistic (Realistis)', desc: 'Menyukai aktivitas praktis, hands-on, dan bekerja dengan alat atau mesin. Cocok untuk bidang teknik, pertanian, atau pekerjaan manual.', color: [239, 68, 68] },
    { code: 'I', key: 'investigative', name: 'Investigative (Investigatif)', desc: 'Menyukai penelitian, analisis, dan pemecahan masalah kompleks. Cocok untuk bidang sains, penelitian, atau teknologi.', color: [59, 130, 246] },
    { code: 'A', key: 'artistic', name: 'Artistic (Artistik)', desc: 'Menyukai aktivitas kreatif, ekspresi diri, dan seni. Cocok untuk bidang desain, seni, atau media kreatif.', color: [168, 85, 247] },
    { code: 'S', key: 'social', name: 'Social (Sosial)', desc: 'Menyukai membantu orang lain dan bekerja dalam tim. Cocok untuk bidang pendidikan, kesehatan, atau layanan sosial.', color: [34, 197, 94] },
    { code: 'E', key: 'enterprising', name: 'Enterprising (Enterprising)', desc: 'Menyukai kepemimpinan, persuasi, dan aktivitas bisnis. Cocok untuk bidang manajemen, penjualan, atau kewirausahaan.', color: [245, 158, 11] },
    { code: 'C', key: 'conventional', name: 'Conventional (Konvensional)', desc: 'Menyukai struktur, detail, dan aktivitas administratif. Cocok untuk bidang akuntansi, administrasi, atau data entry.', color: [107, 114, 128] }
  ];

  riasecTypes.forEach((type, index) => {
    const score = riasecData[type.key as keyof typeof riasecData] || 0;
    const isTopScore = sortedRiasec.some(([key]) => key === type.key);

    // Background for top scores
    if (isTopScore) {
      pdf.setFillColor(254, 249, 195);
      pdf.rect(dimensions.margin - 5, yPosition - 3, dimensions.contentWidth + 10, 40, 'F');
    }

    // Type name and score
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(type.color[0], type.color[1], type.color[2]);
    pdf.text(`${type.name}: ${score}%`, dimensions.margin, yPosition);
    yPosition += 12;

    // Description
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const typeDescLines = pdf.splitTextToSize(type.desc, dimensions.contentWidth - 10);
    pdf.text(typeDescLines, dimensions.margin + 5, yPosition);
    yPosition += typeDescLines.length * 4 + 8;

    // Score bar visualization
    const barWidth = 120;
    const barHeight = 8;
    const barX = dimensions.margin + 5;

    // Background bar
    pdf.setFillColor(240, 240, 240);
    pdf.rect(barX, yPosition, barWidth, barHeight, 'F');

    // Score bar with gradient effect
    const scoreWidth = (score / 100) * barWidth;
    pdf.setFillColor(type.color[0], type.color[1], type.color[2]);
    pdf.rect(barX, yPosition, scoreWidth, barHeight, 'F');

    // Score percentage text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(type.color[0], type.color[1], type.color[2]);
    pdf.text(`${score}%`, barX + barWidth + 10, yPosition + 5);

    yPosition += 25;
  });

  // Reset text color
  pdf.setTextColor(0, 0, 0);
}

/**
 * Add OCEAN detail page
 */
function addOceanDetailPage(
  pdf: jsPDF,
  result: AssessmentResult,
  dimensions: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number }
): void {
  const oceanData = result.assessment_data.ocean;
  let yPosition = dimensions.margin + 10;

  // Header decoration
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, dimensions.pageWidth, 6, 'F');

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(59, 130, 246);
  pdf.text('Detail Big Five (OCEAN)', dimensions.margin, yPosition);
  yPosition += 25;

  // Description
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  const description = 'Big Five adalah model kepribadian yang mengukur lima dimensi utama kepribadian manusia. Model ini memberikan gambaran komprehensif tentang pola pikir, perasaan, dan perilaku Anda.';
  const descLines = pdf.splitTextToSize(description, dimensions.contentWidth);
  pdf.text(descLines, dimensions.margin, yPosition);
  yPosition += 25;

  // Average score highlight
  const scores = Object.values(oceanData);
  const averageScore = scores.reduce((sum, score) => sum + (score as number), 0) / scores.length;

  pdf.setFillColor(248, 250, 252);
  pdf.rect(dimensions.margin, yPosition - 5, dimensions.contentWidth, 20, 'F');
  pdf.setDrawColor(59, 130, 246);
  pdf.rect(dimensions.margin, yPosition - 5, dimensions.contentWidth, 20, 'S');

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(59, 130, 246);
  pdf.text(`Skor Rata-rata Big Five: ${Math.round(averageScore)}%`, dimensions.margin + 5, yPosition + 8);
  yPosition += 30;

  // Reset text color
  pdf.setTextColor(0, 0, 0);

  // OCEAN traits with enhanced descriptions
  const oceanTraits = [
    {
      code: 'O',
      key: 'openness',
      name: 'Openness (Keterbukaan)',
      desc: 'Keterbukaan terhadap pengalaman baru, kreativitas, dan ide-ide inovatif. Skor tinggi menunjukkan imajinasi yang kuat dan apresiasi terhadap seni.',
      color: [168, 85, 247],
      interpretation: (score: number) => score >= 60 ? 'Sangat terbuka terhadap hal baru' : score >= 40 ? 'Cukup terbuka' : 'Lebih menyukai hal yang familiar'
    },
    {
      code: 'C',
      key: 'conscientiousness',
      name: 'Conscientiousness (Kehati-hatian)',
      desc: 'Kedisiplinan, keteraturan, dan orientasi pada pencapaian tujuan. Skor tinggi menunjukkan tanggung jawab dan ketekunan yang baik.',
      color: [34, 197, 94],
      interpretation: (score: number) => score >= 60 ? 'Sangat disiplin dan terorganisir' : score >= 40 ? 'Cukup teratur' : 'Lebih fleksibel dan spontan'
    },
    {
      code: 'E',
      key: 'extraversion',
      name: 'Extraversion (Ekstraversi)',
      desc: 'Energi yang diarahkan keluar, sosiabilitas, dan assertiveness. Skor tinggi menunjukkan kecenderungan untuk aktif secara sosial.',
      color: [245, 158, 11],
      interpretation: (score: number) => score >= 60 ? 'Sangat ekstrovert dan energik' : score >= 40 ? 'Ambivert (seimbang)' : 'Lebih introvert dan reflektif'
    },
    {
      code: 'A',
      key: 'agreeableness',
      name: 'Agreeableness (Keramahan)',
      desc: 'Kecenderungan untuk kooperatif, empati, dan harmoni dalam hubungan. Skor tinggi menunjukkan sifat yang mudah bergaul.',
      color: [239, 68, 68],
      interpretation: (score: number) => score >= 60 ? 'Sangat kooperatif dan empatik' : score >= 40 ? 'Cukup ramah' : 'Lebih kompetitif dan skeptis'
    },
    {
      code: 'N',
      key: 'neuroticism',
      name: 'Neuroticism (Neurotisisme)',
      desc: 'Kecenderungan mengalami emosi negatif dan ketidakstabilan emosional. Skor rendah menunjukkan stabilitas emosional yang baik.',
      color: [107, 114, 128],
      interpretation: (score: number) => score >= 60 ? 'Cenderung mudah stres' : score >= 40 ? 'Stabilitas emosi sedang' : 'Sangat stabil secara emosional'
    }
  ];

  oceanTraits.forEach((trait, index) => {
    const score = oceanData[trait.key as keyof typeof oceanData] || 0;
    const interpretation = trait.interpretation(score);

    // Trait name and score
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(trait.color[0], trait.color[1], trait.color[2]);
    pdf.text(`${trait.name}: ${score}%`, dimensions.margin, yPosition);
    yPosition += 12;

    // Interpretation
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`→ ${interpretation}`, dimensions.margin + 5, yPosition);
    yPosition += 10;

    // Description
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const traitDescLines = pdf.splitTextToSize(trait.desc, dimensions.contentWidth - 10);
    pdf.text(traitDescLines, dimensions.margin + 5, yPosition);
    yPosition += traitDescLines.length * 4 + 8;

    // Score bar visualization
    const barWidth = 120;
    const barHeight = 8;
    const barX = dimensions.margin + 5;

    // Background bar
    pdf.setFillColor(240, 240, 240);
    pdf.rect(barX, yPosition, barWidth, barHeight, 'F');

    // Score bar
    const scoreWidth = (score / 100) * barWidth;
    pdf.setFillColor(trait.color[0], trait.color[1], trait.color[2]);
    pdf.rect(barX, yPosition, scoreWidth, barHeight, 'F');

    // Score percentage text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(trait.color[0], trait.color[1], trait.color[2]);
    pdf.text(`${score}%`, barX + barWidth + 10, yPosition + 5);

    yPosition += 25;
  });

  // Reset text color
  pdf.setTextColor(0, 0, 0);
}

/**
 * Add VIA detail page
 */
function addViaDetailPage(
  pdf: jsPDF,
  result: AssessmentResult,
  dimensions: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number }
): void {
  const viaData = result.assessment_data.viaIs;
  let yPosition = dimensions.margin + 10;

  // Header decoration
  pdf.setFillColor(168, 85, 247);
  pdf.rect(0, 0, dimensions.pageWidth, 6, 'F');

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(168, 85, 247);
  pdf.text('Detail VIA Character Strengths', dimensions.margin, yPosition);
  yPosition += 25;

  // Description
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  const description = 'VIA Character Strengths mengidentifikasi kekuatan karakter yang merupakan inti dari kepribadian positif. Ini adalah sifat-sifat terbaik dalam diri Anda yang dapat dikembangkan untuk mencapai kehidupan yang lebih bermakna.';
  const descLines = pdf.splitTextToSize(description, dimensions.contentWidth);
  pdf.text(descLines, dimensions.margin, yPosition);
  yPosition += 25;

  // Top VIA strengths
  const viaStrengths = Object.entries(viaData)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 12);

  // Top 5 highlight
  const top5 = viaStrengths.slice(0, 5);
  pdf.setFillColor(248, 250, 252);
  pdf.rect(dimensions.margin, yPosition - 5, dimensions.contentWidth, 25, 'F');
  pdf.setDrawColor(168, 85, 247);
  pdf.rect(dimensions.margin, yPosition - 5, dimensions.contentWidth, 25, 'S');

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(168, 85, 247);
  pdf.text('Top 5 Kekuatan Karakter Utama Anda:', dimensions.margin + 5, yPosition + 5);

  const top5Text = top5.map(([strength, score]) => {
    const strengthName = strength.charAt(0).toUpperCase() + strength.slice(1).replace(/([A-Z])/g, ' $1');
    return `${strengthName} (${score}%)`;
  }).join(' • ');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  const top5Lines = pdf.splitTextToSize(top5Text, dimensions.contentWidth - 10);
  pdf.text(top5Lines, dimensions.margin + 5, yPosition + 15);
  yPosition += 35;

  // Reset text color
  pdf.setTextColor(0, 0, 0);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detail Kekuatan Karakter:', dimensions.margin, yPosition);
  yPosition += 15;

  // Character strength descriptions
  const strengthDescriptions: { [key: string]: string } = {
    'creativity': 'Kemampuan untuk berpikir dengan cara yang baru dan produktif',
    'curiosity': 'Minat yang mendalam untuk mengeksplorasi dan memahami',
    'judgment': 'Kemampuan untuk berpikir kritis dan mempertimbangkan semua sisi',
    'loveOfLearning': 'Antusiasme untuk menguasai keterampilan dan pengetahuan baru',
    'perspective': 'Kemampuan untuk memberikan nasihat bijak kepada orang lain',
    'bravery': 'Keberanian untuk menghadapi tantangan dan kesulitan',
    'perseverance': 'Ketekunan untuk menyelesaikan apa yang dimulai',
    'honesty': 'Kejujuran dan keaslian dalam berbicara dan bertindak',
    'zest': 'Antusiasme dan energi dalam menjalani hidup',
    'love': 'Kemampuan untuk mencintai dan dicintai',
    'kindness': 'Kebaikan hati dan kemurahan dalam membantu orang lain',
    'socialIntelligence': 'Pemahaman yang baik tentang motivasi dan perasaan orang lain',
    'teamwork': 'Kemampuan untuk bekerja sama sebagai anggota tim',
    'fairness': 'Keadilan dalam memperlakukan semua orang dengan setara',
    'leadership': 'Kemampuan untuk memimpin dan mengorganisir aktivitas kelompok',
    'forgiveness': 'Kemampuan untuk memaafkan dan memberikan kesempatan kedua',
    'humility': 'Kerendahan hati dan tidak sombong',
    'prudence': 'Kehati-hatian dalam membuat pilihan dan keputusan',
    'selfRegulation': 'Kemampuan untuk mengatur diri sendiri dan mengendalikan emosi',
    'appreciationOfBeauty': 'Kemampuan untuk menghargai keindahan dan keunggulan',
    'gratitude': 'Rasa syukur atas hal-hal baik yang terjadi',
    'hope': 'Optimisme dan harapan untuk masa depan yang lebih baik',
    'humor': 'Kemampuan untuk membawa keceriaan dan tertawa',
    'spirituality': 'Rasa memiliki tujuan dan makna dalam hidup'
  };

  viaStrengths.forEach(([strength, score], index) => {
    const strengthName = strength.charAt(0).toUpperCase() + strength.slice(1).replace(/([A-Z])/g, ' $1');
    const description = strengthDescriptions[strength] || 'Kekuatan karakter yang positif';
    const isTop5 = index < 5;

    // Highlight top 5
    if (isTop5) {
      pdf.setFillColor(254, 249, 195);
      pdf.rect(dimensions.margin - 5, yPosition - 3, dimensions.contentWidth + 10, 30, 'F');
    }

    // Strength name and score
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(168, 85, 247);
    pdf.text(`${index + 1}. ${strengthName}: ${score}%`, dimensions.margin, yPosition);
    yPosition += 10;

    // Description
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const descLines = pdf.splitTextToSize(description, dimensions.contentWidth - 10);
    pdf.text(descLines, dimensions.margin + 5, yPosition);
    yPosition += descLines.length * 4 + 5;

    // Score bar visualization
    const barWidth = 100;
    const barHeight = 6;
    const barX = dimensions.margin + 5;

    // Background bar
    pdf.setFillColor(240, 240, 240);
    pdf.rect(barX, yPosition, barWidth, barHeight, 'F');

    // Score bar with gradient colors based on rank
    const colors = [
      [168, 85, 247], // Purple for top ranks
      [139, 69, 219],
      [124, 58, 237],
      [109, 40, 217],
      [91, 33, 182]
    ];
    const colorIndex = Math.min(index, colors.length - 1);
    const color = colors[colorIndex];

    const scoreWidth = ((score as number) / 100) * barWidth;
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(barX, yPosition, scoreWidth, barHeight, 'F');

    // Score percentage text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(`${score}%`, barX + barWidth + 8, yPosition + 4);

    yPosition += 18;
  });

  // Reset text color
  pdf.setTextColor(0, 0, 0);
}

/**
 * Add Persona detail page
 */
function addPersonaDetailPage(
  pdf: jsPDF,
  result: AssessmentResult,
  dimensions: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number }
): void {
  const persona = result.persona_profile;
  let yPosition = dimensions.margin + 10;

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detail Profil Persona', dimensions.margin, yPosition);
  yPosition += 20;

  // Check if persona profile exists
  if (!persona) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Data profil persona tidak tersedia.', dimensions.margin, yPosition);
    return;
  }

  // Persona title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const personaTitle = getPersonaTitle(result);
  pdf.text(`Persona: ${personaTitle}`, dimensions.margin, yPosition);
  yPosition += 15;

  // Archetype
  if (persona.archetype) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Archetype: ${persona.archetype}`, dimensions.margin, yPosition);
    yPosition += 15;
  }

  // Description
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Deskripsi:', dimensions.margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const description = getPersonaDescription(result);
  const descLines = pdf.splitTextToSize(description, dimensions.contentWidth);
  pdf.text(descLines, dimensions.margin, yPosition);
  yPosition += descLines.length * 5 + 15;

  // Strengths
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Kekuatan Utama:', dimensions.margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const strengths = getPersonaStrengths(result);
  strengths.forEach((strength) => {
    pdf.text(`• ${strength}`, dimensions.margin + 5, yPosition);
    yPosition += 8;
  });
  yPosition += 10;

  // Career recommendations
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Rekomendasi Karir:', dimensions.margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const careerRecommendations = getCareerRecommendations(result);
  careerRecommendations.slice(0, 8).forEach((career) => {
    const suffix = typeof career.matchPercentage === 'number' ? ` (${career.matchPercentage}% match)` : '';
    pdf.text(`• ${career.careerName}${suffix}`, dimensions.margin + 5, yPosition);
    yPosition += 8;
  });
  yPosition += 10;

  // Role models
  const roleModels = getRoleModels(result);
  if (roleModels.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Role Model:', dimensions.margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const roleModelText = roleModels.join(', ');
    const roleModelLines = pdf.splitTextToSize(roleModelText, dimensions.contentWidth);
    pdf.text(roleModelLines, dimensions.margin + 5, yPosition);
  }
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
