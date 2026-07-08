import React from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export const Panel = React.memo(({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className={cn("p-4 sm:p-5 bg-card/80 border border-border rounded-2xl shadow-lg w-full", className)}>
      {children}
    </div>
  );
});
