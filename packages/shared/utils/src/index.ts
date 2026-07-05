export const ceilsNumber = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

export const getPaddedNumber = (num: number): string => {
  return num < 10 ? `0${num}` : `${num}`;
};

export const isIosDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
};

export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};
