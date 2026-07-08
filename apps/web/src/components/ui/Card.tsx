import React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card/80 border border-border rounded-2xl shadow-lg p-5 sm:p-6 lg:p-8 flex flex-col gap-4 w-full ${className}`}>
      {children}
    </div>
  );
}
