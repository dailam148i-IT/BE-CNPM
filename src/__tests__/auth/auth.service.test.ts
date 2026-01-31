/**
 * =============================================================================
 * AUTH.SERVICE.TEST.TS - Unit Tests cho Auth Service
 * =============================================================================
 * 
 * Test các business logic functions trong auth.service.ts
 * Sử dụng mock database thay vì database thật
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from '../../modules/auth/auth.service.js';
import prisma from '../../config/database.js';
import { AppError, UnauthorizedError, NotFoundError } from '../../middleware/errorHandler.js';

// Type helpers cho mocked functions
const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  role: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  session: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
};

// ===========================================================================
// REGISTER TESTS
// ===========================================================================
describe('authService.register', () => {
  const validRegisterData = {
    username: 'john_doe',
    email: 'john@example.com',
    password: '123456',
    fullName: 'John Doe',
    phone: '0901234567',
  };

  const mockRole = { id: 1, name: 'CUSTOMER' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    // Arrange: Setup mocks
    mockPrisma.user.findUnique.mockResolvedValue(null); // Email & username not exists
    mockPrisma.role.findUnique.mockResolvedValue(mockRole);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      username: validRegisterData.username,
      email: validRegisterData.email,
      passwordHash: 'hashed-password',
      fullName: validRegisterData.fullName,
      phone: validRegisterData.phone,
      roleId: mockRole.id,
      status: 'ACTIVE',
      role: mockRole,
    });

    // Act
    const result = await authService.register(validRegisterData);

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe('user-123');
    expect(result.username).toBe(validRegisterData.username);
    expect(result.email).toBe(validRegisterData.email);
    expect(result).not.toHaveProperty('passwordHash'); // Password must be removed
    expect(mockPrisma.user.create).toHaveBeenCalled();
  });

  it('should throw error when email already exists', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'existing-user',
      email: validRegisterData.email,
    });

    // Act & Assert
    await expect(authService.register(validRegisterData))
      .rejects
      .toThrow('Email đã được sử dụng');
  });

  it('should throw error when username already exists', async () => {
    // Arrange
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // Email check - not found
      .mockResolvedValueOnce({ id: 'existing-user', username: validRegisterData.username }); // Username check - found

    // Act & Assert
    await expect(authService.register(validRegisterData))
      .rejects
      .toThrow('Username đã được sử dụng');
  });

  it('should throw error when CUSTOMER role not found', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.role.findUnique.mockResolvedValue(null); // Role not found

    // Act & Assert
    await expect(authService.register(validRegisterData))
      .rejects
      .toThrow('Role không tồn tại');
  });
});

// ===========================================================================
// LOGIN TESTS
// ===========================================================================
describe('authService.login', () => {
  const validLoginData = {
    email: 'john@example.com',
    password: '123456',
  };

  const mockUser = {
    id: 'user-123',
    username: 'john_doe',
    email: 'john@example.com',
    passwordHash: bcrypt.hashSync('123456', 10),
    fullName: 'John Doe',
    phone: '0901234567',
    status: 'ACTIVE',
    role: { id: 1, name: 'CUSTOMER' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.session.create.mockResolvedValue({ id: 'session-123' });

    // Act
    const result = await authService.login(validLoginData);

    // Assert
    expect(result).toBeDefined();
    expect(result.user.id).toBe(mockUser.id);
    expect(result.user.email).toBe(mockUser.email);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('should throw UnauthorizedError when email is wrong', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(authService.login(validLoginData))
      .rejects
      .toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when password is wrong', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      passwordHash: bcrypt.hashSync('different-password', 10),
    });

    // Act & Assert
    await expect(authService.login(validLoginData))
      .rejects
      .toThrow('Email hoặc mật khẩu không đúng');
  });

  it('should throw UnauthorizedError when account is not active', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      status: 'BANNED',
    });

    // Act & Assert
    await expect(authService.login(validLoginData))
      .rejects
      .toThrow('Tài khoản đã bị khóa');
  });
});

// ===========================================================================
// GET PROFILE TESTS
// ===========================================================================
describe('authService.getProfile', () => {
  const mockUser = {
    id: 'user-123',
    username: 'john_doe',
    email: 'john@example.com',
    passwordHash: 'hashed',
    fullName: 'John Doe',
    role: { id: 1, name: 'CUSTOMER' },
    addresses: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user profile successfully', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    // Act
    const result = await authService.getProfile('user-123');

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe('user-123');
    expect(result.username).toBe('john_doe');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should throw NotFoundError when user not found', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(authService.getProfile('non-existent'))
      .rejects
      .toThrow(NotFoundError);
  });
});

// ===========================================================================
// CHANGE PASSWORD TESTS
// ===========================================================================
describe('authService.changePassword', () => {
  const userId = 'user-123';
  const changePasswordData = {
    currentPassword: 'oldpass123',
    newPassword: 'newpass456',
    confirmPassword: 'newpass456',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should change password successfully', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue({
      id: userId,
      passwordHash: bcrypt.hashSync('oldpass123', 10),
    });
    mockPrisma.user.update.mockResolvedValue({ id: userId });
    mockPrisma.session.updateMany.mockResolvedValue({ count: 1 });

    // Act & Assert - should not throw
    await expect(authService.changePassword(userId, changePasswordData))
      .resolves
      .not.toThrow();
    
    expect(mockPrisma.user.update).toHaveBeenCalled();
    expect(mockPrisma.session.updateMany).toHaveBeenCalled(); // Sessions should be revoked
  });

  it('should throw error when current password is wrong', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue({
      id: userId,
      passwordHash: bcrypt.hashSync('different-password', 10),
    });

    // Act & Assert
    await expect(authService.changePassword(userId, changePasswordData))
      .rejects
      .toThrow('Mật khẩu hiện tại không đúng');
  });

  it('should throw NotFoundError when user not found', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(authService.changePassword(userId, changePasswordData))
      .rejects
      .toThrow(NotFoundError);
  });
});

// ===========================================================================
// LOGOUT TESTS
// ===========================================================================
describe('authService.logout', () => {
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should logout successfully with refresh token', async () => {
    // Arrange
    const refreshToken = 'valid-refresh-token';
    const hashedToken = bcrypt.hashSync(refreshToken, 10);
    
    mockPrisma.session.findMany.mockResolvedValue([
      { id: 'session-123', refreshTokenHash: hashedToken, revoked: false },
    ]);
    mockPrisma.session.update.mockResolvedValue({ id: 'session-123', revoked: true });

    // Act & Assert
    await expect(authService.logout(refreshToken, userId))
      .resolves
      .not.toThrow();
  });

  it('should revoke all sessions when no refresh token provided', async () => {
    // Arrange
    mockPrisma.session.updateMany.mockResolvedValue({ count: 3 });

    // Act & Assert
    await expect(authService.logout(undefined, userId))
      .resolves
      .not.toThrow();

    expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  });
});
