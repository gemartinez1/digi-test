import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'viewer';
}

// In a real app these would live in a database with hashed passwords at rest.
// Passwords here are pre-hashed with bcrypt (cost 10).
const USERS: Array<AuthUser & { passwordHash: string }> = [
  {
    id: '1',
    username: 'admin',
    role: 'admin',
    // bcrypt hash of 'admin123'
    passwordHash: '$2b$10$bUhGO9KErofmZ/.umqAJtuIcwrm5fKQ6jw1cxtYwEGzEgpsyDwkNC',
  },
  {
    id: '2',
    username: 'viewer',
    role: 'viewer',
    // bcrypt hash of 'viewer123'
    passwordHash: '$2b$10$bmbjUJMgI14kYtYbJizvbuLS.MgvrQGyQ2PMTKk.EOtSnpPedvfhO',
  },
];

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '8h';

export function validateCredentials(
  username: string,
  password: string,
): AuthUser | null {
  const user = USERS.find((u) => u.username === username);
  if (!user) return null;
  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, username: user.username, role: user.role };
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, username: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return {
      id: payload.sub as string,
      username: payload.username as string,
      role: payload.role as AuthUser['role'],
    };
  } catch {
    return null;
  }
}
