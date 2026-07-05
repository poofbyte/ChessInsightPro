import { EngineLine, EngineProvider } from "@chessinsight/types";

export const getResultProperty = (
  result: string,
  property: string
): string | undefined => {
  const splitResult = result.split(" ");
  const propertyIndex = splitResult.indexOf(property);

  if (propertyIndex === -1 || propertyIndex + 1 >= splitResult.length) {
    return undefined;
  }

  return splitResult[propertyIndex + 1];
};

export const parseUciLine = (result: string): EngineLine | null => {
  if (!result.startsWith("info")) return null;

  const splitResult = result.split(" ");
  const pvIndex = splitResult.indexOf("pv");
  if (pvIndex === -1 || pvIndex + 1 >= splitResult.length) {
    return null;
  }
  const pv = splitResult.slice(pvIndex + 1);

  const depthStr = getResultProperty(result, "depth");
  const multiPvStr = getResultProperty(result, "multipv") || "1";
  const cpStr = getResultProperty(result, "cp");
  const mateStr = getResultProperty(result, "mate");

  return {
    pv,
    depth: depthStr ? parseInt(depthStr, 10) : 0,
    multiPv: parseInt(multiPvStr, 10),
    cp: cpStr ? parseInt(cpStr, 10) : undefined,
    mate: mateStr ? parseInt(mateStr, 10) : undefined,
  };
};

export class StockfishWasmProvider implements EngineProvider {
  private worker: Worker | null = null;
  private enginePath: string;
  private isInitialized = false;

  constructor(enginePath: string) {
    this.enginePath = enginePath;
  }

  async initialize(): Promise<void> {
    if (typeof window === "undefined" || !window.Worker) {
      throw new Error("WASM Stockfish Worker can only be initialized in a browser environment.");
    }

    this.worker = new window.Worker(this.enginePath);
    this.isInitialized = true;

    // Send uci to boot
    await this.sendUciCommand(["uci"], "uciok");
  }

  private sendUciCommand(commands: string[], resolveToken: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.worker) return reject(new Error("Worker not initialized"));

      const responses: string[] = [];
      const onMessage = (event: MessageEvent) => {
        const line = event.data as string;
        responses.push(line);
        if (line.startsWith(resolveToken)) {
          this.worker?.removeEventListener("message", onMessage);
          resolve(responses);
        }
      };

      this.worker.addEventListener("message", onMessage);
      for (const command of commands) {
        this.worker.postMessage(command);
      }
    });
  }

  async evaluatePosition(
    fen: string,
    depth: number,
    multiPv: number,
    onUpdate?: (lines: EngineLine[]) => void
  ): Promise<EngineLine[]> {
    if (!this.isInitialized || !this.worker) {
      throw new Error("Engine not initialized. Call initialize() first.");
    }

    // Set engine parameters and position
    await this.sendUciCommand([`setoption name MultiPV value ${multiPv}`, "isready"], "readyok");
    await this.sendUciCommand([`position fen ${fen}`, "isready"], "readyok");

    // Start evaluation and wait for bestmove
    return new Promise((resolve) => {
      const tempLines: Record<number, EngineLine> = {};

      const onMessage = (event: MessageEvent) => {
        const line = event.data as string;
        if (line.startsWith("info")) {
          const parsed = parseUciLine(line);
          if (parsed) {
            tempLines[parsed.multiPv] = parsed;
            const updated = Object.values(tempLines).sort((a, b) => a.multiPv - b.multiPv);
            onUpdate?.(updated);
          }
        }
        if (line.startsWith("bestmove")) {
          this.worker?.removeEventListener("message", onMessage);
          const finalLines = Object.values(tempLines).sort((a, b) => a.multiPv - b.multiPv);
          resolve(finalLines);
        }
      };

      this.worker?.addEventListener("message", onMessage);
      this.worker?.postMessage(`go depth ${depth}`);
    });
  }

  stop(): void {
    this.worker?.postMessage("stop");
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
    this.isInitialized = false;
  }
}
