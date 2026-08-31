import NoteForm from "@/components/NoteForm";

export default function NewNotePage({ searchParams }: { searchParams: { parent?: string } }) {
  const parentId = !searchParams.parent || searchParams.parent === "root" ? null : searchParams.parent;
  return <NoteForm parentId={parentId} />;
}
