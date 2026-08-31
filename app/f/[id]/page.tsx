import FolderBrowser from "@/components/FolderBrowser";

export default function FolderPage({ params }: { params: { id: string } }) {
  const folderId = params.id === "root" ? null : params.id;
  return <FolderBrowser folderId={folderId} />;
}
