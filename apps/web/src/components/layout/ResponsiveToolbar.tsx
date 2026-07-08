import React from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * A responsive toolbar that ensures controllers (buttons, toggles, selects)
 * are spaced consistently and wrap gracefully on small screens.
 */
export const ResponsiveToolbar = React.memo(({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 sm:gap-3 w-full", className)}>
      {children}
    </div>
  );
});
