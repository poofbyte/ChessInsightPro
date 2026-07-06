export const PRICING_CONFIG = {
  BASE_FEE_BDT: 50,
  PER_REVIEW_RATE: 0.77,
  PER_SESSION_RATE: 0.33,
  MIN_CUSTOM_PRICE: 100
};

export function calculateCustomPrice(reviews: number, sessions: number): number {
  const { BASE_FEE_BDT, PER_REVIEW_RATE, PER_SESSION_RATE, MIN_CUSTOM_PRICE } = PRICING_CONFIG;
  
  const raw = BASE_FEE_BDT + (reviews * PER_REVIEW_RATE) + (sessions * PER_SESSION_RATE);
  return Math.max(raw, MIN_CUSTOM_PRICE);
}
