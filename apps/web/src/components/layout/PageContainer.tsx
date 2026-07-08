import React from "react";
import { cn } from "@/lib/utils";

export const PageContainer = React.memo(({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col flex-1 w-full min-h-0 overflow-y-auto bg-background", className)}>
      {children}
    </div>
  );
});
