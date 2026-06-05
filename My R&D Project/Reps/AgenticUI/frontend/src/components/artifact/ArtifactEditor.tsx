import { useState } from "react";
import { Artifact } from "../../types";

interface Props {
  artifact: Artifact;
}

export function ArtifactEditor({ artifact }: Props) {
  const [content, setContent] = useState(artifact.content);

  return (
    <div className="max-w-3xl mx-auto px-8 py-8 h-full">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-full min-h-[400px] p-4 rounded-xl border border-stone-200 bg-stone-50/50 text-[15px] text-text-primary leading-relaxed font-mono resize-none outline-none focus:border-stone-300 transition-colors"
        spellCheck={false}
      />
    </div>
  );
}
