import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenBlacklist } from '../schemas/token-blacklist.schema';
import { TokenService } from '../../common/services/token.service';

@Injectable()
export class TokenBlacklistService {
    constructor(
        @InjectModel(TokenBlacklist.name)
        private tokenBlacklistModel: Model<TokenBlacklist>,
        private tokenService: TokenService,
    ) { }

    /**
     * Add a token to the blacklist
     * @param token The token to blacklist
     * @param userId Optional user ID associated with the token
     * @param tokenType Type of token (refresh, access, etc.)
     * @param expiresAt When the token expires
     * @param reason Optional reason for blacklisting
     * @returns The created blacklist record
     */
    async blacklistToken(
        token: string,
        tokenType: 'refresh' | 'access' | 'magic-link' | 'reset-password',
        userId?: string,
        expiresAt?: Date,
        reason?: string,
    ): Promise<TokenBlacklist> {
        // Hash the token for secure storage
        const tokenHash = this.tokenService.hashToken(token);

        // Use provided expiration or calculate based on token type
        const effectiveExpiresAt = expiresAt || this.calculateExpiration(tokenType);

        // Create and return the blacklist record
        return this.tokenBlacklistModel.create({
            tokenHash,
            tokenType,
            userId,
            expiresAt: effectiveExpiresAt,
            reason: reason || 'User-initiated logout',
        });
    }

    /**
     * Check if a token is blacklisted
     * @param token The token to check
     * @returns True if the token is blacklisted, false otherwise
     */
    async isTokenBlacklisted(token: string): Promise<boolean> {
        const tokenHash = this.tokenService.hashToken(token);
        const blacklistedToken = await this.tokenBlacklistModel.findOne({
            tokenHash,
        }).exec();

        return !!blacklistedToken;
    }

    /**
     * Blacklist all tokens for a user
     * @param userId The user ID
     * @param reason Reason for blacklisting
     * @returns Count of affected tokens
     */
    async blacklistAllUserTokens(
        userId: string,
        reason = 'Security measure',
    ): Promise<number> {
        // Find existing tokens for the user that are not yet expired
        const tokens = await this.tokenBlacklistModel.find({
            userId,
            expiresAt: { $gt: new Date() },
        }).exec();

        // Mark all as blacklisted
        if (tokens.length > 0) {
            await this.tokenBlacklistModel.updateMany(
                { userId },
                { $set: { reason } },
            ).exec();
        }

        return tokens.length;
    }

    /**
     * Calculate token expiration based on type
     * @param tokenType Type of the token
     * @returns Expiration date
     */
    private calculateExpiration(
        tokenType: 'refresh' | 'access' | 'magic-link' | 'reset-password',
    ): Date {
        const now = new Date();

        switch (tokenType) {
            case 'access':
                // Access tokens typically expire in 15-60 minutes
                now.setMinutes(now.getMinutes() + 60);
                break;
            case 'refresh':
                // Refresh tokens can last 7-30 days
                now.setDate(now.getDate() + 30);
                break;
            case 'magic-link':
            case 'reset-password':
                // These typically expire in 10-30 minutes
                now.setMinutes(now.getMinutes() + 30);
                break;
            default:
                // Default expiration of 24 hours
                now.setHours(now.getHours() + 24);
        }

        return now;
    }

    /**
     * Clean up expired tokens (typically run as a scheduled task)
     * @returns Number of deleted tokens
     */
    async cleanupExpiredTokens(): Promise<number> {
        const result = await this.tokenBlacklistModel.deleteMany({
            expiresAt: { $lt: new Date() },
        }).exec();

        return result.deletedCount;
    }
} 