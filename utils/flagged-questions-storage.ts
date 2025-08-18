/**
 * Flagged Questions Storage Utilities
 * Handles secure storage and retrieval of flagged questions
 */

export interface FlaggedQuestionsData {
  flaggedQuestions: Record<number, boolean>;
  lastUpdated: number;
  version: string;
}

const STORAGE_KEY = 'assessment-flagged-questions';
const STORAGE_VERSION = '1.0.0';

/**
 * Simple encryption/decryption using base64 encoding
 * TODO: Replace with proper AES encryption in the future
 */
function simpleEncrypt(data: string): string {
  try {
    return btoa(encodeURIComponent(data));
  } catch (error) {
    console.warn('Failed to encrypt data, using plain text:', error);
    return data;
  }
}

function simpleDecrypt(encryptedData: string): string {
  try {
    return decodeURIComponent(atob(encryptedData));
  } catch (error) {
    console.warn('Failed to decrypt data, assuming plain text:', error);
    return encryptedData;
  }
}

/**
 * Save flagged questions to encrypted localStorage
 */
export function saveFlaggedQuestions(flaggedQuestions: Record<number, boolean>): void {
  try {
    const data: FlaggedQuestionsData = {
      flaggedQuestions,
      lastUpdated: Date.now(),
      version: STORAGE_VERSION
    };

    const jsonString = JSON.stringify(data);
    const encryptedData = simpleEncrypt(jsonString);
    
    localStorage.setItem(STORAGE_KEY, encryptedData);
    console.log('Flagged questions saved to encrypted storage');
  } catch (error) {
    console.error('Failed to save flagged questions:', error);
    
    // Fallback to unencrypted storage
    try {
      const data: FlaggedQuestionsData = {
        flaggedQuestions,
        lastUpdated: Date.now(),
        version: STORAGE_VERSION
      };
      localStorage.setItem(`${STORAGE_KEY}-fallback`, JSON.stringify(data));
      console.log('Flagged questions saved to fallback storage');
    } catch (fallbackError) {
      console.error('Failed to save flagged questions to fallback storage:', fallbackError);
    }
  }
}

/**
 * Load flagged questions from encrypted localStorage
 */
export function loadFlaggedQuestions(): Record<number, boolean> {
  try {
    // Try encrypted storage first
    const encryptedData = localStorage.getItem(STORAGE_KEY);
    if (encryptedData) {
      const jsonString = simpleDecrypt(encryptedData);
      const data: FlaggedQuestionsData = JSON.parse(jsonString);
      
      // Validate data structure
      if (data.flaggedQuestions && typeof data.flaggedQuestions === 'object') {
        console.log('Flagged questions loaded from encrypted storage');
        return data.flaggedQuestions;
      }
    }

    // Try fallback storage
    const fallbackData = localStorage.getItem(`${STORAGE_KEY}-fallback`);
    if (fallbackData) {
      const data: FlaggedQuestionsData = JSON.parse(fallbackData);
      if (data.flaggedQuestions && typeof data.flaggedQuestions === 'object') {
        console.log('Flagged questions loaded from fallback storage');
        return data.flaggedQuestions;
      }
    }

    console.log('No flagged questions found in storage');
    return {};
  } catch (error) {
    console.error('Failed to load flagged questions:', error);
    return {};
  }
}

/**
 * Clear all flagged questions from storage
 */
export function clearFlaggedQuestions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}-fallback`);
    console.log('Flagged questions cleared from storage');
  } catch (error) {
    console.error('Failed to clear flagged questions:', error);
  }
}

/**
 * Migrate unencrypted flagged questions to encrypted storage
 */
export function migrateFlaggedQuestionsToEncrypted(): void {
  try {
    const fallbackData = localStorage.getItem(`${STORAGE_KEY}-fallback`);
    const encryptedData = localStorage.getItem(STORAGE_KEY);
    
    // If we have fallback data but no encrypted data, migrate
    if (fallbackData && !encryptedData) {
      const data: FlaggedQuestionsData = JSON.parse(fallbackData);
      saveFlaggedQuestions(data.flaggedQuestions);
      console.log('Migrated flagged questions to encrypted storage');
    }
  } catch (error) {
    console.error('Failed to migrate flagged questions:', error);
  }
}

/**
 * Get flagged questions statistics
 */
export function getFlaggedQuestionsStats(): {
  totalFlagged: number;
  lastUpdated: Date | null;
  version: string;
} {
  try {
    const encryptedData = localStorage.getItem(STORAGE_KEY);
    const fallbackData = localStorage.getItem(`${STORAGE_KEY}-fallback`);
    
    let data: FlaggedQuestionsData | null = null;
    
    if (encryptedData) {
      const jsonString = simpleDecrypt(encryptedData);
      data = JSON.parse(jsonString);
    } else if (fallbackData) {
      data = JSON.parse(fallbackData);
    }
    
    if (data) {
      const totalFlagged = Object.values(data.flaggedQuestions).filter(Boolean).length;
      return {
        totalFlagged,
        lastUpdated: new Date(data.lastUpdated),
        version: data.version
      };
    }
    
    return {
      totalFlagged: 0,
      lastUpdated: null,
      version: STORAGE_VERSION
    };
  } catch (error) {
    console.error('Failed to get flagged questions stats:', error);
    return {
      totalFlagged: 0,
      lastUpdated: null,
      version: STORAGE_VERSION
    };
  }
}
