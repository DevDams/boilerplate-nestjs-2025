import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenBlacklistService } from '../../database/token-blacklist/token-blacklist.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private tokenBlacklistService: TokenBlacklistService) {}

  /**
   * Clean up expired tokens daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupTokenBlacklist() {
    this.logger.log('Running scheduled task: Cleanup token blacklist');
    try {
      const deletedCount = await this.tokenBlacklistService.cleanupExpiredTokens();
      this.logger.log(`Cleaned up ${deletedCount} expired tokens from blacklist`);
    } catch (error) {
      this.logger.error(`Error cleaning up token blacklist: ${error.message}`, error.stack);
    }
  }

  /**
   * Examples of other scheduled tasks that could be useful:
   * 
   * @Cron(CronExpression.EVERY_HOUR)
   * async sendPendingNotifications() {
   *   // Send batched notifications every hour
   * }
   * 
   * @Cron(CronExpression.EVERY_WEEK)
   * async generateAnalyticsReports() {
   *   // Generate weekly analytics reports
   * }
   * 
   * @Cron('0 0 1 * *') // First day of month at midnight
   * async monthlyDataCleanup() {
   *   // Clean up old data at the start of each month
   * }
   */
} 