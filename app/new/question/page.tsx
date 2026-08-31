import QuestionForm from "@/components/QuestionForm";

export default function NewQuestionPage({ searchParams }: { searchParams: { parent?: string } }) {
  const parentId = !searchParams.parent || searchParams.parent === "root" ? null : searchParams.parent;
  return <QuestionForm parentId={parentId} />;
}
