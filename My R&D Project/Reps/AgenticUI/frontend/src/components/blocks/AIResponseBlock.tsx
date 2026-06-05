import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AIResponseBlock as AIResponseBlockType } from "../../types";

interface Props {
  block: AIResponseBlockType;
  delay: number;
}

export function AIResponseBlock({ block, delay }: Props) {
  return (
    <div
      className="block-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="markdown-content text-[15px] text-text-primary leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {block.content}
        </ReactMarkdown>
      </div>
      {block.citations && block.citations.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {block.citations.map((citation) => (
            <button
              key={citation.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-50 border border-stone-100 text-[11px] text-text-secondary hover:bg-stone-100 transition-colors"
            >
              <span className="text-sky-600 font-medium">[{citation.number}]</span>
              <span className="truncate max-w-[200px]">{citation.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
