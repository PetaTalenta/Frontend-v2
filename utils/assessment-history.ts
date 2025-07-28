/**
 * Assessment History Management Utilities
 * Prevents duplicate entries and manages assessment history consistently
 */

export interface AssessmentHistoryItem {
  id: number;
  nama: string;
  tipe: string;
  tanggal: string;
  status: "Selesai" | "Belum Selesai";
  resultId: string | null;
}

/**
 * Add assessment to history with duplicate prevention
 */
export function addToAssessmentHistory(item: AssessmentHistoryItem): void {
  try {
    console.log('Assessment History: Adding item with resultId:', item.resultId);
    
    // Get existing history
    const existingHistory: AssessmentHistoryItem[] = JSON.parse(
      localStorage.getItem('assessment-history') || '[]'
    );

    // Check for duplicates based on resultId (if provided)
    if (item.resultId) {
      const existingIndex = existingHistory.findIndex(
        existing => existing.resultId === item.resultId
      );
      
      if (existingIndex !== -1) {
        console.log('Assessment History: Duplicate found, updating existing entry');
        // Update existing entry instead of adding duplicate
        existingHistory[existingIndex] = {
          ...existingHistory[existingIndex],
          ...item,
          // Keep the original ID to maintain consistency
          id: existingHistory[existingIndex].id
        };
        localStorage.setItem('assessment-history', JSON.stringify(existingHistory));
        return;
      }
    }

    // Check for recent duplicates based on timestamp and name (fallback)
    const now = Date.now();
    const recentDuplicate = existingHistory.find(existing => {
      const timeDiff = now - existing.id;
      return timeDiff < 5000 && // Within 5 seconds
             existing.nama === item.nama &&
             existing.status === item.status;
    });

    if (recentDuplicate) {
      console.log('Assessment History: Recent duplicate detected, skipping addition');
      return;
    }

    // Add new item to the beginning of the array
    existingHistory.unshift(item);
    
    // Limit history to prevent excessive storage
    const maxHistoryItems = 50;
    if (existingHistory.length > maxHistoryItems) {
      existingHistory.splice(maxHistoryItems);
    }

    // Save updated history
    localStorage.setItem('assessment-history', JSON.stringify(existingHistory));
    console.log('Assessment History: Item added successfully');
    
  } catch (error) {
    console.error('Assessment History: Error adding item:', error);
  }
}

/**
 * Get assessment history with deduplication
 */
export function getAssessmentHistory(): AssessmentHistoryItem[] {
  try {
    const history: AssessmentHistoryItem[] = JSON.parse(
      localStorage.getItem('assessment-history') || '[]'
    );

    // Remove duplicates based on resultId
    const deduplicatedHistory = history.filter((item, index, self) => {
      if (!item.resultId) return true; // Keep items without resultId
      
      return index === self.findIndex(other => 
        other.resultId === item.resultId
      );
    });

    // Sort by date (newest first)
    deduplicatedHistory.sort((a, b) => b.id - a.id);

    return deduplicatedHistory;
  } catch (error) {
    console.error('Assessment History: Error getting history:', error);
    return [];
  }
}

/**
 * Clear assessment history
 */
export function clearAssessmentHistory(): void {
  try {
    localStorage.removeItem('assessment-history');
    console.log('Assessment History: History cleared');
  } catch (error) {
    console.error('Assessment History: Error clearing history:', error);
  }
}

/**
 * Remove specific assessment from history
 */
export function removeFromAssessmentHistory(resultId: string): void {
  try {
    const existingHistory: AssessmentHistoryItem[] = JSON.parse(
      localStorage.getItem('assessment-history') || '[]'
    );

    const filteredHistory = existingHistory.filter(
      item => item.resultId !== resultId
    );

    localStorage.setItem('assessment-history', JSON.stringify(filteredHistory));
    console.log('Assessment History: Item removed with resultId:', resultId);
  } catch (error) {
    console.error('Assessment History: Error removing item:', error);
  }
}

/**
 * Check if assessment already exists in history
 */
export function assessmentExistsInHistory(resultId: string): boolean {
  try {
    const history: AssessmentHistoryItem[] = JSON.parse(
      localStorage.getItem('assessment-history') || '[]'
    );

    return history.some(item => item.resultId === resultId);
  } catch (error) {
    console.error('Assessment History: Error checking existence:', error);
    return false;
  }
}
