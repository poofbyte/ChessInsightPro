import React from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export const PanelStack = React.memo(({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className={cn("flex flex-col gap-4 sm:gap-5 w-full", className)}>
      {children}
    </div>
  );
});
