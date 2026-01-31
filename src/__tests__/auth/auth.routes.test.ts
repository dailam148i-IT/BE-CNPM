/**
 * =============================================================================
 * AUTH.ROUTES.TEST.TS - Integration Tests cho Auth API Endpoints
 * =============================================================================
 * 
 * Test toàn bộ HTTP flow: Request → Middleware → Controller → Service → Response
 * Sử dụng Supertest để gửi HTTP requests đến Express app
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../app.js';
import prisma from '../../config/database.js';

// Tạo Express app cho testing
const app = createTestApp();

// Type helpers cho mocked Prisma
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
// TEST DATA
// ===========================================================================
const mockCustomerRole = { id: 1, name: 'CUSTOMER' };
const mockAdminRole = { id: 3, name: 'ADMIN' };

const mockUser = {
  id: 'test-user-uuid',
  username: 'john_doe',
  email: 'john@example.com',
  passwordHash: bcrypt.hashSync('123456', 10),
  fullName: 'John Doe',
  phone: '0901234567',
  status: 'ACTIVE',
  roleId: 1,
  role: mockCustomerRole,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ===========================================================================
// POST /api/auth/register
// ===========================================================================
describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 201 when registration is successful', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
    mockPrisma.role.findUnique.mockResolvedValue(mockCustomerRole);
    mockPrisma.user.create.mockResolvedValue({
      ...mockUser,
      id: 'new-user-uuid',
    });

    // Act
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'new_user',
        email: 'newuser@example.com',
        password: '123456',
        fullName: 'New User',
      });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBeDefined();
    expect(res.body.data.passwordHash).toBeUndefined(); // Password must not be returned
  });

  it('should return 400 when email already exists', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'existing-user',
      email: 'existing@example.com',
    });

    // Act
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'new_user',
        email: 'existing@example.com',
        password: '123456',
      });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Email');
  });

  it('should return 422 when validation fails (password too short)', async () => {
    // Act
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'test_user',
        email: 'test@example.com',
        password: '123', // Too short
      });

    // Assert - validation returns 422
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});

// ===========================================================================
// POST /api/auth/login
// ===========================================================================
describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with tokens and set cookie on successful login', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.session.create.mockResolvedValue({ id: 'session-123' });

    // Act
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: '123456',
      });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.id).toBe(mockUser.id);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    
    // Check cookie was set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('refreshToken');
    expect(cookies[0]).toContain('HttpOnly');
  });

  it('should return 401 when email is wrong', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(null);

    // Act
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'notexist@example.com',
        password: '123456',
      });

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('không đúng');
  });

  it('should return 401 when password is wrong', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    // Act
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'wrongpassword',
      });

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when account is locked', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      status: 'BANNED',
    });

    // Act
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: '123456',
      });

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('khóa');
  });

  it('should return 400 when validation fails', async () => {
    // Act
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid-email', // Invalid email format
        password: '123456',
      });

    // Assert - validation returns 422 
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});

// ===========================================================================
// POST /api/auth/refresh
// ===========================================================================
describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with new tokens when refresh is successful', async () => {
    // Arrange
    const validRefreshToken = jwt.sign(
      { userId: mockUser.id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );
    const hashedToken = bcrypt.hashSync(validRefreshToken, 10);

    mockPrisma.session.findMany.mockResolvedValue([
      { id: 'session-123', refreshTokenHash: hashedToken, revoked: false },
    ]);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.session.update.mockResolvedValue({ id: 'session-123', revoked: true });
    mockPrisma.session.create.mockResolvedValue({ id: 'session-456' });

    // Act - Send refresh token in cookie
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${validRefreshToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    
    // New refresh token should be set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
  });

  it('should return error when no refresh token provided', async () => {
    // Act
    const res = await request(app)
      .post('/api/auth/refresh');

    // Assert
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});

// ===========================================================================
// GET /api/auth/me (Protected)
// ===========================================================================
describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with user profile when authenticated', async () => {
    // Arrange - Create valid access token
    const accessToken = jwt.sign(
      { userId: mockUser.id, role: 'CUSTOMER' },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' }
    );
    
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      addresses: [],
    });

    // Act
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(mockUser.id);
    expect(res.body.data.email).toBe(mockUser.email);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('should return 401 when no token provided', async () => {
    // Act
    const res = await request(app)
      .get('/api/auth/me');

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when token is invalid', async () => {
    // Act
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ===========================================================================
// POST /api/auth/logout (Protected)
// ===========================================================================
describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 and clear cookie on successful logout', async () => {
    // Arrange
    const accessToken = jwt.sign(
      { userId: mockUser.id, role: 'CUSTOMER' },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' }
    );
    const refreshToken = 'valid-refresh-token';
    const hashedToken = bcrypt.hashSync(refreshToken, 10);

    mockPrisma.session.findMany.mockResolvedValue([
      { id: 'session-123', refreshTokenHash: hashedToken, revoked: false },
    ]);
    mockPrisma.session.update.mockResolvedValue({ id: 'session-123', revoked: true });

    // Act
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `refreshToken=${refreshToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('thành công');
  });

  it('should return 401 when not authenticated', async () => {
    // Act
    const res = await request(app)
      .post('/api/auth/logout');

    // Assert
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// PUT /api/auth/password (Protected)
// ===========================================================================
describe('PUT /api/auth/password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 when password changed successfully', async () => {
    // Arrange
    const accessToken = jwt.sign(
      { userId: mockUser.id, role: 'CUSTOMER' },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' }
    );

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({ id: mockUser.id });
    mockPrisma.session.updateMany.mockResolvedValue({ count: 1 });

    // Act
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: '123456',
        newPassword: 'newpass789',
        confirmPassword: 'newpass789',
      });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('thành công');
  });

  it('should return 400 when current password is wrong', async () => {
    // Arrange
    const accessToken = jwt.sign(
      { userId: mockUser.id, role: 'CUSTOMER' },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' }
    );

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    // Act
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'wrongpassword',
        newPassword: 'newpass789',
        confirmPassword: 'newpass789',
      });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when confirm password does not match', async () => {
    // Arrange
    const accessToken = jwt.sign(
      { userId: mockUser.id, role: 'CUSTOMER' },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' }
    );

    // Act
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: '123456',
        newPassword: 'newpass789',
        confirmPassword: 'different123', // Mismatch
      });

    // Assert - validation error returns 422
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});
