/**
 * Optimization Demo Page
 * Demonstrates all implemented performance optimizations
 */

import OptimizationDemo from '../../components/demo/OptimizationDemo';

export const metadata = {
  title: 'Performance Optimization Demo - PetaTalenta',
  description: 'Demonstrasi implementasi CDN, RUM, A/B Testing, dan Web Workers untuk optimasi performance',
  keywords: 'performance, optimization, CDN, RUM, A/B testing, web workers, comlink',
};

export default function OptimizationDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <OptimizationDemo />
    </div>
  );
}
