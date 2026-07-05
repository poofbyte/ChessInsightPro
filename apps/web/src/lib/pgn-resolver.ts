/**
 * Chess.com and Lichess URL resolver — shared utility used across route pages.
 * Extracted from monolith page.tsx into a standalone module.
 */
export const resolvePgnFromUrl = async (input: string): Promise<string> => {
  const trimmed = input.trim();

  // 1. Lichess Game URL — e.g. https://lichess.org/aBcDeFgH
  const lichessRegex = /lichess\.org\/([a-zA-Z0-9]{8})/i;
  const lichessMatch = trimmed.match(lichessRegex);
  if (lichessMatch) {
    const gameId = lichessMatch[1];
    const res = await fetch(`https://lichess.org/game/export/${gameId}?clocks=true&evals=false`);
    if (!res.ok) throw new Error(`Failed to fetch game from Lichess. Status: ${res.status}`);
    return await res.text();
  }

  // 2. Chess.com Game URL — e.g. https://www.chess.com/game/live/144971919130
  const chessComRegex = /chess\.com\/game\/(live|daily)\/(\d+)/i;
  const chessComMatch = trimmed.match(chessComRegex);
  if (chessComMatch) {
    const type = chessComMatch[1].toLowerCase();
    const gameId = chessComMatch[2];

    const callbackUrl = `https://www.chess.com/callback/${type}/game/${gameId}`;
    const corsProxyUrl = (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

    let callbackRes;
    try {
      callbackRes = await fetch(corsProxyUrl(callbackUrl));
    } catch {
      callbackRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(callbackUrl)}`);
    }

    if (!callbackRes.ok) throw new Error(`Failed to retrieve Chess.com metadata. Status: ${callbackRes.status}`);

    const gameData = await callbackRes.json();
    const whitePlayer = gameData?.game?.pgnHeaders?.White || gameData?.game?.pgnHeaders?.Black;
    const dateStr = gameData?.game?.pgnHeaders?.Date;

    if (!whitePlayer || !dateStr) throw new Error("Unable to retrieve player metadata from Chess.com game page.");

    const [year, month] = dateStr.split(".");
    const archiveUrl = `https://api.chess.com/pub/player/${whitePlayer}/games/${year}/${month}`;

    let archiveRes;
    try {
      archiveRes = await fetch(archiveUrl);
      if (!archiveRes.ok) throw new Error(`Direct fetch returned status ${archiveRes.status}`);
    } catch {
      try {
        archiveRes = await fetch(corsProxyUrl(archiveUrl));
      } catch {
        archiveRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(archiveUrl)}`);
      }
    }

    if (!archiveRes.ok) throw new Error(`Failed to fetch Chess.com player monthly archives. Status: ${archiveRes.status}`);

    const archiveData = await archiveRes.json();
    const games = archiveData?.games || [];
    const targetGame = games.find((g: any) => g.url.includes(gameId) || g.pgn?.includes(gameId));

    if (!targetGame || !targetGame.pgn) throw new Error(`Game ${gameId} not found in player archives for ${year}/${month}.`);

    return targetGame.pgn;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    throw new Error("Unsupported URL. Please paste a valid Chess.com or Lichess game URL.");
  }

  return input;
};
