/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@chessinsight/charts",
    "@chessinsight/chess-core",
    "@chessinsight/classifier",
    "@chessinsight/engine",
    "@chessinsight/evaluator",
    "@chessinsight/learning",
    "@chessinsight/narrative",
    "@chessinsight/player-profile",
    "@chessinsight/positional",
    "@chessinsight/puzzle-miner",
    "@chessinsight/puzzles",
    "@chessinsight/recommendations",
    "@chessinsight/tactical",
    "@chessinsight/types",
    "@chessinsight/weakness-detector",
    "@core/auth",
    "@core/config",
    "@core/content",
    "@core/db-sync",
    "@core/email",
    "@core/intelligence",
    "@core/pricing",
    "@core/quota",
    "@core/telemetry"
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
