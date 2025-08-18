/**
 * Comlink Worker Manager
 * Simplified worker management using Comlink
 */

import * as Comlink from 'comlink';

// Types for the assessment calculator
interface AssessmentCalculator {
  calculateAllScores(
    answers: Record<number, number | null>, 
    questions: Question[],
    onProgress?: (progress: number, stage: string) => void
  ): Promise<AssessmentScores>;
  
  calculateRiasecScores(
    answers: Record<number, number | null>, 
    questions: Question[],
    onProgress?: (progress: number, stage: string) => void
  ): Promise<RiasecScores>;
  
  calculateOceanScores(
    answers: Record<number, number | null>, 
    questions: Question[],
    onProgress?: (progress: number, stage: string) => void
  ): Promise<OceanScores>;
  
  calculateViaScores(
    answers: Record<number, number | null>, 
    questions: Question[],
    onProgress?: (progress: number, stage: string) => void
  ): Promise<ViaScores>;
  
  calculateIndustryScores(
    scores: { riasec: RiasecScores; ocean: OceanScores; viaIs: ViaScores },
    onProgress?: (progress: number, stage: string) => void
  ): Promise<IndustryScores>;
  
  validateAnswers(
    answers: Record<number, number | null>, 
    questions: Question[]
  ): Promise<ValidationResult>;
  
  getStatistics(): any;
}

interface AssessmentScores {
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
  industryScore: IndustryScores;
}

interface RiasecScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

interface OceanScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface ViaScores {
  creativity: number;
  curiosity: number;
  judgment: number;
  loveOfLearning: number;
  perspective: number;
  bravery: number;
  perseverance: number;
  honesty: number;
  zest: number;
  love: number;
  kindness: number;
  socialIntelligence: number;
  teamwork: number;
  fairness: number;
  leadership: number;
  forgiveness: number;
  humility: number;
  prudence: number;
  selfRegulation: number;
  appreciationOfBeauty: number;
  gratitude: number;
  hope: number;
  humor: number;
  spirituality: number;
}

interface IndustryScores {
  teknologi: number;
  kesehatan: number;
  keuangan: number;
  pendidikan: number;
  rekayasa: number;
  pemasaran: number;
  hukum: number;
  kreatif: number;
  media: number;
  penjualan: number;
  sains: number;
  manufaktur: number;
  agrikultur: number;
  pemerintahan: number;
  konsultasi: number;
  pariwisata: number;
  logistik: number;
  energi: number;
  sosial: number;
  olahraga: number;
  properti: number;
  kuliner: number;
  perdagangan: number;
  telekomunikasi: number;
}

interface Question {
  id: number;
  text: string;
  category: string;
  subcategory?: string;
  isReversed?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  missingQuestions: number[];
  totalQuestions: number;
  answeredQuestions: number;
}

interface WorkerInstance {
  calculator: Comlink.Remote<AssessmentCalculator>;
  worker: Worker;
  busy: boolean;
  lastUsed: number;
  taskCount: number;
}

class ComlinkWorkerManager {
  private workers: Map<string, WorkerInstance> = new Map();
  private maxWorkers: number = 2; // Reduced for Comlink simplicity
  private isInitialized = false;

  /**
   * Initialize Comlink worker manager
   */
  async initialize() {
    if (this.isInitialized) return;

    // Check if Web Workers are supported
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers not supported in this environment');
      return;
    }

    // Create initial worker pool
    await this.createWorkerPool();
    
    // Setup cleanup interval
    setInterval(() => this.cleanupIdleWorkers(), 60000);

    this.isInitialized = true;
    console.log('Comlink Worker Manager initialized with', this.workers.size, 'workers');
  }

  /**
   * Create worker pool
   */
  private async createWorkerPool() {
    const workerCount = Math.min(this.maxWorkers, navigator.hardwareConcurrency || 2);
    
    for (let i = 0; i < workerCount; i++) {
      await this.createWorker(`comlink_worker_${i}`);
    }
  }

  /**
   * Create a new Comlink worker
   */
  private async createWorker(id: string): Promise<void> {
    try {
      const worker = new Worker(
        new URL('../workers/assessment-worker-comlink.ts', import.meta.url),
        { type: 'module' }
      );

      // Wrap worker with Comlink
      const calculator = Comlink.wrap<AssessmentCalculator>(worker);

      const workerInstance: WorkerInstance = {
        calculator,
        worker,
        busy: false,
        lastUsed: Date.now(),
        taskCount: 0
      };

      // Setup worker error handler
      worker.onerror = (error) => {
        console.error(`Comlink worker ${id} error:`, error);
        this.handleWorkerError(id, error);
      };

      this.workers.set(id, workerInstance);
      console.log(`Comlink worker ${id} created successfully`);

    } catch (error) {
      console.error(`Failed to create Comlink worker ${id}:`, error);
    }
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(workerId: string, error: ErrorEvent) {
    const workerInstance = this.workers.get(workerId);
    if (!workerInstance) return;

    // Mark worker as not busy
    workerInstance.busy = false;

    // Recreate worker
    this.recreateWorker(workerId);
  }

  /**
   * Recreate a failed worker
   */
  private async recreateWorker(workerId: string) {
    const workerInstance = this.workers.get(workerId);
    if (workerInstance) {
      workerInstance.worker.terminate();
      this.workers.delete(workerId);
    }

    await this.createWorker(workerId);
  }

  /**
   * Get available worker
   */
  private getAvailableWorker(): WorkerInstance | null {
    for (const [id, worker] of this.workers) {
      if (!worker.busy) {
        return worker;
      }
    }
    return null;
  }

  /**
   * Execute calculation with automatic worker selection
   */
  private async executeWithWorker<T>(
    operation: (calculator: Comlink.Remote<AssessmentCalculator>) => Promise<T>
  ): Promise<T> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Fallback to main thread if no workers available
    if (this.workers.size === 0) {
      return this.executeInMainThread(operation);
    }

    const worker = this.getAvailableWorker();
    if (!worker) {
      // All workers busy, wait for one to become available
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.executeWithWorker(operation);
    }

    // Mark worker as busy
    worker.busy = true;
    worker.taskCount++;
    worker.lastUsed = Date.now();

    try {
      const result = await operation(worker.calculator);
      return result;
    } finally {
      // Mark worker as not busy
      worker.busy = false;
    }
  }

  /**
   * Execute in main thread (fallback)
   */
  private async executeInMainThread<T>(
    operation: (calculator: Comlink.Remote<AssessmentCalculator>) => Promise<T>
  ): Promise<T> {
    console.warn('Executing calculation in main thread (Comlink fallback)');
    
    // Import the calculation functions dynamically
    const { calculateAllScores, validateAnswers } = await import('./assessment-calculations');
    const { calculateIndustryScores } = await import('./industry-scoring');

    // Create a mock calculator that matches the interface
    const mockCalculator = {
      calculateAllScores: async (answers: Record<number, number | null>) => {
        return calculateAllScores(answers);
      },
      validateAnswers: async (answers: Record<number, number | null>) => {
        return validateAnswers(answers);
      },
      calculateIndustryScores: async (scores: any) => {
        return calculateIndustryScores(scores);
      }
    } as any;

    return operation(mockCalculator);
  }

  /**
   * Calculate all assessment scores
   */
  async calculateAllScores(
    answers: Record<number, number | null>,
    questions: Question[],
    onProgress?: (progress: number, stage: string) => void
  ): Promise<AssessmentScores> {
    return this.executeWithWorker(async (calculator) => {
      if (onProgress) {
        // Wrap progress callback for Comlink
        const progressProxy = Comlink.proxy(onProgress);
        return calculator.calculateAllScores(answers, questions, progressProxy);
      } else {
        return calculator.calculateAllScores(answers, questions);
      }
    });
  }

  /**
   * Calculate RIASEC scores
   */
  async calculateRiasecScores(
    answers: Record<number, number | null>,
    questions: Question[],
    onProgress?: (progress: number, stage: string) => void
  ): Promise<RiasecScores> {
    return this.executeWithWorker(async (calculator) => {
      if (onProgress) {
        const progressProxy = Comlink.proxy(onProgress);
        return calculator.calculateRiasecScores(answers, questions, progressProxy);
      } else {
        return calculator.calculateRiasecScores(answers, questions);
      }
    });
  }

  /**
   * Calculate industry scores
   */
  async calculateIndustryScores(
    scores: { riasec: RiasecScores; ocean: OceanScores; viaIs: ViaScores },
    onProgress?: (progress: number, stage: string) => void
  ): Promise<IndustryScores> {
    return this.executeWithWorker(async (calculator) => {
      if (onProgress) {
        const progressProxy = Comlink.proxy(onProgress);
        return calculator.calculateIndustryScores(scores, progressProxy);
      } else {
        return calculator.calculateIndustryScores(scores);
      }
    });
  }

  /**
   * Validate answers
   */
  async validateAnswers(
    answers: Record<number, number | null>,
    questions: Question[]
  ): Promise<ValidationResult> {
    return this.executeWithWorker(async (calculator) => {
      return calculator.validateAnswers(answers, questions);
    });
  }

  /**
   * Get worker statistics
   */
  async getWorkerStatistics() {
    const workers = Array.from(this.workers.values());
    
    // Get statistics from first available worker
    let calculatorStats = null;
    if (workers.length > 0) {
      try {
        calculatorStats = await workers[0].calculator.getStatistics();
      } catch (error) {
        console.warn('Failed to get calculator statistics:', error);
      }
    }

    return {
      totalWorkers: workers.length,
      busyWorkers: workers.filter(w => w.busy).length,
      totalTasksProcessed: workers.reduce((sum, w) => sum + w.taskCount, 0),
      averageTasksPerWorker: workers.length > 0 ? 
        workers.reduce((sum, w) => sum + w.taskCount, 0) / workers.length : 0,
      calculatorStats
    };
  }

  /**
   * Cleanup idle workers
   */
  private cleanupIdleWorkers() {
    const now = Date.now();
    const idleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [id, worker] of this.workers) {
      if (!worker.busy && (now - worker.lastUsed) > idleThreshold) {
        // Keep at least one worker
        if (this.workers.size > 1) {
          worker.worker.terminate();
          this.workers.delete(id);
          console.log(`Terminated idle Comlink worker: ${id}`);
        }
      }
    }
  }

  /**
   * Terminate all workers
   */
  terminate() {
    for (const [id, worker] of this.workers) {
      worker.worker.terminate();
    }
    this.workers.clear();
    this.isInitialized = false;
    console.log('All Comlink workers terminated');
  }
}

// Global Comlink worker manager instance
export const comlinkWorkerManager = new ComlinkWorkerManager();

/**
 * Calculate assessment scores using Comlink Workers
 */
export async function calculateScoresWithComlink(
  answers: Record<number, number | null>,
  questions: Question[],
  onProgress?: (progress: number, stage: string) => void
): Promise<AssessmentScores> {
  return comlinkWorkerManager.calculateAllScores(answers, questions, onProgress);
}

/**
 * Calculate industry scores using Comlink Workers
 */
export async function calculateIndustryScoresWithComlink(
  scores: { riasec: RiasecScores; ocean: OceanScores; viaIs: ViaScores },
  onProgress?: (progress: number, stage: string) => void
): Promise<IndustryScores> {
  return comlinkWorkerManager.calculateIndustryScores(scores, onProgress);
}

/**
 * Validate answers using Comlink Workers
 */
export async function validateAnswersWithComlink(
  answers: Record<number, number | null>,
  questions: Question[]
): Promise<ValidationResult> {
  return comlinkWorkerManager.validateAnswers(answers, questions);
}

/**
 * Initialize Comlink workers
 */
export async function initializeComlinkWorkers() {
  await comlinkWorkerManager.initialize();
}

/**
 * Get Comlink worker statistics
 */
export async function getComlinkWorkerStatistics() {
  return comlinkWorkerManager.getWorkerStatistics();
}

// Auto-initialize on import in browser (removed to prevent SSR issues)
// Comlink workers will be initialized manually from components
