import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Artifact } from "../../types";

interface Props {
  artifact: Artifact;
}

export function ArtifactViewer({ artifact }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {artifact.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
