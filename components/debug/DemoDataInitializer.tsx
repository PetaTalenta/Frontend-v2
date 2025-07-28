'use client';

import { useEffect } from 'react';

export default function DemoDataInitializer() {
  useEffect(() => {
    // Demo data initialization has been removed
    // Assessment history is now fetched from API only
    console.log('DemoDataInitializer: Mock data initialization disabled - using API data only');
  }, []);

  // This component doesn't render anything
  return null;
}
