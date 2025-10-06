/**
 * Unit tests for StorageTransaction utility
 * Tests atomic localStorage operations with rollback support
 */

import { 
  StorageTransaction, 
  atomicUpdate, 
  atomicRemove,
  getStorageQuota 
} from '../storage-transaction';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('StorageTransaction', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should add operations to transaction', () => {
      const transaction = new StorageTransaction();
      
      transaction.add('key1', 'value1');
      transaction.add('key2', { data: 'value2' });
      
      const status = transaction.getStatus();
      expect(status.operationCount).toBe(2);
      expect(status.backupCount).toBe(2);
    });

    it('should commit operations atomically', async () => {
      const transaction = new StorageTransaction();
      
      transaction.add('token', 'abc123');
      transaction.add('user', { id: '1', email: 'test@test.com' });
      transaction.add('auth_version', 'v2');
      
      await transaction.commit();
      
      expect(localStorage.getItem('token')).toBe('abc123');
      expect(localStorage.getItem('user')).toBe(JSON.stringify({ id: '1', email: 'test@test.com' }));
      expect(localStorage.getItem('auth_version')).toBe('v2');
      
      const status = transaction.getStatus();
      expect(status.isCommitted).toBe(true);
      expect(status.backupCount).toBe(0); // Backups cleared after commit
    });

    it('should handle remove operations', async () => {
      localStorage.setItem('oldKey', 'oldValue');
      
      const transaction = new StorageTransaction();
      transaction.remove('oldKey');
      
      await transaction.commit();
      
      expect(localStorage.getItem('oldKey')).toBeNull();
    });

    it('should prevent adding operations after commit', async () => {
      const transaction = new StorageTransaction();
      transaction.add('key1', 'value1');
      await transaction.commit();
      
      expect(() => {
        transaction.add('key2', 'value2');
      }).toThrow('Cannot add operations to committed transaction');
    });
  });

  describe('Rollback Functionality', () => {
    it('should rollback on commit failure', async () => {
      // Set initial values
      localStorage.setItem('key1', 'original1');
      localStorage.setItem('key2', 'original2');
      
      const transaction = new StorageTransaction();
      transaction.add('key1', 'new1');
      transaction.add('key2', 'new2');
      
      // Mock setItem to fail on second operation
      let callCount = 0;
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn((key, value) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Storage quota exceeded');
        }
        originalSetItem(key, value);
      });
      
      // Attempt commit
      await expect(transaction.commit()).rejects.toThrow();
      
      // Verify rollback restored original values
      expect(localStorage.getItem('key1')).toBe('original1');
      expect(localStorage.getItem('key2')).toBe('original2');
      
      // Restore mock
      localStorage.setItem = originalSetItem;
    });

    it('should manually rollback transaction', async () => {
      localStorage.setItem('key1', 'original');
      
      const transaction = new StorageTransaction();
      transaction.add('key1', 'modified');
      
      // Manually trigger rollback
      await transaction.rollback();
      
      expect(localStorage.getItem('key1')).toBe('original');
      expect(transaction.getStatus().isRolledBack).toBe(true);
    });

    it('should handle rollback when original value was null', async () => {
      const transaction = new StorageTransaction();
      transaction.add('newKey', 'newValue');
      
      await transaction.rollback();
      
      expect(localStorage.getItem('newKey')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty transaction commit', async () => {
      const transaction = new StorageTransaction();
      
      await expect(transaction.commit()).resolves.not.toThrow();
      expect(transaction.getStatus().isCommitted).toBe(true);
    });

    it('should prevent double commit', async () => {
      const transaction = new StorageTransaction();
      transaction.add('key', 'value');
      
      await transaction.commit();
      
      await expect(transaction.commit()).rejects.toThrow('Transaction already committed');
    });

    it('should prevent commit after rollback', async () => {
      const transaction = new StorageTransaction();
      transaction.add('key', 'value');
      
      await transaction.rollback();
      
      await expect(transaction.commit()).rejects.toThrow('Cannot commit rolled back transaction');
    });

    it('should handle object serialization', async () => {
      const complexObject = {
        id: 1,
        nested: { data: 'test' },
        array: [1, 2, 3],
      };
      
      const transaction = new StorageTransaction();
      transaction.add('complex', complexObject);
      
      await transaction.commit();
      
      const stored = localStorage.getItem('complex');
      expect(stored).toBe(JSON.stringify(complexObject));
    });

    it('should clear transaction memory', async () => {
      const transaction = new StorageTransaction();
      transaction.add('key1', 'value1');
      transaction.add('key2', 'value2');
      
      await transaction.commit();
      transaction.clear();
      
      const status = transaction.getStatus();
      expect(status.operationCount).toBe(0);
      expect(status.backupCount).toBe(0);
    });
  });

  describe('Helper Functions', () => {
    it('atomicUpdate should commit all operations', async () => {
      await atomicUpdate({
        token: 'abc123',
        user: { id: '1', email: 'test@test.com' },
        auth_version: 'v2',
      });
      
      expect(localStorage.getItem('token')).toBe('abc123');
      expect(localStorage.getItem('user')).toBe(JSON.stringify({ id: '1', email: 'test@test.com' }));
      expect(localStorage.getItem('auth_version')).toBe('v2');
    });

    it('atomicRemove should delete all keys', async () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.setItem('key3', 'value3');
      
      await atomicRemove(['key1', 'key2']);
      
      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
      expect(localStorage.getItem('key3')).toBe('value3'); // Not removed
    });

    it('getStorageQuota should return quota estimate', () => {
      const quota = getStorageQuota();
      
      expect(typeof quota).toBe('number');
      expect(quota).toBeGreaterThanOrEqual(-1);
      expect(quota).toBeLessThanOrEqual(100);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle login flow atomically', async () => {
      const transaction = new StorageTransaction();
      
      // Simulate login data
      transaction.add('token', 'firebase-id-token-123');
      transaction.add('auth_token', 'firebase-id-token-123');
      transaction.add('futureguide_token', 'firebase-id-token-123');
      transaction.add('accessToken', 'firebase-id-token-123');
      transaction.add('refreshToken', 'firebase-refresh-token-456');
      transaction.add('auth_version', 'v2');
      transaction.add('uid', 'user-123');
      transaction.add('email', 'user@test.com');
      transaction.add('displayName', 'Test User');
      transaction.add('user', JSON.stringify({
        id: 'user-123',
        username: 'Test User',
        email: 'user@test.com',
      }));
      
      await transaction.commit();
      
      // Verify all data stored
      expect(localStorage.getItem('token')).toBe('firebase-id-token-123');
      expect(localStorage.getItem('refreshToken')).toBe('firebase-refresh-token-456');
      expect(localStorage.getItem('uid')).toBe('user-123');
      expect(localStorage.getItem('email')).toBe('user@test.com');
      
      const status = transaction.getStatus();
      expect(status.isCommitted).toBe(true);
    });

    it('should rollback partial login on failure', async () => {
      // Set initial state (User A)
      localStorage.setItem('token', 'old-token');
      localStorage.setItem('uid', 'old-user-id');
      localStorage.setItem('email', 'old@test.com');
      
      const transaction = new StorageTransaction();
      
      // Attempt to set User B data
      transaction.add('token', 'new-token');
      transaction.add('uid', 'new-user-id');
      transaction.add('email', 'new@test.com');
      
      // Simulate failure
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      await expect(transaction.commit()).rejects.toThrow();
      
      // Verify rollback to User A
      localStorage.setItem = originalSetItem; // Restore for verification
      expect(localStorage.getItem('token')).toBe('old-token');
      expect(localStorage.getItem('uid')).toBe('old-user-id');
      expect(localStorage.getItem('email')).toBe('old@test.com');
    });

    it('should handle concurrent transactions independently', async () => {
      const transaction1 = new StorageTransaction();
      const transaction2 = new StorageTransaction();
      
      transaction1.add('key1', 'transaction1-value');
      transaction2.add('key2', 'transaction2-value');
      
      await Promise.all([
        transaction1.commit(),
        transaction2.commit(),
      ]);
      
      expect(localStorage.getItem('key1')).toBe('transaction1-value');
      expect(localStorage.getItem('key2')).toBe('transaction2-value');
    });
  });
});
