/**
 * Test utility for UUID mapping functionality
 */

// UUID utilities (duplicated from chat-api.ts for testing)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function getOrCreateUUIDForResultId(resultId: string): string {
  const storageKey = `uuid-mapping-${resultId}`;
  
  // Check if we already have a UUID mapping for this result ID
  const existingUUID = localStorage.getItem(storageKey);
  if (existingUUID && isValidUUID(existingUUID)) {
    return existingUUID;
  }
  
  // If the result ID is already a UUID, use it directly
  if (isValidUUID(resultId)) {
    return resultId;
  }
  
  // Generate a new UUID and store the mapping
  const newUUID = generateUUID();
  localStorage.setItem(storageKey, newUUID);
  console.log(`Created UUID mapping: ${resultId} -> ${newUUID}`);
  
  return newUUID;
}

/**
 * Test UUID mapping functionality
 */
export function testUUIDMapping(): {
  success: boolean;
  results: Array<{
    test: string;
    input: string;
    output: string;
    success: boolean;
    message: string;
  }>;
} {
  const results = [];
  let overallSuccess = true;

  // Test 1: Non-UUID input should generate UUID
  const test1Input = 'result-001';
  const test1Output = getOrCreateUUIDForResultId(test1Input);
  const test1Success = isValidUUID(test1Output) && test1Output !== test1Input;
  results.push({
    test: 'Non-UUID to UUID mapping',
    input: test1Input,
    output: test1Output,
    success: test1Success,
    message: test1Success ? 'Generated valid UUID' : 'Failed to generate UUID'
  });
  if (!test1Success) overallSuccess = false;

  // Test 2: Same input should return same UUID
  const test2Output = getOrCreateUUIDForResultId(test1Input);
  const test2Success = test2Output === test1Output;
  results.push({
    test: 'Consistent UUID mapping',
    input: test1Input,
    output: test2Output,
    success: test2Success,
    message: test2Success ? 'Returned same UUID' : 'Generated different UUID'
  });
  if (!test2Success) overallSuccess = false;

  // Test 3: Valid UUID input should return same UUID
  const test3Input = generateUUID();
  const test3Output = getOrCreateUUIDForResultId(test3Input);
  const test3Success = test3Output === test3Input;
  results.push({
    test: 'UUID passthrough',
    input: test3Input,
    output: test3Output,
    success: test3Success,
    message: test3Success ? 'UUID passed through unchanged' : 'UUID was modified'
  });
  if (!test3Success) overallSuccess = false;

  // Test 4: Different non-UUID inputs should generate different UUIDs
  const test4Input = 'result-002';
  const test4Output = getOrCreateUUIDForResultId(test4Input);
  const test4Success = isValidUUID(test4Output) && test4Output !== test1Output;
  results.push({
    test: 'Different inputs generate different UUIDs',
    input: test4Input,
    output: test4Output,
    success: test4Success,
    message: test4Success ? 'Generated different UUID' : 'Generated same or invalid UUID'
  });
  if (!test4Success) overallSuccess = false;

  return {
    success: overallSuccess,
    results
  };
}

/**
 * Clear all UUID mappings from localStorage
 */
export function clearUUIDMappings(): {
  cleared: string[];
  remaining: string[];
} {
  const keys = Object.keys(localStorage);
  const mappingKeys = keys.filter(key => key.startsWith('uuid-mapping-'));
  
  mappingKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  return {
    cleared: mappingKeys,
    remaining: Object.keys(localStorage)
  };
}

/**
 * Get all current UUID mappings
 */
export function getAllUUIDMappings(): Array<{
  resultId: string;
  uuid: string;
}> {
  const keys = Object.keys(localStorage);
  const mappingKeys = keys.filter(key => key.startsWith('uuid-mapping-'));
  
  return mappingKeys.map(key => {
    const resultId = key.replace('uuid-mapping-', '');
    const uuid = localStorage.getItem(key) || '';
    return { resultId, uuid };
  });
}

/**
 * Validate all stored UUID mappings
 */
export function validateUUIDMappings(): {
  valid: number;
  invalid: number;
  details: Array<{
    resultId: string;
    uuid: string;
    isValid: boolean;
  }>;
} {
  const mappings = getAllUUIDMappings();
  const details = mappings.map(mapping => ({
    ...mapping,
    isValid: isValidUUID(mapping.uuid)
  }));

  const valid = details.filter(d => d.isValid).length;
  const invalid = details.filter(d => !d.isValid).length;

  return { valid, invalid, details };
}
