'use client';

import { useEffect } from 'react';
import { mockAssessmentResults } from '../../data/mockAssessmentResults';

export default function DemoDataInitializer() {
  useEffect(() => {
    // Initialize demo data in localStorage if not already present
    const initializeDemoData = () => {
      console.log('DemoDataInitializer: Checking for demo data...');
      
      // Check if demo results exist
      const demoResult1 = localStorage.getItem('assessment-result-result-001');
      const demoResult2 = localStorage.getItem('assessment-result-result-002');
      
      if (!demoResult1 || !demoResult2) {
        console.log('DemoDataInitializer: Initializing demo assessment results...');
        
        // Save demo results to localStorage
        mockAssessmentResults.forEach(result => {
          const key = `assessment-result-${result.id}`;
          localStorage.setItem(key, JSON.stringify(result));
          console.log(`DemoDataInitializer: Saved ${result.id} - ${result.persona_profile.title}`);
        });
        
        // Add demo results to assessment history if not present
        const existingHistory = JSON.parse(localStorage.getItem('assessment-history') || '[]');
        const hasDemo1 = existingHistory.some(item => item.resultId === 'result-001');
        const hasDemo2 = existingHistory.some(item => item.resultId === 'result-002');
        
        if (!hasDemo1 || !hasDemo2) {
          const demoHistoryItems = mockAssessmentResults.map((result, index) => ({
            id: Date.now() + index,
            nama: result.persona_profile.title,
            tipe: "Personality Assessment",
            tanggal: new Date(result.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            status: "Selesai",
            resultId: result.id
          }));
          
          // Add demo items to history (but don't duplicate)
          demoHistoryItems.forEach(demoItem => {
            const exists = existingHistory.some(item => item.resultId === demoItem.resultId);
            if (!exists) {
              existingHistory.push(demoItem);
            }
          });
          
          localStorage.setItem('assessment-history', JSON.stringify(existingHistory));
          console.log('DemoDataInitializer: Demo history items added');
        }
        
        console.log('✅ DemoDataInitializer: Demo data initialization complete');
      } else {
        console.log('DemoDataInitializer: Demo data already exists');
      }
    };
    
    // Run initialization after a short delay to ensure localStorage is available
    const timer = setTimeout(initializeDemoData, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything
  return null;
}
