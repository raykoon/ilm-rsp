export type UserRole = 'super_admin' | 'admin' | 'doctor' | 'nurse' | 'patient'

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  clinicId?: string
  
  // 个人信息
  fullName: string
  phone?: string
  avatarUrl?: string
  
  // 医生专用字段
  medicalLicense?: string
  specialty?: string
  title?: string
  
  // 患者专用字段
  birthDate?: string
  gender?: string
  guardianName?: string
  guardianPhone?: string
  emergencyContact?: string
  emergencyPhone?: string
  
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  isActive: boolean
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  error?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  fullName: string
  role: UserRole
  phone?: string
  clinicId?: string
}

export interface ResetPasswordRequest {
  email: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
  avatarUrl?: string
  specialty?: string
  title?: string
}
