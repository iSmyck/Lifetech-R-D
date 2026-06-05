import { knowledgeAssets } from "../../lib/data";
import { FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const statusIcons = {
  uploaded: FileText,
  processing: Loader2,
  indexed: CheckCircle2,
  error: AlertCircle,
};

const statusColors = {
  uploaded: "text-text-tertiary",
  processing: "text-amber-500",
  indexed: "text-emerald-500",
  error: "text-red-500",
};

const statusLabels = {
  uploaded: "Uploaded",
  processing: "Processing",
  indexed: "Indexed",
  error: "Error",
};

export function KnowledgeTab() {
  return (
    <div className="px-3 py-2 space-y-3">
      <div className="px-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
        Brand Assets
      </div>
      <div className="space-y-2">
        {knowledgeAssets.map((asset) => {
          const Icon = statusIcons[asset.status];
          const colorClass = statusColors[asset.status];
          const isProcessing = asset.status === "processing";
          return (
            <div
              key={asset.id}
              className="p-2.5 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${colorClass} ${isProcessing ? "animate-spin" : ""}`} />
                <span className="text-sm font-medium text-text-primary truncate flex-1">
                  {asset.name}
                </span>
                <span className={`text-[11px] font-medium ${colorClass}`}>
                  {statusLabels[asset.status]}
                </span>
              </div>
              {asset.excerpt && (
                <p className="mt-1.5 text-xs text-text-tertiary line-clamp-2 leading-relaxed">
                  {asset.excerpt}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
