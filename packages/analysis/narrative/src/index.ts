import { CoachStyle, ExplanationProvider, MoveAnalysisFacts, MoveClassification } from "@chessinsight/types";

export class TemplateExplanationProvider implements ExplanationProvider {
  async explainMove(facts: MoveAnalysisFacts, style: CoachStyle): Promise<string> {
    const { moveType, hangingPiece, tacticalMotifs, positionalFeatures, materialDelta, initiativeChange, bestAlternativeMove } = facts;

    // 1. MINIMAL STYLE: short and concise
    if (style === CoachStyle.Minimal) {
      let desc = `${moveType.toUpperCase()}`;
      if (tacticalMotifs.length > 0) desc += ` (${tacticalMotifs.join(", ")})`;
      return desc;
    }

    // 2. ROAST STYLE: humorous, sarcastic, clean
    if (style === CoachStyle.Roast) {
      switch (moveType) {
        case MoveClassification.Brilliant:
          return "Wait... did you actually calculate that sacrifice, or was it a mouse slip? Either way, it's brilliant! Play of the century!";
        case MoveClassification.Great:
          return "Not bad at all! You actually shifted the balance of power. Keep this up and you might accidentally win!";
        case MoveClassification.Best:
          return "Look at you finding the best move! Stockfish is proud of you. Did you turn on an engine?";
        case MoveClassification.Excellent:
          return "A solid, sensible move. I'm surprised you didn't play something weird here.";
        case MoveClassification.Good:
          return "It's a playable move. Not the best, but hey, we take what we can get at this level.";
        case MoveClassification.Inaccuracy:
          if (bestAlternativeMove) {
            return `Hmm, that move is a bit off-target. You played this, but ${bestAlternativeMove} was much cleaner. Just sayin'.`;
          }
          return "Hmm, that move is a bit off-target. You had better options, but it could be worse.";
        case MoveClassification.Mistake:
          if (tacticalMotifs.includes("Pin")) {
            return `Ouch, walking into a pin? Now your piece is frozen like a statue. You should have played ${bestAlternativeMove || "better"}.`;
          }
          if (tacticalMotifs.includes("Fork")) {
            return `Did you miss the double attack? You just let yourself get forked. ${bestAlternativeMove ? "A move like " + bestAlternativeMove + " was much safer." : ""}`;
          }
          return `That's a mistake. You just gave your opponent an opening. ${bestAlternativeMove ? "You should have played " + bestAlternativeMove + " instead." : "Hope they don't notice!"}`;
        case MoveClassification.Blunder:
          if (hangingPiece) {
            return "Are you playing charity chess? You just left a piece hanging out there for free! Total disaster.";
          }
          if (tacticalMotifs.includes("Fork")) {
            return `A fork! You just let your pieces get caught in a double attack. ${bestAlternativeMove ? "Stockfish wanted " + bestAlternativeMove : "Where is your board vision?"}`;
          }
          return `Yikes, that's a blunder! You just walked right into a tactical trap. ${bestAlternativeMove ? "You should have played " + bestAlternativeMove : "Smh."}`;
        case MoveClassification.Book:
          return "Ah, a book move. You actually memorized an opening. Congratulations, you can read theory!";
        case MoveClassification.Forced:
          return "Well, you had no other options, so I guess you get credit for not playing an illegal move.";
        default:
          return "A move was played. Moving on.";
      }
    }

    // 3. BEGINNER STYLE: simple language, focus on basic rules
    if (style === CoachStyle.Beginner) {
      switch (moveType) {
        case MoveClassification.Brilliant:
          return "This is a brilliant move! You gave up a piece to gain a much bigger attack or win a better position.";
        case MoveClassification.Great:
          return "Great job! This move helps you control the game and makes your position much stronger.";
        case MoveClassification.Best:
          return "This was the best move available on the board. Excellent choice!";
        case MoveClassification.Excellent:
          return "An excellent move! It helps keep your pieces active and safe.";
        case MoveClassification.Good:
          return "A good, safe move that helps keep your position steady.";
        case MoveClassification.Inaccuracy:
          if (bestAlternativeMove) {
            return `This move is okay, but there was a better square for your piece. Playing ${bestAlternativeMove} would have been stronger.`;
          }
          return "This move is okay, but there was a slightly better square for your piece.";
        case MoveClassification.Mistake:
          if (hangingPiece) {
            return `Be careful! You left a piece undefended. Next time, try playing ${bestAlternativeMove || "defensively"} to keep it safe.`;
          }
          return `This is a mistake. It gives your opponent a chance to start attacking you. ${bestAlternativeMove ? "It was better to play " + bestAlternativeMove : ""}`;
        case MoveClassification.Blunder:
          if (hangingPiece) {
            return "Oh no! You left your piece unprotected. Your opponent can capture it for free. Always check if your pieces are guarded!";
          }
          if (tacticalMotifs.includes("Fork")) {
            return `Oops! You missed a fork (a double attack on two of your pieces). ${bestAlternativeMove ? "Playing " + bestAlternativeMove + " would have protected you." : ""}`;
          }
          return `This is a blunder. It exposes your pieces to an immediate threat or loss of material. ${bestAlternativeMove ? "A better move was " + bestAlternativeMove : ""}`;
        case MoveClassification.Book:
          return "This is a common opening move that chess players have studied for a long time. It helps develop your pieces safely.";
        case MoveClassification.Forced:
          return "This was the only move you could legally play to get out of trouble.";
        default:
          return "This move keeps the game going.";
      }
    }

    // 4. FRIENDLY STYLE: encouraging and warm
    if (style === CoachStyle.Friendly) {
      switch (moveType) {
        case MoveClassification.Brilliant:
          return "Incredible move! You found a beautiful sacrifice that sets up a winning plan. Bravo!";
        case MoveClassification.Great:
          return "Awesome job! This is a really strong move that puts you in the driver's seat.";
        case MoveClassification.Best:
          return "Perfect! You played the absolute best move in this position.";
        case MoveClassification.Excellent:
          return "Excellent! You are maintaining a solid, well-coordinated position.";
        case MoveClassification.Good:
          return "Good job, this is a sensible move that keeps your plans on track.";
        case MoveClassification.Inaccuracy:
          if (bestAlternativeMove) {
            return `A decent try, but playing ${bestAlternativeMove} would have given your pieces a bit more activity. Keep it up!`;
          }
          return "A decent try, but there was a slightly more active square for your piece.";
        case MoveClassification.Mistake:
          return `Don't worry, but this move was a bit of a slip. It lets your opponent gain some activity. ${bestAlternativeMove ? "A line starting with " + bestAlternativeMove + " was stronger." : ""}`;
        case MoveClassification.Blunder:
          if (hangingPiece) {
            return "Oops! Be extra careful, you left a piece hanging there. Let's try to guard our pieces!";
          }
          if (tacticalMotifs.includes("Fork")) {
            return `Ah, watch out! You walked into a double attack (fork). ${bestAlternativeMove ? "A move like " + bestAlternativeMove + " would keep you safe." : "We've all been there!"}`;
          }
          return `Oops! That move creates some danger for you. ${bestAlternativeMove ? "Playing " + bestAlternativeMove + " was a safer way to defend." : "Let's look for a defensive block next time."}`;
        case MoveClassification.Book:
          return "Nice! You are following standard opening theory. Keep up the solid start!";
        case MoveClassification.Forced:
          return "Good job finding the only escape! This was a forced move.";
        default:
          return "A solid move. Let's keep going!";
      }
    }

    // 5. TACTICAL STYLE: focus on tactics, forks, pins, skewers
    if (style === CoachStyle.Tactical) {
      let text = "";
      if (tacticalMotifs.length > 0) {
        text += `Tactical motifs: ${tacticalMotifs.join(", ")}. `;
      }
      if (moveType === MoveClassification.Blunder || moveType === MoveClassification.Mistake) {
        text += "Your move conceded a tactical weakness. ";
        if (hangingPiece) text += "An undefended piece is vulnerable to direct capture. ";
        if (bestAlternativeMove) text += `A better tactical line was starting with the move ${bestAlternativeMove}.`;
      } else {
        text += `A precise tactical choice (${moveType}) keeping the threats active.`;
      }
      return text;
    }

    // 6. POSITIONAL STYLE: space, outposts, files, pawn structure
    if (style === CoachStyle.Positional) {
      let text = "";
      if (positionalFeatures.length > 0) {
        text += `Key positional features: ${positionalFeatures.join(", ")}. `;
      }
      if (initiativeChange === "Gained") {
        text += "This move gains the initiative and active control of space. ";
      } else if (initiativeChange === "Lost") {
        text += "This move yields the initiative to the opponent, weakening square control. ";
      }
      text += `Positional evaluation: ${moveType}.`;
      return text;
    }

    // 7. DEFAULT: PROFESSIONAL STYLE
    switch (moveType) {
      case MoveClassification.Brilliant:
        return "An exceptional sacrifice that creates a decisive tactical or positional advantage.";
      case MoveClassification.Great:
        return "A highly impactful move that significantly improves your standing in the position.";
      case MoveClassification.Best:
        return "This is the optimal move, matching top computer recommendations.";
      case MoveClassification.Excellent:
        return "An excellent move that maintains the balance of the position and keeps pieces active.";
      case MoveClassification.Good:
        return "A solid, playable move that maintains your positional structure.";
      case MoveClassification.Inaccuracy:
        const altText = bestAlternativeMove ? `, whereas ${bestAlternativeMove} was superior` : "";
        return `This move is slightly inaccurate${altText}. It yields some positional pressure.`;
      case MoveClassification.Mistake:
        const misText = bestAlternativeMove ? `. The engine recommends ${bestAlternativeMove} as a stronger alternative` : "";
        return `A mistake that compromises your structure or lets the opponent increase their activity${misText}.`;
      case MoveClassification.Blunder:
        if (hangingPiece) {
          return "A critical blunder. A piece is left hanging and can be captured without compensation.";
        }
        const blunText = bestAlternativeMove ? `. Best continuation was ${bestAlternativeMove}` : "";
        return `A critical blunder. This move overlooks an immediate tactical threat, resulting in a loss of material or checkmate danger${blunText}.`;
      case MoveClassification.Book:
        return "A standard book move, following established opening theory.";
      case MoveClassification.Forced:
        return "The only viable response in this position to avoid immediate loss.";
      default:
        return "A move that maintains positional play.";
    }
  }
}

export class NarrativeGenerator {
  private provider: ExplanationProvider;

  constructor(provider: ExplanationProvider = new TemplateExplanationProvider()) {
    this.provider = provider;
  }

  async generate(facts: MoveAnalysisFacts, style: CoachStyle): Promise<string> {
    return this.provider.explainMove(facts, style);
  }
}
