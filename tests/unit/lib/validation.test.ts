import { 
  requiredStringError, 
  VALID_USERNAME_PATTERN, 
  INVALID_USERNAME_FORMAT_MESSAGE,
  STRONG_PASSWORD_PATTERN,
  INVALID_PASSWORD_FORMAT_MESSAGE
} from '../../../src/lib/validation';

describe('Validation Utilities', () => {
  describe('requiredStringError', () => {
    describe('with default label', () => {
      const errorFn = requiredStringError();

      it('should return "Field is required" for undefined input', () => {
        const result = errorFn.error({ input: undefined });
        expect(result).toBe('Field is required');
      });

      it('should return "Field should be a string" for non-string input', () => {
        expect(errorFn.error({ input: 123 })).toBe('Field should be a string');
        expect(errorFn.error({ input: true })).toBe('Field should be a string');
        expect(errorFn.error({ input: {} })).toBe('Field should be a string');
        expect(errorFn.error({ input: null })).toBe('Field should be a string');
      });
    });

    describe('with custom label', () => {
      const errorFn = requiredStringError('Username');

      it('should use custom label for undefined input', () => {
        const result = errorFn.error({ input: undefined });
        expect(result).toBe('Username is required');
      });

      it('should use custom label for non-string input', () => {
        const result = errorFn.error({ input: 123 });
        expect(result).toBe('Username should be a string');
      });
    });

    describe('edge cases', () => {
      it('should handle empty string label', () => {
        const errorFn = requiredStringError('');
        expect(errorFn.error({ input: undefined })).toBe(' is required');
        expect(errorFn.error({ input: 123 })).toBe(' should be a string');
      });

      it('should handle empty string input (not undefined)', () => {
        const errorFn = requiredStringError('Field');
        const result = errorFn.error({ input: '' });
        expect(result).toBe('Field should be a string');
      });
    });
  });

  describe('VALID_USERNAME_PATTERN', () => {
    describe('valid usernames', () => {
      const validUsernames = [
        'user123',      // letters + numbers
        'test_user',    // underscore
        'my-username',  // hyphen
        'a',            // single character
        '123',          // numbers only
        'MixedCase123', // mixed case
      ];

      validUsernames.forEach(username => {
        it(`should match valid username: "${username}"`, () => {
          expect(VALID_USERNAME_PATTERN.test(username)).toBe(true);
        });
      });
    });

    describe('invalid usernames', () => {
      const invalidUsernames = [
        'user@domain.com',  // @ symbol
        'user name',        // space
        'user.name',        // dot
        'user#123',         // hash symbol
        'user!exclaim',     // exclamation
        '',                 // empty string
        '   ',              // whitespace only
      ];

      invalidUsernames.forEach(username => {
        it(`should not match invalid username: "${username}"`, () => {
          expect(VALID_USERNAME_PATTERN.test(username)).toBe(false);
        });
      });
    });
  });

  describe('STRONG_PASSWORD_PATTERN', () => {
    describe('valid passwords', () => {
      const validPasswords = [
        'Password123!',     // all requirements
        'MyStr0ng@Pass',    // different special char
        'Test123$',         // minimum length
        'Aa1!',             // absolute minimum
      ];

      validPasswords.forEach(password => {
        it(`should match valid password: "${password}"`, () => {
          expect(STRONG_PASSWORD_PATTERN.test(password)).toBe(true);
        });
      });
    });

    describe('invalid passwords', () => {
      const invalidPasswords = [
        'password',         // no uppercase, no number, no special
        'PASSWORD123!',     // no lowercase
        'password123!',     // no uppercase
        'Password!',        // no number
        'Password123',      // no special character
        'Aa1',              // too short but has requirements
        '',                 // empty
      ];

      invalidPasswords.forEach(password => {
        it(`should not match invalid password: "${password}"`, () => {
          expect(STRONG_PASSWORD_PATTERN.test(password)).toBe(false);
        });
      });
    });
  });

  describe('validation constants', () => {
    it('should have correct error message for username format', () => {
      expect(INVALID_USERNAME_FORMAT_MESSAGE).toBe(
        'Username can only contain letters, numbers, hyphens, and underscores'
      );
    });

    it('should have correct error message for password format', () => {
      expect(INVALID_PASSWORD_FORMAT_MESSAGE).toBe(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    });
  });
});
