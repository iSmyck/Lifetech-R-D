import { ActionBlock as ActionBlockType } from "../../types";
import { Check, Download, Save, Upload } from "lucide-react";

const actionIcons = {
  export: Download,
  save: Save,
  publish: Upload,
};

const actionColors = {
  export: "text-accent-mint-text bg-accent-mint-bg",
  save: "text-accent-sky-text bg-accent-sky-bg",
  publish: "text-accent-lavender-text bg-accent-lavender-bg",
};

interface Props {
  block: ActionBlockType;
  delay: number;
}

export function ActionBlock({ block, delay }: Props) {
  const Icon = actionIcons[block.actionType];
  const colorClass = actionColors[block.actionType];

  return (
    <div
      className="block-enter flex items-center justify-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${colorClass}`}>
        <Icon className="w-3.5 h-3.5" />
        {block.message}
      </div>
    </div>
  );
}
