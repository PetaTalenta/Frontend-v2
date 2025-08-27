import html2canvas from 'html2canvas';

/**
 * Check if screenshot functionality is supported in current browser
 */
export function isScreenshotSupported(): boolean {
  try {
    // Check if html2canvas is available
    if (typeof html2canvas !== 'function') return false;

    // Check if canvas is supported
    const canvas = document.createElement('canvas');
    if (!canvas.getContext || !canvas.getContext('2d')) return false;

    // Check if blob is supported
    if (!canvas.toBlob) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Get browser-specific limitations and recommendations
 */
export function getBrowserLimitations(): {
  maxWidth: number;
  maxHeight: number;
  recommendedScale: number;
  warnings: string[];
} {
  const userAgent = navigator.userAgent.toLowerCase();
  const warnings: string[] = [];

  let maxWidth = 32767; // Default canvas limit
  let maxHeight = 32767;
  let recommendedScale = 2;

  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    maxWidth = 16384;
    maxHeight = 16384;
    recommendedScale = 1.5;
    warnings.push('Safari memiliki batasan ukuran canvas yang lebih kecil');
  }

  if (userAgent.includes('mobile')) {
    maxWidth = 8192;
    maxHeight = 8192;
    recommendedScale = 1;
    warnings.push('Perangkat mobile memiliki keterbatasan memory untuk screenshot besar');
  }

  return { maxWidth, maxHeight, recommendedScale, warnings };
}

export interface ScreenshotOptions {
  quality?: number;
  scale?: number;
  backgroundColor?: string;
  useCORS?: boolean;
  allowTaint?: boolean;
  width?: number;
  height?: number;
}

/**
 * Capture screenshot of a specific element
 */
export async function captureElementScreenshot(
  element: HTMLElement,
  options: ScreenshotOptions = {}
): Promise<Blob> {
  const defaultOptions: ScreenshotOptions = {
    quality: 1,
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: false,
    ...options
  };

  try {
    const canvas = await html2canvas(element, {
      scale: defaultOptions.scale,
      backgroundColor: defaultOptions.backgroundColor,
      useCORS: defaultOptions.useCORS,
      allowTaint: defaultOptions.allowTaint,
      width: defaultOptions.width,
      height: defaultOptions.height,
      logging: false,
      removeContainer: true,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Ensure all images are loaded in the cloned document
        const images = clonedDoc.querySelectorAll('img');
        images.forEach((img) => {
          if (img.src && !img.complete) {
            img.style.display = 'none';
          }
        });
      }
    });

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob!);
        },
        'image/png',
        defaultOptions.quality
      );
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw new Error('Failed to capture screenshot');
  }
}

/**
 * Capture screenshot of the entire page
 */
export async function capturePageScreenshot(
  options: ScreenshotOptions = {}
): Promise<Blob> {
  // Use document.documentElement for full page capture including scrollable content
  const element = document.documentElement;

  // Get the full page dimensions
  const fullHeight = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );

  const fullWidth = Math.max(
    document.body.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.clientWidth,
    document.documentElement.scrollWidth,
    document.documentElement.offsetWidth
  );

  return captureElementScreenshot(element, {
    ...options,
    width: fullWidth,
    height: fullHeight
  });
}

/**
 * Capture multiple elements as separate screenshots
 */
export async function captureMultipleScreenshots(
  elements: HTMLElement[],
  options: ScreenshotOptions = {}
): Promise<Blob[]> {
  const screenshots: Blob[] = [];
  
  for (const element of elements) {
    try {
      const screenshot = await captureElementScreenshot(element, options);
      screenshots.push(screenshot);
    } catch (error) {
      console.error('Error capturing screenshot for element:', error);
      // Continue with other elements even if one fails
    }
  }
  
  return screenshots;
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create a ZIP file containing multiple screenshots
 */
export async function createScreenshotZip(
  screenshots: { blob: Blob; filename: string }[]
): Promise<Blob> {
  // For now, we'll return the first screenshot
  // In a real implementation, you might want to use JSZip library
  if (screenshots.length > 0) {
    return screenshots[0].blob;
  }
  throw new Error('No screenshots to zip');
}

/**
 * Prepare element for screenshot by ensuring it's visible and styled properly
 */
export function prepareElementForScreenshot(element: HTMLElement): () => void {
  const originalStyles = {
    position: element.style.position,
    visibility: element.style.visibility,
    opacity: element.style.opacity,
    transform: element.style.transform,
    zIndex: element.style.zIndex
  };

  // Ensure element is visible and properly positioned
  element.style.position = 'relative';
  element.style.visibility = 'visible';
  element.style.opacity = '1';
  element.style.transform = 'none';
  element.style.zIndex = '1';

  // Return cleanup function
  return () => {
    Object.entries(originalStyles).forEach(([key, value]) => {
      if (value) {
        (element.style as any)[key] = value;
      } else {
        element.style.removeProperty(key);
      }
    });
  };
}
