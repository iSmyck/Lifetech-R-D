import { UserPromptBlock as UserPromptBlockType } from "../../types";
import { FileText, Link, Users, Palette, Paperclip } from "lucide-react";

const attachmentIcons: Record<string, React.ElementType> = {
  brief: FileText,
  link: Link,
  file: Paperclip,
  audience: Users,
  brand: Palette,
};

const attachmentColors: Record<string, string> = {
  brief: "bg-amber-50 text-amber-700 border-amber-100",
  link: "bg-sky-50 text-sky-700 border-sky-100",
  file: "bg-stone-100 text-stone-600 border-stone-200",
  audience: "bg-emerald-50 text-emerald-700 border-emerald-100",
  brand: "bg-purple-50 text-purple-700 border-purple-100",
};

interface Props {
  block: UserPromptBlockType;
  delay: number;
}

export function UserPromptBlock({ block, delay }: Props) {
  return (
    <div
      className="block-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-accent-lavender-bg flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-semibold text-accent-lavender-text">A</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text-primary mb-1">Alex M.</div>
          <div className="text-[15px] text-text-primary leading-relaxed whitespace-pre-wrap">
            {block.content}
          </div>
          {block.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {block.attachments.map((att) => {
                const Icon = attachmentIcons[att.type] ?? Paperclip;
                return (
                  <button
                    key={att.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:opacity-80 ${attachmentColors[att.type]}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[180px]">{att.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          {block.outputType && (
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-[11px] font-medium text-text-secondary">
              Output: {block.outputType.charAt(0).toUpperCase() + block.outputType.slice(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
