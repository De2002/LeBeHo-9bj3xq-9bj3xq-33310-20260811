import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const IMAGE_URL_PATTERN = /^(https?:\/\/\S+\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]\S*)?)$/i;

function normalizeImageUrls(content: string) {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (IMAGE_URL_PATTERN.test(trimmed) && !trimmed.startsWith('![')) {
        return `![Embedded image](${trimmed})`;
      }
      return line;
    })
    .join('\n');
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node: _node, ...props }) => (
            <img
              {...props}
              loading="lazy"
              className="my-4 max-h-[32rem] w-auto max-w-full rounded-xl border border-[hsl(var(--border-subtle))] object-contain"
              alt={props.alt || 'Image included in this point'}
            />
          ),
          a: ({ node: _node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer"
              className="text-[hsl(var(--accent-primary))] underline underline-offset-4 hover:opacity-80"
            />
          ),
          code: ({ node: _node, className: codeClassName, children, ...props }) => (
            <code
              {...props}
              className={`${codeClassName ?? ''} rounded bg-[hsl(var(--surface-hover))] px-1.5 py-0.5 font-mono text-[0.9em] text-[hsl(var(--text-primary))]`}
            >
              {children}
            </code>
          ),
        }}
      >
        {normalizeImageUrls(content)}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
