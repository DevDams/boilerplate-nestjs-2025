import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordValidator {
    constructor(private configService: ConfigService) { }

    /**
     * Validates a password against security requirements
     * @param password The password to validate
     * @returns Object containing validation result and reasons for failure
     */
    validate(password: string): {
        isValid: boolean;
        reasons: string[];
    } {
        const minLength = this.configService.get<number>('auth.passwordMinLength') || 8;
        const reasons: string[] = [];

        // Check password length
        if (!password || password.length < minLength) {
            reasons.push(`Password must be at least ${minLength} characters long`);
        }

        // Check for at least one lowercase letter
        if (!/[a-z]/.test(password)) {
            reasons.push('Password must contain at least one lowercase letter');
        }

        // Check for at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            reasons.push('Password must contain at least one uppercase letter');
        }

        // Check for at least one number
        if (!/\d/.test(password)) {
            reasons.push('Password must contain at least one number');
        }

        // Check for at least one special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            reasons.push('Password must contain at least one special character');
        }

        // Ensure no common password patterns
        const commonPatterns = [
            'password',
            '123456',
            'qwerty',
            'admin',
            'welcome',
            'abc123',
        ];

        if (commonPatterns.some(pattern =>
            password.toLowerCase().includes(pattern))) {
            reasons.push('Password contains common patterns that are easily guessed');
        }

        return {
            isValid: reasons.length === 0,
            reasons,
        };
    }
} 