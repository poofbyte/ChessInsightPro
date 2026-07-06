export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface OverviewMetrics {
  totalUsers: number;
  totalSessions: number;
  activeUsers24h: number;
  totalEvents: number;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface ProductMetrics {
  pageViews: ChartDataPoint[];
  featureUsage: { feature: string; count: number }[];
}

export interface ChessMetrics {
  analysisVolume: ChartDataPoint[];
  importSources: { source: string; count: number }[];
  avgAnalysisDuration: number;
}

export interface LearningMetrics {
  modulesCompleted: ChartDataPoint[];
  avgScore: number;
}

export interface PuzzleMetrics {
  successRates: { ratingBracket: string; rate: number }[];
  attempts: ChartDataPoint[];
}

export interface TrainingMetrics {
  sessionDurations: ChartDataPoint[];
  completionRates: number;
}

export interface PlayerMetrics {
  eloDistributions: { bracket: string; count: number }[];
  weaknessesDetected: { weakness: string; count: number }[];
}

export interface EngineMetrics {
  averageLoad: ChartDataPoint[];
  avgAnalysisTime: number;
}

export interface RetentionMetrics {
  cohorts: { cohortMonth: string; month1: number; month2: number; month3: number }[];
  dailyReturnRate: number;
}

export interface IntelligenceRepository {
  getOverviewMetrics(range: DateRange): Promise<OverviewMetrics>;
  getProductMetrics(range: DateRange): Promise<ProductMetrics>;
  getChessMetrics(range: DateRange): Promise<ChessMetrics>;
  getLearningMetrics(range: DateRange): Promise<LearningMetrics>;
  getPuzzleMetrics(range: DateRange): Promise<PuzzleMetrics>;
  getTrainingMetrics(range: DateRange): Promise<TrainingMetrics>;
  getPlayerMetrics(range: DateRange): Promise<PlayerMetrics>;
  getEngineMetrics(range: DateRange): Promise<EngineMetrics>;
  getRetentionMetrics(range: DateRange): Promise<RetentionMetrics>;
}
