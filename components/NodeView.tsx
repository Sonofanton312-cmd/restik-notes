"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNode, NodePath } from "@/types/node";
import { useData } from "@/lib/DataContext";
import Breadcrumbs from "./Breadcrumbs";
import NodeIcon from "./NodeIcon";
import NodeActionsMenu from "./NodeActionsMenu";
import Markdown from "./Markdown";
import TableOfContents from "./TableOfContents";
import AttachmentsList from "./AttachmentsList";
import LinkModal from "./LinkModal";
import QuestionQuickJump from "./QuestionQuickJump";
import { formatBytes, formatDate } from "@/lib/utils";
import { Pencil, Star, ExternalLink, Download } from "lucide-react";

export default function NodeView({ nodeId }: { nodeId: string }) {
  const data = useData();
  const router = useRouter();
  const [node, setNode] = useState<AppNode | null | undefined>(undefined);
  const [path, setPath] = useState<NodePath>([]);
  const [editingLink, setEditingLink] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const n = await data.getNode(nodeId);
      if (cancelled) return;
      setNode(n);
      if (n) {
        const p = await data.getPath(nodeId);
        if (!cancelled) setPath(p.slice(0, -1));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [data, nodeId, data.version]);

  useEffect(() => {
    if (node?.type === "file") {
      const storagePath = (node.content as any).storagePath;
      if (storagePath) {
        data
          .getFileUrl(storagePath)
          .then(setFileUrl)
          .catch((e) => setFileError(e instanceof Error ? e.message : "Couldn't load this file."));
      }
    }
  }, [data, node]);

  function refresh() {
    data.getNode(nodeId).then(setNode);
  }

  if (node === undefined) return null;

  if (node === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-ink-faint">This item doesn&apos;t exist, or was moved to trash.</p>
        <Link href="/f/root" className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-sm text-ink-dim hover:bg-bg-hover">
          Back to My Notes
        </Link>
      </div>
    );
  }

  const editable = node.type === "question" || node.type === "note";

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Breadcrumbs path={path} current={node.name} />
        <div className="flex items-center gap-1 shrink-0">
          {editable && (
            <Link
              href={`/n/${node.id}/edit`}
              className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-accent transition-colors px-2 py-1"
            >
              <Pencil size={13} /> Edit
            </Link>
          )}
          <NodeActionsMenu
            node={node}
            onChanged={() => {
              data.getNode(nodeId).then((n) => {
                if (!n) router.push(node.parentId ? `/f/${node.parentId}` : "/f/root");
              });
            }}
          />
        </div>
      </div>

      {/* Quick Jump bar appears ONLY for questions */}
      {node.type === "question" && <QuestionQuickJump currentNode={node} />}

      {node.type === "question" && <QuestionBody node={node} onChanged={refresh} />}
      {node.type === "note" && <NoteBody node={node} />}
      {node.type === "link" && (
        <LinkBody node={node} onEdit={() => setEditingLink(true)} />
      )}
      {node.type === "file" && <FileBody node={node} url={fileUrl} error={fileError} />}

      {editingLink && node.type === "link" && (
        <LinkModal
          defaultValues={{ name: node.name, url: (node.content as any).url, description: (node.content as any).description }}
          onSubmit={async (values) => {
            await data.updateLink(node.id, values);
            refresh();
          }}
          onClose={() => setEditingLink(false)}
        />
      )}
    </article>
  );
}

function QuestionBody({ node, onChanged }: { node: AppNode; onChanged: () => void }) {
  const content = node.content as any;
  const meta = node.metadata;

  return (
    <>
      <header className="mb-5">
        <NodeIcon node={node} size={16} className="text-accent mb-2" />
        <h1 className="text-xl sm:text-2xl font-semibold text-ink leading-snug">{content.question}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-faint">
          {meta.marks !== undefined && meta.marks !== null && <span>{meta.marks} marks</span>}
          {meta.importance && meta.importance !== "None" && (
            <span className="flex items-center gap-1">
              <Star size={12} className={meta.importance === "High" ? "fill-accent-2 text-accent-2" : ""} />
              {meta.importance}
            </span>
          )}
          <span>updated {formatDate(node.updatedAt)}</span>
          {(meta.tags ?? []).map((t) => (
            <span key={t} className="rounded-full border border-border px-2 py-0.5">
              {t}
            </span>
          ))}
        </div>
      </header>

      <TableOfContents content={content.answer} />
      <Markdown content={content.answer} />
      <AttachmentsList node={node} onChanged={onChanged} />
    </>
  );
}

function NoteBody({ node }: { node: AppNode }) {
  const content = node.content as any;
  return (
    <>
      <header className="mb-5">
        <NodeIcon node={node} size={16} className="text-accent mb-2" />
        <h1 className="text-xl sm:text-2xl font-semibold text-ink leading-snug">{node.name}</h1>
        <p className="mt-2 text-xs text-ink-faint">updated {formatDate(node.updatedAt)}</p>
      </header>
      <TableOfContents content={content.body} />
      <Markdown content={content.body} />
    </>
  );
}

function LinkBody({ node, onEdit }: { node: AppNode; onEdit: () => void }) {
  const content = node.content as any;
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-6">
      <NodeIcon node={node} size={20} className="text-accent mb-3" />
      <h1 className="text-lg font-semibold text-ink">{node.name}</h1>
      {content.description && <p className="mt-2 text-sm text-ink-dim">{content.description}</p>}
      <p className="mt-2 text-xs text-ink-faint truncate">{content.url}</p>
      <div className="mt-4 flex items-center gap-2">
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          <ExternalLink size={14} /> Open link
        </a>
        <button onClick={onEdit} className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-ink-dim hover:bg-bg-hover">
          <Pencil size={14} /> Edit
        </button>
      </div>
    </div>
  );
}

function FileBody({ node, url, error }: { node: AppNode; url: string | null; error: string }) {
  const content = node.content as any;
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-6">
      <NodeIcon node={node} size={28} className="text-accent mb-3" />
      <h1 className="text-lg font-semibold text-ink break-words">{node.name}</h1>
      <p className="mt-1 text-xs text-ink-faint">
        {content.mimeType || "file"} · {formatBytes(content.fileSize ?? 0)}
      </p>
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          <Download size={14} /> Open / Download
        </a>
      )}
    </div>
  );
}