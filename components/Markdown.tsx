import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import "katex/dist/katex.min.css";
import { Info, AlertTriangle, Lightbulb, AlertCircle } from "lucide-react";

const CALLOUT_STYLES: Record<string, { icon: typeof Info; label: string; className: string }> = {
  note: { icon: Info, label: "Note", className: "border-accent/40 bg-accent/5" },
  important: { icon: AlertCircle, label: "Important", className: "border-accent-2/40 bg-accent-2/10" },
  tip: { icon: Lightbulb, label: "Tip", className: "border-accent/40 bg-accent/5" },
  warning: { icon: AlertTriangle, label: "Warning", className: "border-red-500/40 bg-red-500/5" }
};

// Bold-label paragraphs recognized as callouts, e.g. "**Important:** …"
// Only these exact, common exam-note labels — nothing else is reinterpreted,
// so ordinary bold text in the middle of a sentence is never touched.
const LABEL_PATTERN = /^(note|important|key point|exam tip|remember|warning):\s*/i;
function labelToCalloutKey(label: string): keyof typeof CALLOUT_STYLES {
  const l = label.toLowerCase();
  if (l === "important" || l === "key point") return "important";
  if (l === "exam tip" || l === "remember" || l === "tip") return "tip";
  if (l === "warning") return "warning";
  return "note";
}

import { Fragment, cloneElement, isValidElement, ReactNode } from "react";

function textOf(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node.props?.children) return textOf(node.props.children);
  return "";
}

/** Removes the leading "[!NOTE] " marker from the first text leaf only,
 *  so the callout body doesn't repeat its own type tag. */
function stripFirstMarker(children: ReactNode): ReactNode {
  let done = false;
  function walk(node: ReactNode): ReactNode {
    if (done) return node;
    if (typeof node === "string") {
      const m = node.match(/^\[!(NOTE|IMPORTANT|TIP|WARNING)\]\s*/i);
      if (m) {
        done = true;
        return node.slice(m[0].length);
      }
      return node;
    }
    if (Array.isArray(node)) return node.map((n, i) => <Fragment key={i}>{walk(n)}</Fragment>);
    if (isValidElement(node) && (node.props as any)?.children !== undefined) {
      return cloneElement(node as any, undefined, walk((node.props as any).children));
    }
    return node;
  }
  return walk(children);
}

/**
 * Renders note/question answers written in Markdown.
 *
 * - GitHub-flavoured Markdown (tables, strikethrough, task lists) via remark-gfm
 * - LaTeX math via remark-math + rehype-katex ($inline$ and $$block$$)
 * - Heading anchors via rehype-slug, so a table of contents can jump to them
 * - Fenced ```text code blocks render as a monospace diagram block that
 *   preserves exact spacing and scrolls horizontally — this is what keeps
 *   ASCII diagrams (like the 8085 flag register) intact.
 * - Two safe, explicit callout patterns, never invented content:
 *   - GitHub-style alerts: "> [!NOTE]", "> [!IMPORTANT]", "> [!TIP]", "> [!WARNING]"
 *   - A paragraph starting with a bold label: "**Important:** …"
 */
export default function Markdown({ content }: { content: string }) {
  return (
    <div className="note-prose prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeSlug, rehypeKatex]}
        components={{
          pre({ children }) {
            return <pre className="diagram-block">{children}</pre>;
          },
          code({ className, children, node, ...props }) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          blockquote({ children }) {
            const text = textOf(children).trim();
            const match = text.match(/^\[!(NOTE|IMPORTANT|TIP|WARNING)\]\s*/i);
            if (match) {
              const key = match[1].toLowerCase() as keyof typeof CALLOUT_STYLES;
              const style = CALLOUT_STYLES[key];
              const Icon = style.icon;
              return (
                <div className={`not-prose flex gap-2.5 rounded-lg border px-4 py-3 my-4 text-sm text-ink-dim ${style.className}`}>
                  <Icon size={16} className="shrink-0 mt-0.5 text-ink" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mb-1">{style.label}</p>
                    <div className="[&>p]:m-0">{stripFirstMarker(children)}</div>
                  </div>
                </div>
              );
            }
            return <blockquote>{children}</blockquote>;
          },
          p({ children }) {
            const flat = Array.isArray(children) ? children : [children];
            const first = flat[0];
            const firstText = textOf(first);
            const boldMatch =
              first &&
              typeof first === "object" &&
              (first as any).type === "strong" &&
              firstText.match(LABEL_PATTERN);

            if (boldMatch) {
              const key = labelToCalloutKey(boldMatch[1]);
              const style = CALLOUT_STYLES[key];
              const Icon = style.icon;
              const rest = flat.slice(1);
              return (
                <div className={`not-prose flex gap-2.5 rounded-lg border px-4 py-3 my-4 text-sm text-ink-dim ${style.className}`}>
                  <Icon size={16} className="shrink-0 mt-0.5 text-ink" />
                  <p className="m-0">
                    <span className="font-medium text-ink">{style.label}: </span>
                    {rest}
                  </p>
                </div>
              );
            }
            return <p>{children}</p>;
          },
          img({ src, alt }) {
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={src} alt={alt || ""} loading="lazy" className="max-w-full h-auto" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
