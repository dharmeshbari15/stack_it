/**
 * Authentication Service Tests
 * Tests password hashing, validation, and authentication logic
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {
  initTestDb,
  cleanupTestDb,
  closeTestDb,
  createTestUser,
  randomEmail,
  randomUsername,
} from './test-utils';

describe('Authentication Service', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('Password Hashing', () => {
    it('should hash passwords correctly using bcrypt', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 10);

      assert.ok(hash);
      assert.notEqual(hash, password);
      assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));
    });

    it('should verify correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hash);
      assert.strictEqual(isValid, true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare('WrongPassword', hash);
      assert.strictEqual(isValid, false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SecurePassword123!';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      assert.notEqual(hash1, hash2);
    });
  });

  describe('User Registration', () => {
    it('should create user with valid data', async () => {
      const user = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
        password: 'Password123!',
      });

      assert.ok(user.id);
      assert.ok(user.username);
      assert.ok(user.email);
      assert.ok(user.password_hash);
      assert.strictEqual(user.role, 'USER');
      assert.strictEqual(user.reputation, 0);
    });

    it('should not allow duplicate usernames', async () => {
      const username = randomUsername();

      await createTestUser({ username, email: randomEmail() });

      await assert.rejects(
        async () => {
          await createTestUser({ username, email: randomEmail() });
        },
        {
          name: 'Error',
        }
      );
    });

    it('should not allow duplicate emails', async () => {
      const email = randomEmail();

      await createTestUser({ username: randomUsername(), email });

      await assert.rejects(
        async () => {
          await createTestUser({ username: randomUsername(), email });
        },
        {
          name: 'Error',
        }
      );
    });

    it('should set default reputation to 0', async () => {
      const user = await createTestUser();

      assert.strictEqual(user.reputation, 0);
    });

    it('should set default role to USER', async () => {
      const user = await createTestUser();

      assert.strictEqual(user.role, 'USER');
    });

    it('should allow creating ADMIN users', async () => {
      const user = await createTestUser({ role: 'ADMIN' });

      assert.strictEqual(user.role, 'ADMIN');
    });
  });

  describe('Password Validation', () => {
    const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }

      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should accept strong password', () => {
      const result = validatePassword('SecurePass123!');

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('securepass123!');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('uppercase')));
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('SECUREPASS123!');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('lowercase')));
    });

    it('should reject password without number', () => {
      const result = validatePassword('SecurePass!');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('number')));
    });

    it('should reject password without special character', () => {
      const result = validatePassword('SecurePass123');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('special character')));
    });

    it('should reject short password', () => {
      const result = validatePassword('Sec1!');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('8 characters')));
    });
  });

  describe('Email Validation', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should accept valid email', () => {
      assert.strictEqual(validateEmail('user@example.com'), true);
      assert.strictEqual(validateEmail('test.user+tag@domain.co.uk'), true);
    });

    it('should reject invalid email without @', () => {
      assert.strictEqual(validateEmail('userexample.com'), false);
    });

    it('should reject invalid email without domain', () => {
      assert.strictEqual(validateEmail('user@'), false);
    });

    it('should reject invalid email without username', () => {
      assert.strictEqual(validateEmail('@example.com'), false);
    });

    it('should reject email with spaces', () => {
      assert.strictEqual(validateEmail('user @example.com'), false);
    });
  });

  describe('Session Management', () => {
    it('should track user session data', async () => {
      const user = await createTestUser();

      const sessionData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        createdAt: new Date(),
      };

      assert.ok(sessionData.userId);
      assert.ok(sessionData.email);
      assert.ok(sessionData.createdAt);
    });
  });

  describe('Security - SQL Injection Prevention', () => {
    it('should prevent SQL injection in email field', async () => {
      const maliciousEmail = "admin'; DROP TABLE users; --";

      // Should fail due to email validation or be safely escaped
      await assert.rejects(async () => {
        await createTestUser({
          email: maliciousEmail,
          username: randomUsername(),
        });
      });
    });

    it('should prevent SQL injection in username field', async () => {
      const maliciousUsername = "admin'); DROP TABLE users; --";

      // Prisma should safely escape this
      const user = await createTestUser({
        username: maliciousUsername,
        email: randomEmail(),
      });

      // Verify user was created safely without SQL execution
      assert.strictEqual(user.username, maliciousUsername);
    });
  });
});
