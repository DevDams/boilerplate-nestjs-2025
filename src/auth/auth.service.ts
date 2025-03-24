import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../database/users/users.service';
import { EmailService } from '../common/services/email.service';
import { User } from '../database/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { randomDigits } from 'crypto-secure-random-digit';

@Injectable()
export class AuthService {
  private readonly failedLoginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Check if user is locked out due to too many failed attempts
    const emailKey = email.toLowerCase();
    const failedAttempt = this.failedLoginAttempts.get(emailKey);
    const maxAttempts = this.configService.get<number>('auth.passwordMaxAttempts') || 5;
    const lockoutMinutes = this.configService.get<number>('auth.lockoutTime') || 15;
    
    if (failedAttempt && failedAttempt.count >= maxAttempts) {
      const lockoutTime = new Date(failedAttempt.lastAttempt.getTime() + lockoutMinutes * 60000);
      if (new Date() < lockoutTime) {
        // User is still in lockout period
        const minutesLeft = Math.ceil((lockoutTime.getTime() - new Date().getTime()) / 60000);
        throw new ForbiddenException(`Account temporarily locked. Try again in ${minutesLeft} minutes.`);
      } else {
        // Lockout period has passed, reset counter
        this.failedLoginAttempts.delete(emailKey);
      }
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Increment failed login attempts for security
      this.incrementFailedAttempts(emailKey);
      return null;
    }

    // Use the comparePassword method from the User schema
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      this.incrementFailedAttempts(emailKey);
      return null;
    }

    // Successful login, reset failed attempts
    this.failedLoginAttempts.delete(emailKey);

    const { password: _, ...result } = user.toObject();
    return result;
  }

  private incrementFailedAttempts(email: string): void {
    const current = this.failedLoginAttempts.get(email) || { count: 0, lastAttempt: new Date() };
    
    current.count += 1;
    current.lastAttempt = new Date();
    
    this.failedLoginAttempts.set(email, current);
  }

  async login(user: any) {
    // Generate a unique refresh token
    const refreshToken = this.generateSecureToken();
    
    // Save the hashed refresh token in the database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.saveRefreshToken(user._id.toString(), hashedRefreshToken);
    
    const payload = { 
      email: user.email, 
      sub: user._id,
      role: user.role,
      permissions: user.permissions || []
    };
    
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user,
    };
  }

  async register(userData: { name: string; email: string; password: string }) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    
    // Validate password strength
    const minLength = this.configService.get<number>('auth.passwordMinLength') || 8;
    if (userData.password && userData.password.length < minLength) {
      throw new BadRequestException(`Password must be at least ${minLength} characters long`);
    }
    
    // Check password complexity
    if (userData.password && !this.isPasswordStrong(userData.password)) {
      throw new BadRequestException('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character');
    }

    // Create the user with password
    const user = await this.usersService.create(userData);
    
    // Generate verification token
    const verificationToken = this.generateSecureToken();
    
    // Save token to user
    await this.usersService.saveMagicLinkToken(user._id.toString(), verificationToken);
    
    // Send verification email
    await this.emailService.sendEmailVerification(userData.email, verificationToken);

    const { password: _, ...result } = user.toObject();
    return result;
  }
  
  private isPasswordStrong(password: string): boolean {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  }

  async sendMagicLink(email: string) {
    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // For security, don't reveal if the email doesn't exist
      return { message: 'If your email is registered, you will receive a magic link' };
    }

    // Generate magic link token
    const token = this.generateToken();
    
    // Save token to user
    const expiresIn = 30 * 60 * 1000; // 30 minutes
    const expiryDate = new Date(Date.now() + expiresIn);
    await this.usersService.saveMagicLinkToken(user._id.toString(), token, expiryDate);
    
    // Send magic link email
    await this.emailService.sendMagicLink(email, token);

    return { message: 'If your email is registered, you will receive a magic link' };
  }

  async verifyMagicLink(email: string, token: string) {
    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.magicLinkToken || user.magicLinkToken !== token) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    // Check if token is expired
    if (user.magicLinkExpires && user.magicLinkExpires < new Date()) {
      throw new UnauthorizedException('Magic link has expired');
    }

    // Clear the magic link token
    await this.usersService.clearMagicLinkToken(user._id.toString());

    // Generate JWT tokens for the user
    const payload = { 
      email: user.email, 
      sub: user._id,
      role: user.role,
      permissions: user.permissions || []
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret') || 'super-refresh-secret-key',
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '30d',
      }),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        permissions: user.permissions || []
      },
    };
  }

  async forgotPassword(email: string) {
    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // For security, don't reveal if the email doesn't exist
      return { message: 'If your email is registered, you will receive a password reset link' };
    }

    // Generate reset token
    const token = this.generateToken();
    
    // Save token to user
    const expiresIn = 30 * 60 * 1000; // 30 minutes
    const expiryDate = new Date(Date.now() + expiresIn);
    await this.usersService.saveMagicLinkToken(user._id.toString(), token, expiryDate);
    
    // Send password reset email
    await this.emailService.sendPasswordReset(email, token);

    return { message: 'If your email is registered, you will receive a password reset link' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.magicLinkToken || user.magicLinkToken !== token) {
      throw new UnauthorizedException('Invalid or expired password reset link');
    }

    // Check if token is expired
    if (user.magicLinkExpires && user.magicLinkExpires < new Date()) {
      throw new UnauthorizedException('Password reset link has expired');
    }

    // Update password and clear magic link token
    await this.usersService.resetPassword(user._id.toString(), newPassword);

    return { message: 'Password has been successfully reset' };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify the refresh token matches
    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isRefreshTokenValid) {
      // If token is invalid, revoke all refresh tokens for security
      await this.usersService.saveRefreshToken(userId, null);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens (token rotation)
    const newRefreshToken = this.generateSecureToken();
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    
    // Save the new refresh token
    await this.usersService.saveRefreshToken(userId, hashedNewRefreshToken);
    
    // Generate new payload
    const newPayload = { 
      email: user.email, 
      sub: user._id,
      role: user.role,
      permissions: user.permissions || []
    };
    
    return {
      accessToken: this.jwtService.sign(newPayload),
      refreshToken: newRefreshToken,
    };
  }
  
  async logout(userId: string) {
    // Invalidate the refresh token
    await this.usersService.saveRefreshToken(userId, null);
    return { success: true };
  }

  // Helper methods
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  private generateSecureToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }
} 