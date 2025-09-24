import CryptoJS from 'crypto-js';

/**
 * Encryption utility for securing assessment data in localStorage
 * Uses AES encryption with a secret key
 */

// Default encryption key - in production, this should come from environment variables
const DEFAULT_SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'atma-assessment-secure-key-2024';

/**
 * Encrypt data using AES encryption
 * @param {any} data - Data to encrypt (will be JSON stringified)
 * @param {string} secretKey - Optional custom secret key
 * @returns {string} - Encrypted string
 */
export const encryptData = (data, secretKey = DEFAULT_SECRET_KEY) => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, secretKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES decryption
 * @param {string} encryptedData - Encrypted string to decrypt
 * @param {string} secretKey - Optional custom secret key
 * @returns {any} - Decrypted and parsed data
 */
export const decryptData = (encryptedData, secretKey = DEFAULT_SECRET_KEY) => {
  try {
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Failed to decrypt data - invalid key or corrupted data');
    }
    
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Secure localStorage wrapper with encryption
 */
export class SecureStorage {
  constructor(secretKey = DEFAULT_SECRET_KEY) {
    this.secretKey = secretKey;
  }

  /**
   * Set encrypted item in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be encrypted)
   */
  setItem(key, value) {
    try {
      const encryptedValue = encryptData(value, this.secretKey);
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error(`Failed to set encrypted item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get and decrypt item from localStorage
   * @param {string} key - Storage key
   * @returns {any} - Decrypted value or null if not found
   */
  getItem(key) {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) {
        return null;
      }
      
      return decryptData(encryptedValue, this.secretKey);
    } catch (error) {
      console.error(`Failed to get encrypted item ${key}:`, error);
      // If decryption fails, remove the corrupted item
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   */
  removeItem(key) {
    localStorage.removeItem(key);
  }

  /**
   * Clear all items from localStorage
   */
  clear() {
    localStorage.clear();
  }

  /**
   * Check if encrypted item exists
   * @param {string} key - Storage key
   * @returns {boolean} - True if item exists and can be decrypted
   */
  hasItem(key) {
    try {
      const item = this.getItem(key);
      return item !== null;
    } catch (error) {
      return false;
    }
  }
}

// Default instance for easy use
export const secureStorage = new SecureStorage();

/**
 * Migration utility to encrypt existing unencrypted data
 * @param {string} key - Storage key
 * @param {SecureStorage} storage - SecureStorage instance
 */
export const migrateToEncrypted = (key, storage = secureStorage) => {
  try {
    const existingData = localStorage.getItem(key);
    if (!existingData) {
      return false;
    }

    // Try to parse as JSON to check if it's unencrypted
    try {
      const parsedData = JSON.parse(existingData);
      // If parsing succeeds, it's likely unencrypted
      storage.setItem(key, parsedData);
      console.log(`Migrated ${key} to encrypted storage`);
      return true;
    } catch (parseError) {
      // If parsing fails, it might already be encrypted
      try {
        storage.getItem(key);
        console.log(`${key} is already encrypted`);
        return true;
      } catch (decryptError) {
        console.error(`Failed to migrate ${key}:`, decryptError);
        return false;
      }
    }
  } catch (error) {
    console.error(`Migration error for ${key}:`, error);
    return false;
  }
};
