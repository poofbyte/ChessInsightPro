import { MoveAnalysisFacts } from "./analysis";

export enum CoachStyle {
  Professional = "professional",
  Friendly = "friendly",
  Beginner = "beginner",
  Roast = "roast",
  Positional = "positional",
  Tactical = "tactical",
  Minimal = "minimal"
}

export interface ExplanationProvider {
  explainMove(facts: MoveAnalysisFacts, style: CoachStyle): Promise<string>;
}
