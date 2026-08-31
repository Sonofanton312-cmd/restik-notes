import { Folder, HelpCircle, FileText, Link2, File, FileImage, Presentation } from "lucide-react";
import { AppNode } from "@/types/node";

export function nodeIconFor(node: Pick<AppNode, "type" | "content">) {
  if (node.type === "folder") return Folder;
  if (node.type === "question") return HelpCircle;
  if (node.type === "note") return FileText;
  if (node.type === "link") return Link2;
  if (node.type === "file") {
    const mime = (node.content as any)?.mimeType ?? "";
    if (mime.startsWith("image/")) return FileImage;
    if (mime.includes("presentation") || mime.includes("powerpoint")) return Presentation;
    return File;
  }
  return File;
}

export default function NodeIcon({ node, size = 16, className = "" }: { node: Pick<AppNode, "type" | "content">; size?: number; className?: string }) {
  const Icon = nodeIconFor(node);
  return <Icon size={size} className={className} />;
}
