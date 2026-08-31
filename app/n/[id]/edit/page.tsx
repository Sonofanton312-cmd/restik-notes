"use client";

import { useEffect, useState } from "react";
import { AppNode } from "@/types/node";
import { useData } from "@/lib/DataContext";
import QuestionForm from "@/components/QuestionForm";
import NoteForm from "@/components/NoteForm";

export default function EditNodePage({ params }: { params: { id: string } }) {
  const data = useData();
  const [node, setNode] = useState<AppNode | null | undefined>(undefined);

  useEffect(() => {
    data.getNode(params.id).then(setNode);
  }, [data, params.id]);

  if (node === undefined) return null;
  if (node === null) {
    return <p className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-ink-faint">Not found.</p>;
  }
  if (node.type === "question") return <QuestionForm existing={node} />;
  if (node.type === "note") return <NoteForm existing={node} />;

  return (
    <p className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-ink-faint">
      This item type doesn&apos;t have a dedicated editor — use rename/move from the ⋮ menu instead.
    </p>
  );
}
