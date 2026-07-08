import React from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * A highly resilient container for the Chessboard.
 * Ensures the board remains a perfect square, scales up to fit available width,
 * but NEVER exceeds a maximum height proportional to the viewport height (e.g., 65vh).
 * This prevents the board from pushing controllers off-screen on landscape mobile devices.
 */
export const ChessboardContainer = React.memo(({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className="w-full flex justify-center items-center">
      <div 
        className={cn(
          "w-full aspect-square mx-auto",
          // The magic formula: never let the width exceed a percentage of the viewport height.
          // Because aspect-ratio is 1/1, width = height.
          "max-w-[min(100%,_65vh)] md:max-w-[min(100%,_75vh)] lg:max-w-[min(100%,_80vh)]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
});
