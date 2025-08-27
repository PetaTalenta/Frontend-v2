/**
 * Web Worker Manager
 * Manages worker thread pool and communication
 */

interface WorkerTask {
  id: string;
  type: string;
  payload: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface WorkerInstance {
  worker: Worker;
  busy: boolean;
  lastUsed: number;
  taskCount: number;
}

class WorkerManager {
  private workers: Map<string, WorkerInstance> = new Map();
  private taskQueue: WorkerTask[] = [];
  private maxWorkers: number = 4;
  private workerTimeout: number = 30000; // 30 seconds
  private isInitialized = false;

  /**
   * Initialize worker manager
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
    setInterval(() => this.cleanupIdleWorkers(), 60000); // Every minute

    this.isInitialized = true;
    console.log('Worker Manager initialized with', this.workers.size, 'workers');
  }

  /**
   * Create worker pool
   */
  private async createWorkerPool() {
    const workerCount = Math.min(this.maxWorkers, navigator.hardwareConcurrency || 2);
    
    for (let i = 0; i < workerCount; i++) {
      await this.createWorker(`worker_${i}`);
    }
  }

  /**
   * Create a new worker
   */
  private async createWorker(id: string): Promise<void> {
    try {
      const worker = new Worker(new URL('../workers/assessment-worker.ts', import.meta.url), {
        type: 'module'
      });

      const workerInstance: WorkerInstance = {
        worker,
        busy: false,
        lastUsed: Date.now(),
        taskCount: 0
      };

      // Setup worker message handler
      worker.onmessage = (event) => {
        this.handleWorkerMessage(id, event);
      };

      // Setup worker error handler
      worker.onerror = (error) => {
        console.error(`Worker ${id} error:`, error);
        this.handleWorkerError(id, error);
      };

      this.workers.set(id, workerInstance);
      console.log(`Worker ${id} created successfully`);

    } catch (error) {
      console.error(`Failed to create worker ${id}:`, error);
    }
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(workerId: string, event: MessageEvent) {
    const { type, payload, requestId } = event.data;
    const workerInstance = this.workers.get(workerId);

    if (!workerInstance) return;

    // Mark worker as not busy
    workerInstance.busy = false;
    workerInstance.lastUsed = Date.now();

    // Find and resolve the corresponding task
    const taskIndex = this.taskQueue.findIndex(task => task.id === requestId);
    if (taskIndex !== -1) {
      const task = this.taskQueue[taskIndex];
      this.taskQueue.splice(taskIndex, 1);

      if (type === 'CALCULATION_COMPLETE') {
        task.resolve(payload);
      } else if (type === 'ERROR') {
        task.reject(new Error(payload.message));
      }
    }

    // Process next task in queue
    this.processNextTask();
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(workerId: string, error: ErrorEvent) {
    const workerInstance = this.workers.get(workerId);
    if (!workerInstance) return;

    // Mark worker as not busy
    workerInstance.busy = false;

    // Reject any pending tasks for this worker
    const pendingTasks = this.taskQueue.filter(task => task.id.startsWith(workerId));
    pendingTasks.forEach(task => {
      task.reject(new Error(`Worker error: ${error.message}`));
    });

    // Remove failed tasks from queue
    this.taskQueue = this.taskQueue.filter(task => !task.id.startsWith(workerId));

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
   * Execute task in worker
   */
  async executeTask<T>(type: string, payload: any, timeout: number = this.workerTimeout): Promise<T> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Fallback to main thread if workers not available
    if (this.workers.size === 0) {
      return this.executeInMainThread<T>(type, payload);
    }

    return new Promise<T>((resolve, reject) => {
      const taskId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const task: WorkerTask = {
        id: taskId,
        type,
        payload,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Add timeout
      const timeoutId = setTimeout(() => {
        const taskIndex = this.taskQueue.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          this.taskQueue.splice(taskIndex, 1);
          reject(new Error(`Task timeout after ${timeout}ms`));
        }
      }, timeout);

      // Override resolve to clear timeout
      const originalResolve = task.resolve;
      task.resolve = (result: any) => {
        clearTimeout(timeoutId);
        originalResolve(result);
      };

      // Override reject to clear timeout
      const originalReject = task.reject;
      task.reject = (error: Error) => {
        clearTimeout(timeoutId);
        originalReject(error);
      };

      this.taskQueue.push(task);
      this.processNextTask();
    });
  }

  /**
   * Process next task in queue
   */
  private processNextTask() {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.getAvailableWorker();
    if (!availableWorker) return;

    const task = this.taskQueue.shift();
    if (!task) return;

    // Mark worker as busy
    availableWorker.busy = true;
    availableWorker.taskCount++;

    // Send task to worker
    availableWorker.worker.postMessage({
      type: task.type,
      payload: task.payload,
      requestId: task.id
    });
  }

  /**
   * Execute task in main thread (fallback)
   */
  private async executeInMainThread<T>(type: string, payload: any): Promise<T> {
    console.warn('Executing task in main thread (worker fallback)');
    
    // Import the calculation functions dynamically
    const { calculateAllScores, validateAnswers } = await import('./assessment-calculations');
    const { calculateIndustryScores } = await import('./industry-scoring');

    switch (type) {
      case 'CALCULATE_SCORES':
        return calculateAllScores(payload.answers) as T;
      
      case 'CALCULATE_INDUSTRY':
        return calculateIndustryScores(payload.scores) as T;
      
      case 'VALIDATE_ANSWERS':
        return validateAnswers(payload.answers) as T;
      
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
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
          console.log(`Terminated idle worker: ${id}`);
        }
      }
    }
  }

  /**
   * Get worker statistics
   */
  getStatistics() {
    const workers = Array.from(this.workers.values());
    
    return {
      totalWorkers: workers.length,
      busyWorkers: workers.filter(w => w.busy).length,
      queuedTasks: this.taskQueue.length,
      totalTasksProcessed: workers.reduce((sum, w) => sum + w.taskCount, 0),
      averageTasksPerWorker: workers.length > 0 ? 
        workers.reduce((sum, w) => sum + w.taskCount, 0) / workers.length : 0
    };
  }

  /**
   * Terminate all workers
   */
  terminate() {
    for (const [id, worker] of this.workers) {
      worker.worker.terminate();
    }
    this.workers.clear();
    this.taskQueue = [];
    this.isInitialized = false;
    console.log('All workers terminated');
  }
}

// Global worker manager instance
export const workerManager = new WorkerManager();

/**
 * Calculate assessment scores using Web Workers
 */
export async function calculateScoresAsync(answers: Record<number, number | null>) {
  return workerManager.executeTask('CALCULATE_SCORES', { answers });
}

/**
 * Calculate industry scores using Web Workers
 */
export async function calculateIndustryScoresAsync(scores: any) {
  return workerManager.executeTask('CALCULATE_INDUSTRY', { scores });
}

/**
 * Validate answers using Web Workers
 */
export async function validateAnswersAsync(answers: Record<number, number | null>) {
  return workerManager.executeTask('VALIDATE_ANSWERS', { answers });
}

/**
 * Initialize worker manager
 */
export async function initializeWorkers() {
  await workerManager.initialize();
}

/**
 * Get worker statistics
 */
export function getWorkerStatistics() {
  return workerManager.getStatistics();
}

// Auto-initialize on import in browser (removed to prevent SSR issues)
// Workers will be initialized manually from components
