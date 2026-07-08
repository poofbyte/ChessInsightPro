import React from "react";

export function ResponsiveTable({
  headers,
  data,
  renderRow,
  keyExtractor,
}: {
  headers: React.ReactNode[];
  data: any[];
  renderRow: (item: any, isMobile: boolean) => React.ReactNode;
  keyExtractor: (item: any) => string | number;
}) {
  return (
    <div className="w-full">
      {/* Desktop Table (Hidden on Mobile) */}
      <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-border bg-card/40">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-black/5 dark:bg-slate-900 border-b border-border sticky top-0 z-10">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-4 font-black tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={keyExtractor(item)} className="border-b border-border/50 last:border-0 hover:bg-black/5 dark:hover:bg-slate-800/40 transition">
                {renderRow(item, false)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout (Hidden on Desktop) */}
      <div className="md:hidden space-y-4 w-full">
        {data.map((item) => (
          <div key={keyExtractor(item)} className="p-4 rounded-xl border border-border bg-card/40 shadow-sm flex flex-col gap-3">
            {renderRow(item, true)}
          </div>
        ))}
      </div>
    </div>
  );
}
