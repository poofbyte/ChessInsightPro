import React from "react";
import { Activity } from "lucide-react";

export default function GenericPlaceholder({ title, description }: { title: string, description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
        <Activity className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-white">Aggregating Data...</h3>
        <p className="text-slate-400 mt-2">More data is required to generate this report.</p>
      </div>
    </div>
  );
}
