import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DailyReportAggregatorService } from './daily-report-aggregator.service';

/**
 * DailyReportScheduler
 *
 * Handles scheduled generation of daily reports for all active admissions.
 * Reference: SDS Section 4.5.3 (Daily Report Aggregation Service)
 * Requirements: REQ-FR-040
 */
@Injectable()
export class DailyReportScheduler {
  private readonly logger = new Logger(DailyReportScheduler.name);

  constructor(private readonly aggregator: DailyReportAggregatorService) {}

  /**
   * Run at midnight to generate previous day's reports
   * Cron: 0 0 * * * (Every day at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyReports(): Promise<void> {
    this.logger.log('Starting scheduled daily report generation...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const count = await this.aggregator.generateAllDailyReports(yesterday);

      this.logger.log(
        `Scheduled daily report generation completed: ${count} reports for ${yesterday.toISOString().split('T')[0]}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Scheduled daily report generation failed: ${message}`);
    }
  }

  /**
   * Manual trigger for generating reports (for testing or recovery)
   */
  async triggerGeneration(date: Date): Promise<number> {
    this.logger.log(
      `Manual daily report generation triggered for ${date.toISOString().split('T')[0]}`,
    );

    const count = await this.aggregator.generateAllDailyReports(date);

    this.logger.log(`Manual generation completed: ${count} reports generated`);
    return count;
  }
}
