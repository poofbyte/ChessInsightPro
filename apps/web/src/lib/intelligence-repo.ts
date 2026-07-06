import { Client } from "@libsql/client";
import { unstable_cache } from "next/cache";
import {
  IntelligenceRepository,
  OverviewMetrics,
  ProductMetrics,
  ChessMetrics,
  LearningMetrics,
  PuzzleMetrics,
  TrainingMetrics,
  PlayerMetrics,
  EngineMetrics,
  RetentionMetrics,
  DateRange,
  ChartDataPoint,
} from "@core/intelligence";

export class TursoIntelligenceRepository implements IntelligenceRepository {
  constructor(private dbClient: Client) {}

  private async executeQuery<T = any>(sql: string, args: any[] = []): Promise<T[]> {
    const result = await this.dbClient.execute({ sql, args });
    return result.rows as unknown as T[];
  }

  async getOverviewMetrics(range: DateRange): Promise<OverviewMetrics> {
    const start = range.startDate.getTime();
    const end = range.endDate.getTime();

    // Cache the overview stats query for 5 minutes
    const getCachedOverview = unstable_cache(
      async (s: number, e: number) => {
        const stats = await this.executeQuery(
          `SELECT 
             COUNT(DISTINCT user_id) as totalUsers,
             COUNT(DISTINCT session_id) as totalSessions,
             COUNT(event_id) as totalEvents
           FROM analytics_events 
           WHERE timestamp >= ? AND timestamp <= ?`,
          [s, e]
        );

        const active24h = await this.executeQuery(
          `SELECT COUNT(DISTINCT user_id) as activeUsers24h 
           FROM analytics_events 
           WHERE timestamp >= ?`,
          [Date.now() - 24 * 60 * 60 * 1000]
        );

        return {
          totalUsers: Number(stats[0]?.totalUsers || 0),
          totalSessions: Number(stats[0]?.totalSessions || 0),
          totalEvents: Number(stats[0]?.totalEvents || 0),
          activeUsers24h: Number(active24h[0]?.activeUsers24h || 0),
        };
      },
      ["intelligence-overview"],
      { revalidate: 300 } // 5 minutes
    );

    return getCachedOverview(start, end);
  }

  async getProductMetrics(range: DateRange): Promise<ProductMetrics> {
    const start = range.startDate.getTime();
    const end = range.endDate.getTime();

    const getCachedProduct = unstable_cache(
      async (s: number, e: number) => {
        const pageViewsRaw = await this.executeQuery(
          `SELECT 
             date(timestamp / 1000, 'unixepoch') as dateStr,
             COUNT(event_id) as count
           FROM analytics_events 
           WHERE category = 'product' AND event_type = 'PageViewed'
             AND timestamp >= ? AND timestamp <= ?
           GROUP BY dateStr
           ORDER BY dateStr ASC`,
          [s, e]
        );

        const featureUsageRaw = await this.executeQuery(
          `SELECT 
             json_extract(properties, '$.feature') as feature,
             COUNT(event_id) as count
           FROM analytics_events 
           WHERE category = 'product' AND event_type = 'FeatureUsed'
             AND timestamp >= ? AND timestamp <= ?
           GROUP BY feature
           ORDER BY count DESC
           LIMIT 10`,
          [s, e]
        );

        return {
          pageViews: pageViewsRaw.map((r: any) => ({ date: r.dateStr, count: Number(r.count) })),
          featureUsage: featureUsageRaw
            .filter((r: any) => r.feature)
            .map((r: any) => ({ feature: String(r.feature), count: Number(r.count) })),
        };
      },
      ["intelligence-product"],
      { revalidate: 300 }
    );

    return getCachedProduct(start, end);
  }

  async getChessMetrics(range: DateRange): Promise<ChessMetrics> {
    const start = range.startDate.getTime();
    const end = range.endDate.getTime();

    const analysisVolumeRaw = await this.executeQuery(
      `SELECT 
         date(timestamp / 1000, 'unixepoch') as dateStr,
         COUNT(event_id) as count
       FROM analytics_events 
       WHERE category = 'analysis' AND event_type = 'AnalysisStarted'
         AND timestamp >= ? AND timestamp <= ?
       GROUP BY dateStr
       ORDER BY dateStr ASC`,
      [start, end]
    );

    const importSourcesRaw = await this.executeQuery(
      `SELECT 
         json_extract(properties, '$.source') as source,
         COUNT(event_id) as count
       FROM analytics_events 
       WHERE category = 'analysis' AND event_type = 'AnalysisStarted'
         AND timestamp >= ? AND timestamp <= ?
       GROUP BY source
       ORDER BY count DESC`,
      [start, end]
    );

    const avgDurationRaw = await this.executeQuery(
      `SELECT AVG(json_extract(properties, '$.durationSeconds')) as avgDur
       FROM analytics_events
       WHERE category = 'analysis' AND event_type = 'AnalysisCompleted'
         AND timestamp >= ? AND timestamp <= ?`,
      [start, end]
    );

    return {
      analysisVolume: analysisVolumeRaw.map((r: any) => ({ date: r.dateStr, count: Number(r.count) })),
      importSources: importSourcesRaw
        .filter((r: any) => r.source)
        .map((r: any) => ({ source: String(r.source), count: Number(r.count) })),
      avgAnalysisDuration: Number(avgDurationRaw[0]?.avgDur || 0),
    };
  }

  // Stubbing the rest for now, they would follow the same pattern
  async getLearningMetrics(range: DateRange): Promise<LearningMetrics> {
    return { modulesCompleted: [], avgScore: 0 };
  }
  async getPuzzleMetrics(range: DateRange): Promise<PuzzleMetrics> {
    return { successRates: [], attempts: [] };
  }
  async getTrainingMetrics(range: DateRange): Promise<TrainingMetrics> {
    return { sessionDurations: [], completionRates: 0 };
  }
  async getPlayerMetrics(range: DateRange): Promise<PlayerMetrics> {
    return { eloDistributions: [], weaknessesDetected: [] };
  }
  async getEngineMetrics(range: DateRange): Promise<EngineMetrics> {
    return { averageLoad: [], avgAnalysisTime: 0 };
  }
  async getRetentionMetrics(range: DateRange): Promise<RetentionMetrics> {
    return { cohorts: [], dailyReturnRate: 0 };
  }
}
