import type { UserRole } from "./enums";

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  totalDonated: number;
  donationCount: number;
  preferredCurrency: string;
  preferredLanguage: string;
  marketingConsent: boolean;
  smsConsent: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface UserRegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  marketingConsent?: boolean;
  smsConsent?: boolean;
}

export interface UserLoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserDto;
  token: string;
}

export interface AdminDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface AuditLogDto {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLogDto {
  id: string;
  type: string;
  sessionId?: string;
  userId?: string;
  page?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
