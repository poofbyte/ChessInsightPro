import React from "react";
import { cn } from "@/lib/utils";

export const ContentContainer = React.memo(({
  children,
  className,
  maxWidth = "max-w-7xl",
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "max-w-2xl" | "max-w-3xl" | "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl" | "max-w-[1600px]" | "max-w-full";
}) => {
  return (
    <div className={cn("w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8", maxWidth, className)}>
      {children}
    </div>
  );
});
