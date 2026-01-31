/**
 * =============================================================================
 * AUTH.SCHEMA.TEST.TS - Test Validation Schemas (Zod)
 * =============================================================================
 * 
 * Test các Zod validation schemas cho Auth Module
 */

import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../../modules/auth/auth.schema.js';

describe('Auth Validation Schemas (Zod)', () => {
  // ===========================================================================
  // REGISTER SCHEMA
  // ===========================================================================
  describe('registerSchema', () => {
    it('should pass with valid input', () => {
      const validData = {
        username: 'john_doe',
        email: 'john@example.com',
        password: '123456',
        fullName: 'John Doe',
        phone: '0901234567',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should pass with minimal required fields', () => {
      const validData = {
        username: 'john_doe',
        email: 'john@example.com',
        password: '123456',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when username is too short', () => {
      const invalidData = {
        username: 'ab', // min 3
        email: 'john@example.com',
        password: '123456',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toContain('ít nhất 3 ký tự');
      }
    });

    it('should fail when username has invalid characters', () => {
      const invalidData = {
        username: 'john@doe', // chỉ chấp nhận a-z, 0-9, _
        email: 'john@example.com',
        password: '123456',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toContain('chữ, số và dấu gạch dưới');
      }
    });

    it('should fail when email is invalid', () => {
      const invalidData = {
        username: 'john_doe',
        email: 'not-an-email',
        password: '123456',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toContain('không hợp lệ');
      }
    });

    it('should fail when password is too short', () => {
      const invalidData = {
        username: 'john_doe',
        email: 'john@example.com',
        password: '12345', // min 6
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toContain('ít nhất 6 ký tự');
      }
    });

    it('should fail when required fields are missing', () => {
      const invalidData = {
        email: 'john@example.com',
        password: '123456',
        // missing username
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail when phone format is invalid', () => {
      const invalidData = {
        username: 'john_doe',
        email: 'john@example.com',
        password: '123456',
        phone: '123', // must be 10-11 digits
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toContain('10-11 chữ số');
      }
    });
  });

  // ===========================================================================
  // LOGIN SCHEMA
  // ===========================================================================
  describe('loginSchema', () => {
    it('should pass with valid input', () => {
      const validData = {
        email: 'john@example.com',
        password: '123456',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when email is missing', () => {
      const invalidData = {
        password: '123456',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail when password is missing', () => {
      const invalidData = {
        email: 'john@example.com',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail when email format is invalid', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123456',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ===========================================================================
  // CHANGE PASSWORD SCHEMA
  // ===========================================================================
  describe('changePasswordSchema', () => {
    it('should pass with valid input', () => {
      const validData = {
        currentPassword: 'oldpass123',
        newPassword: 'newpass456',
        confirmPassword: 'newpass456',
      };

      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when confirmPassword does not match', () => {
      const invalidData = {
        currentPassword: 'oldpass123',
        newPassword: 'newpass456',
        confirmPassword: 'different123',
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toContain('không khớp');
      }
    });

    it('should fail when newPassword is too short', () => {
      const invalidData = {
        currentPassword: 'oldpass123',
        newPassword: '12345', // min 6
        confirmPassword: '12345',
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toContain('ít nhất 6 ký tự');
      }
    });

    it('should fail when currentPassword is missing', () => {
      const invalidData = {
        newPassword: 'newpass456',
        confirmPassword: 'newpass456',
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
