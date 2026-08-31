// The entire app is built on one recursive concept: a Node.
// A Node is either a container (folder) or a piece of content
// (question / note / file / link). Folders can contain any mix of
// other folders and content — there is no fixed "subject > topic >
// question" hierarchy anywhere in this type or in the code that uses it.

export type NodeType = "folder" | "question" | "note" | "file" | "link";

export type Importance = "High" | "Medium" | "Low" | "None";

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  storagePath: string;
  fileSize: number;
}

/** type === "question" */
export interface QuestionContent {
  question: string;
  answer: string; // Markdown
}

/** type === "note" */
export interface NoteContent {
  body: string; // Markdown
}

/** type === "link" */
export interface LinkContent {
  url: string;
  description?: string;
}

/** type === "file" */
export interface FileContent {
  fileName: string;
  mimeType: string;
  storagePath: string;
  fileSize: number;
}

export type NodeContent = QuestionContent | NoteContent | LinkContent | FileContent | Record<string, never>;

export interface NodeMetadata {
  marks?: number;
  tags?: string[];
  importance?: Importance;
  attachments?: Attachment[]; // attachments belong to a question, not sibling nodes
}

export interface AppNode {
  id: string;
  parentId: string | null;
  type: NodeType;
  name: string;
  content: NodeContent;
  metadata: NodeMetadata;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isSample?: boolean;
}

/** Ancestor chain from root to (and including) a node, for breadcrumbs. */
export type NodePath = Pick<AppNode, "id" | "name" | "type">[];

export interface SearchHit {
  node: AppNode;
  path: NodePath;
}
