import React from "react";

export function PageContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col flex-1 w-full min-h-0 overflow-y-auto bg-background ${className}`}>
      {children}
    </div>
  );
}
