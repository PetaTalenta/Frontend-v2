# Utilities Documentation

Centralized utilities untuk FutureGuide Frontend application.

---

## 📦 StorageManager

**File:** `storage-manager.ts`

Centralized localStorage management dengan advanced features untuk prevent race conditions, quota exceeded errors, dan performance issues.

### Features

- ✅ Locking mechanism untuk prevent concurrent writes
- ✅ Debounced writes untuk frequent updates
- ✅ Automatic quota exceeded handling
- ✅ Type-safe operations dengan generics
- ✅ Throttled error logging

### Usage

```typescript
import { storageManager } from '@/utils/storage-manager';

// Get item dengan type safety
const user = await storageManager.getItem<User>('user');
const token = await storageManager.getItem<string>('token', 'default-value');

// Set item (dengan locking)
await storageManager.setItem('user', { id: '123', name: 'John' });

// Debounced write (untuk frequent updates)
// Only writes after 300ms of no changes
storageManager.setItemDebounced('assessment-answers', answers, 300);

// Remove item
await storageManager.removeItem('cache-key');

// Clear all storage
await storageManager.clear();

// Get storage stats
const stats = storageManager.getStats();
console.log(`Items: ${stats.itemCount}, Pending: ${stats.pendingWrites}`);

// Flush all pending debounced writes immediately
storageManager.flush();
```

### Synchronous API (for backward compatibility)

```typescript
// Use dengan hati-hati - prefer async getItem
const user = storageManager.getItemSync<User>('user');
```

### Best Practices

1. **Use async methods** - Prefer `getItem()` over `getItemSync()`
2. **Use debouncing** - For frequently updated data (e.g., form inputs)
3. **Handle errors** - Always wrap in try-catch
4. **Type safety** - Always specify generic type

```typescript
// ✅ Good
const user = await storageManager.getItem<User>('user');

// ❌ Bad - no type safety
const user = await storageManager.getItem('user');
```

---

## ⏱️ TimerManager

**File:** `timer-manager.ts`

Centralized timer management untuk track dan cleanup semua setTimeout/setInterval, preventing timer leaks dan memory issues.

### Features

- ✅ Track all timers dengan unique IDs
- ✅ Automatic cleanup on clear
- ✅ Prevents duplicate timers dengan same ID
- ✅ Debug utilities untuk monitor active timers
- ✅ Support untuk setTimeout dan setInterval

### Usage

```typescript
import { timerManager } from '@/utils/timer-manager';

// Set timeout dengan tracked ID
timerManager.setTimeout('poll-job-123', () => {
  console.log('Polling job 123');
}, 5000, 'Job Polling'); // Optional debug name

// Set interval dengan tracked ID
timerManager.setInterval('refresh-token', async () => {
  await refreshToken();
}, 5 * 60 * 1000, 'Token Refresh'); // 5 minutes

// Clear specific timer
timerManager.clearTimeout('poll-job-123');
timerManager.clearInterval('refresh-token');

// Clear all timers dengan prefix
timerManager.clearByPrefix('poll-'); // Clears all timers starting with 'poll-'

// Clear all timers
timerManager.clearAll();

// Check if timer exists
if (timerManager.has('poll-job-123')) {
  console.log('Timer exists');
}

// Get active timer stats
const stats = timerManager.getActiveTimers();
console.log(`Total: ${stats.total}`);
console.log(`Timeouts: ${stats.timeouts}`);
console.log(`Intervals: ${stats.intervals}`);

// Get detailed timer information
const details = timerManager.getTimerDetails();
details.forEach(timer => {
  console.log(`${timer.id}: ${timer.type} - ${timer.callback} (${timer.ageMs}ms old)`);
});

// Print status to console
timerManager.printStatus();

// Enable debug mode
timerManager.setDebugMode(true);

// Clean up stale timers (older than 5 minutes)
const cleared = timerManager.clearStaleTimers(5 * 60 * 1000);
console.log(`Cleared ${cleared} stale timers`);
```

### Best Practices

1. **Use unique IDs** - Prefix dengan feature name (e.g., `poll-job-123`, `refresh-token`)
2. **Clear on unmount** - Always clear timers di component cleanup
3. **Use debug mode** - Enable during development untuk track timer usage
4. **Monitor stale timers** - Periodically check untuk timer leaks

```typescript
// ✅ Good - Clear timers on unmount
useEffect(() => {
  timerManager.setInterval('my-feature-poll', pollData, 5000);
  
  return () => {
    timerManager.clearInterval('my-feature-poll');
  };
}, []);

// ❌ Bad - Timer leak
useEffect(() => {
  setInterval(pollData, 5000); // No cleanup!
}, []);
```

### React Hook Example

```typescript
import { useEffect, useRef } from 'react';
import { timerManager } from '@/utils/timer-manager';

function usePolling(callback: () => void, interval: number, enabled: boolean = true) {
  const timerIdRef = useRef<string>(`poll-${Math.random()}`);
  
  useEffect(() => {
    if (!enabled) return;
    
    const timerId = timerIdRef.current;
    timerManager.setInterval(timerId, callback, interval);
    
    return () => {
      timerManager.clearInterval(timerId);
    };
  }, [callback, interval, enabled]);
}

// Usage
function MyComponent() {
  usePolling(() => {
    console.log('Polling...');
  }, 5000, true);
  
  return <div>Component with polling</div>;
}
```

---

## 🔧 Integration Examples

### Using Both Utilities Together

```typescript
import { storageManager } from '@/utils/storage-manager';
import { timerManager } from '@/utils/timer-manager';

// Auto-save form data every 30 seconds
function useAutoSave(formData: any) {
  useEffect(() => {
    // Debounced save on every change
    storageManager.setItemDebounced('form-draft', formData, 1000);
    
    // Periodic backup every 30 seconds
    timerManager.setInterval('form-backup', async () => {
      await storageManager.setItem('form-backup', {
        data: formData,
        timestamp: Date.now()
      });
    }, 30000);
    
    return () => {
      // Flush pending writes
      storageManager.flush();
      // Clear timer
      timerManager.clearInterval('form-backup');
    };
  }, [formData]);
}
```

### Assessment Service Integration

```typescript
import { timerManager } from '@/utils/timer-manager';

class AssessmentService {
  private startPolling(jobId: string) {
    const pollId = `poll-${jobId}`;
    
    const poll = async () => {
      const status = await this.getStatus(jobId);
      
      if (status.completed) {
        timerManager.clearTimeout(pollId);
        return;
      }
      
      // Schedule next poll
      timerManager.setTimeout(pollId, poll, 3000);
    };
    
    poll();
  }
  
  private stopPolling(jobId: string) {
    timerManager.clearTimeout(`poll-${jobId}`);
  }
}
```

---

## 🐛 Debugging

### StorageManager Debug

```typescript
// Get current stats
const stats = storageManager.getStats();
console.log('Storage Stats:', stats);

// Monitor quota usage
try {
  await storageManager.setItem('large-data', hugeObject);
} catch (error) {
  console.error('Storage error:', error);
  // Automatic cleanup will be triggered
}
```

### TimerManager Debug

```typescript
// Enable debug mode
timerManager.setDebugMode(true);

// Print current status
timerManager.printStatus();

// Get detailed information
const details = timerManager.getTimerDetails();
console.table(details);

// Find stale timers
const stale = timerManager.clearStaleTimers(60000); // Older than 1 minute
console.log(`Found ${stale} stale timers`);
```

---

## 📊 Performance Tips

### StorageManager

1. **Use debouncing** untuk frequent updates (form inputs, scroll position)
2. **Batch operations** when possible
3. **Clear old data** periodically
4. **Monitor quota** usage

### TimerManager

1. **Use intervals** untuk recurring tasks
2. **Clear timers** immediately when no longer needed
3. **Use prefixes** untuk easier bulk cleanup
4. **Monitor active timers** in development

---

## 🔒 Type Safety

Both utilities are fully typed dengan TypeScript:

```typescript
// StorageManager - Type-safe operations
interface User {
  id: string;
  name: string;
  email: string;
}

const user = await storageManager.getItem<User>('user');
// user is typed as User | null

// TimerManager - Type-safe callbacks
timerManager.setTimeout('my-timer', () => {
  // Callback is properly typed
}, 1000);
```

---

## 📝 Migration Guide

### From localStorage to StorageManager

```typescript
// Before
localStorage.setItem('user', JSON.stringify(user));
const user = JSON.parse(localStorage.getItem('user') || '{}');

// After
await storageManager.setItem('user', user);
const user = await storageManager.getItem<User>('user');
```

### From setTimeout/setInterval to TimerManager

```typescript
// Before
const timerId = setTimeout(() => {
  pollData();
}, 5000);
// ... later
clearTimeout(timerId); // Easy to forget!

// After
timerManager.setTimeout('poll-data', pollData, 5000);
// ... later
timerManager.clearTimeout('poll-data'); // Tracked by ID
```

---

## 🎯 Summary

- **StorageManager**: Use untuk all localStorage operations
- **TimerManager**: Use untuk all setTimeout/setInterval operations
- Both utilities prevent common bugs dan improve performance
- Fully typed dengan TypeScript
- Easy to debug dan monitor

For more examples, see the implementation files and tests.

