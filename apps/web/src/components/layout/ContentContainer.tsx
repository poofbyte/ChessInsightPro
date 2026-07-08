import React from "react";

export function ContentContainer({
  children,
  className = "",
  maxWidth = "max-w-7xl",
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "max-w-5xl" | "max-w-7xl" | "max-w-[1600px]" | "max-w-full";
}) {
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 ${maxWidth} ${className}`}>
      {children}
    </div>
  );
}
