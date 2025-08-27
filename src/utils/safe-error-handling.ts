/**
 * Safe Error Handling Utilities
 * Provides robust error handling functions to prevent undefined property access errors
 */

/**
 * Safe error object interface
 */
export interface SafeError {
  message: string;
  code?: string;
  stack?: string;
  name?: string;
  originalError?: any;
  context?: string;
  timestamp?: string;
}

/**
 * Creates a safe error object from any input
 * Prevents "Cannot read properties of undefined" errors
 */
export function createSafeError(error: any, defaultCode: string = 'UNKNOWN_ERROR'): SafeError {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return {
      message: 'Unknown error occurred',
      code: defaultCode,
      name: 'UnknownError'
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message || 'An error occurred',
      code: (error as any).code || defaultCode,
      stack: error.stack,
      name: error.name || 'Error',
      originalError: error
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error || 'An error occurred',
      code: 'STRING_ERROR',
      name: 'StringError'
    };
  }

  // Handle object errors with safe property access
  if (typeof error === 'object') {
    try {
      return {
        message: error?.message || error?.error || 'An error occurred',
        code: error?.code || error?.status || defaultCode,
        stack: error?.stack,
        name: error?.name || 'ObjectError',
        originalError: error
      };
    } catch (accessError) {
      // If we can't safely access properties, create a basic error
      return {
        message: 'Error object could not be processed safely',
        code: 'UNSAFE_ERROR_OBJECT',
        name: 'UnsafeError',
        originalError: error
      };
    }
  }

  // Handle primitive types
  try {
    return {
      message: String(error) || 'An error occurred',
      code: 'PRIMITIVE_ERROR',
      name: 'PrimitiveError',
      originalError: error
    };
  } catch (stringifyError) {
    return {
      message: 'Error could not be converted to string',
      code: 'STRINGIFY_ERROR',
      name: 'StringifyError',
      originalError: error
    };
  }
}

/**
 * Safe error callback wrapper
 * Prevents errors in error callbacks from crashing the application
 */
export function safeErrorCallback(
  callback: ((error: SafeError, context?: any) => void) | undefined,
  error: any,
  context?: any,
  defaultCode?: string
): void {
  if (!callback || typeof callback !== 'function') {
    console.warn('Safe Error Handling: Invalid callback provided');
    return;
  }

  try {
    const safeError = createSafeError(error, defaultCode);

    // Additional safety check for the callback
    if (typeof callback === 'function') {
      callback(safeError, context);
    } else {
      console.warn('Safe Error Handling: Callback is not a function at execution time');
    }
  } catch (callbackError) {
    console.error('Safe Error Handling: Error in error callback:', callbackError);
    console.error('Safe Error Handling: Original error was:', error);

    // Try to extract useful information from the callback error
    const callbackErrorInfo = createSafeError(callbackError, 'CALLBACK_ERROR');
    console.error('Safe Error Handling: Callback error details:', callbackErrorInfo);
  }
}

/**
 * Enhanced response validation for API responses
 * Prevents "Cannot read properties of undefined" errors
 */
export function validateApiResponse(
  response: any,
  requiredFields: string[] = ['data']
): { isValid: boolean; error?: SafeError; safeResponse?: any } {
  try {
    // Check if response exists
    if (!response) {
      return {
        isValid: false,
        error: createSafeError('Response is null or undefined', 'NULL_RESPONSE')
      };
    }

    // Check if response is an object
    if (typeof response !== 'object') {
      return {
        isValid: false,
        error: createSafeError('Response is not an object', 'INVALID_RESPONSE_TYPE')
      };
    }

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in response) || response[field] === undefined) {
        return {
          isValid: false,
          error: createSafeError(`Missing required field: ${field}`, 'MISSING_FIELD')
        };
      }
    }

    // Create safe response with default values
    const safeResponse = {
      ...response,
      data: response.data || {},
      success: response.success !== undefined ? response.success : true,
      message: response.message || 'Success'
    };

    return {
      isValid: true,
      safeResponse
    };
  } catch (validationError) {
    return {
      isValid: false,
      error: createSafeError(validationError, 'VALIDATION_ERROR')
    };
  }
}



/**
 * Get nested property safely
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Safe async function wrapper
 * Catches and handles errors in async functions
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  errorHandler?: (error: SafeError) => T | Promise<T>,
  defaultValue?: T
): Promise<T> {
  try {
    return await asyncFn();
  } catch (error) {
    const safeError = createSafeError(error);
    
    if (errorHandler) {
      try {
        return await errorHandler(safeError);
      } catch (handlerError) {
        console.error('Safe Async: Error in error handler:', handlerError);
        console.error('Safe Async: Original error was:', safeError);
      }
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw safeError;
  }
}

/**
 * Safe property access with default value
 */
export function safeGet<T>(
  obj: any,
  path: string,
  defaultValue?: T
): T | undefined {
  try {
    const value = getNestedProperty(obj, path);
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    console.warn(`Safe Get: Error accessing property '${path}':`, error);
    return defaultValue;
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(
  jsonString: string,
  defaultValue?: T
): T | undefined {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Safe JSON Parse: Invalid JSON string:', error);
    return defaultValue;
  }
}

/**
 * Create structured error response for APIs
 */
export function createErrorResponse(
  error: any,
  jobId?: string,
  additionalData?: any
): any {
  const safeError = createSafeError(error);
  
  return {
    success: false,
    message: safeError.message,
    data: {
      jobId: jobId || 'unknown',
      status: 'failed',
      error: safeError.message,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...additionalData
    },
    error: {
      message: safeError.message,
      code: safeError.code || 'UNKNOWN_ERROR',
      name: safeError.name || 'Error'
    }
  };
}

/**
 * Log error safely with context
 */
export function logError(
  error: any,
  context: string,
  additionalInfo?: any
): void {
  const safeError = createSafeError(error);

  console.error(`[${context}] Error:`, {
    message: safeError.message,
    code: safeError.code,
    name: safeError.name,
    additionalInfo,
    timestamp: new Date().toISOString()
  });

  if (safeError.stack) {
    console.error(`[${context}] Stack trace:`, safeError.stack);
  }
}

/**
 * Safe property access for error objects
 * Prevents "Cannot read properties of undefined" errors
 */
export function safeErrorProperty(
  error: any,
  property: string,
  defaultValue: any = undefined
): any {
  try {
    if (error === null || error === undefined) {
      return defaultValue;
    }

    if (typeof error === 'object' && property in error) {
      return error[property] !== undefined ? error[property] : defaultValue;
    }

    return defaultValue;
  } catch (accessError) {
    console.warn(`Safe Error Handling: Failed to access property '${property}':`, accessError);
    return defaultValue;
  }
}

/**
 * Enhanced error object validation
 * Ensures error objects have all expected properties
 */
export function validateErrorObject(error: any): SafeError {
  if (!error) {
    return createSafeError('Unknown error occurred', 'UNKNOWN_ERROR');
  }

  // If it's already a SafeError, return as-is
  if (error.message && error.code && error.name) {
    return error as SafeError;
  }

  // Create a safe error from the input
  return createSafeError(error);
}

/**
 * Comprehensive error handler for assessment workflows
 * Handles all types of error objects safely
 */
export function handleAssessmentError(
  error: any,
  context: string = 'Assessment',
  fallbackMessage: string = 'An error occurred during assessment processing'
): SafeError {

  // Log the original error for debugging
  console.error(`${context}: Original error:`, error);

  // Create safe error
  const safeError = createSafeError(error, fallbackMessage);

  // Add context-specific information
  safeError.context = context;
  safeError.timestamp = new Date().toISOString();

  // Log the safe error
  logError(safeError, context);

  return safeError;
}

export default {
  createSafeError,
  safeErrorCallback,
  validateApiResponse,
  safeAsync,
  safeGet,
  safeJsonParse,
  createErrorResponse,
  logError,
  safeErrorProperty,
  validateErrorObject,
  handleAssessmentError
};
