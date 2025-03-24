import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
    constructor(private configService: ConfigService) { }

    /**
     * Generate a secure random token for various purposes
     * @param length The length of the token (default: 32)
     * @returns A secure random token string
     */
    generateSecureToken(length = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate a numeric token (for 2FA, PIN codes, etc.)
     * @param digits The number of digits in the token (default: 6)
     * @returns A secure random numeric token
     */
    generateNumericToken(digits = 6): string {
        const min = Math.pow(10, digits - 1);
        const max = Math.pow(10, digits) - 1;
        const randomNumber = Math.floor(
            min + crypto.randomInt(max - min + 1)
        );
        return randomNumber.toString().padStart(digits, '0');
    }

    /**
     * Hash a token for secure storage
     * @param token The token to hash
     * @returns The hashed token
     */
    hashToken(token: string): string {
        return crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
    }

    /**
     * Verify a token against its hashed value
     * @param plainToken The plain text token to verify
     * @param hashedToken The stored hashed token
     * @returns True if the token matches the hash, false otherwise
     */
    verifyToken(plainToken: string, hashedToken: string): boolean {
        const calculatedHash = this.hashToken(plainToken);
        return crypto.timingSafeEqual(
            Buffer.from(calculatedHash, 'hex'),
            Buffer.from(hashedToken, 'hex')
        );
    }

    /**
     * Generate an expiration date for a token
     * @param expiresInMinutes Minutes until the token expires (default: 15)
     * @returns The expiration date
     */
    getExpirationDate(expiresInMinutes = 15): Date {
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + expiresInMinutes);
        return expirationDate;
    }

    /**
     * Check if a token is expired
     * @param expirationDate The expiration date of the token
     * @returns True if the token is expired, false otherwise
     */
    isTokenExpired(expirationDate: Date): boolean {
        return new Date() > expirationDate;
    }
} 