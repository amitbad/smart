import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = 'smart-organizer-salt-2026';

// Get or generate encryption key
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (envKey) {
    // Use provided key from environment
    return crypto.scryptSync(envKey, SALT, 32);
  }
  
  // Generate a random key (will be different each restart - for development only)
  console.warn('⚠️  No ENCRYPTION_KEY in .env - using random key (data will not persist across restarts)');
  return crypto.randomBytes(32);
}

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted string (format: iv:authTag:encryptedData)
 */
export function encrypt(text) {
  if (!text || typeof text !== 'string') return text;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
}

/**
 * Decrypt text using AES-256-GCM
 * @param {string} encryptedText - Encrypted string (format: iv:authTag:encryptedData)
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    
    // If not in encrypted format, return as-is (backward compatibility)
    if (parts.length !== 3) {
      return encryptedText;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return original if decryption fails
    return encryptedText;
  }
}

/**
 * Encrypt email - only encrypt domain part
 * Example: user@example.com → user@[encrypted_domain]
 */
export function encryptEmail(email) {
  if (!email || !email.includes('@')) return email;
  
  const [username, domain] = email.split('@');
  const encryptedDomain = encrypt(domain);
  
  return `${username}@${encryptedDomain}`;
}

/**
 * Decrypt email - decrypt domain part
 */
export function decryptEmail(encryptedEmail) {
  if (!encryptedEmail || !encryptedEmail.includes('@')) return encryptedEmail;
  
  const parts = encryptedEmail.split('@');
  if (parts.length !== 2) return encryptedEmail;
  
  const [username, encryptedDomain] = parts;
  const domain = decrypt(encryptedDomain);
  
  return `${username}@${domain}`;
}

/**
 * Encrypt URL completely
 */
export function encryptUrl(url) {
  return encrypt(url);
}

/**
 * Decrypt URL
 */
export function decryptUrl(encryptedUrl) {
  return decrypt(encryptedUrl);
}

/**
 * Encrypt sensitive fields in an object
 * @param {Object} data - Object with fields to encrypt
 * @param {Array} fields - Array of field names to encrypt
 * @returns {Object} - Object with encrypted fields
 */
export function encryptFields(data, fields = []) {
  const encrypted = { ...data };
  
  fields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  });
  
  return encrypted;
}

/**
 * Decrypt sensitive fields in an object
 * @param {Object} data - Object with encrypted fields
 * @param {Array} fields - Array of field names to decrypt
 * @returns {Object} - Object with decrypted fields
 */
export function decryptFields(data, fields = []) {
  const decrypted = { ...data };
  
  fields.forEach(field => {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  });
  
  return decrypted;
}
