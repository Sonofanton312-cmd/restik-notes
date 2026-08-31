import NodeView from "@/components/NodeView";

export default function NodePage({ params }: { params: { id: string } }) {
  return <NodeView nodeId={params.id} />;
}
