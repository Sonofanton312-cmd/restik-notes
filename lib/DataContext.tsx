"use client";

import { createContext, useContext, useMemo, useRef, useState, ReactNode, useCallback } from "react";
import { AppNode, NodePath, SearchHit, NodeType, Importance, Attachment } from "@/types/node";
import { createSampleTree } from "@/lib/sample-tree";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface QuestionInput {
  name: string;
  question: string;
  answer: string;
  marks?: number;
  tags?: string[];
  importance?: Importance;
}

export interface NoteInput {
  name: string;
  body: string;
}

export interface LinkInput {
  name: string;
  url: string;
  description?: string;
}

export interface DataApi {
  configured: boolean;
  userEmail: string | null;

  listChildren(parentId: string | null): Promise<AppNode[]>;
  getNode(id: string): Promise<AppNode | null>;
  getPath(id: string): Promise<NodePath>;
  listAllFolders(): Promise<{ node: AppNode; path: NodePath }[]>;
  listTrash(): Promise<AppNode[]>;
  countDescendants(id: string): Promise<number>;
  searchNodes(query: string): Promise<SearchHit[]>;
  listRecent(limit?: number): Promise<{ node: AppNode; path: NodePath }[]>;
  listImportant(): Promise<{ node: AppNode; path: NodePath }[]>;
  exportTree(): Promise<AppNode[]>;

  createFolder(parentId: string | null, name: string): Promise<AppNode>;
  createQuestion(parentId: string | null, data: QuestionInput): Promise<AppNode>;
  updateQuestion(id: string, data: Partial<QuestionInput>): Promise<AppNode>;
  createNote(parentId: string | null, data: NoteInput): Promise<AppNode>;
  updateNote(id: string, data: Partial<NoteInput>): Promise<AppNode>;
  createLink(parentId: string | null, data: LinkInput): Promise<AppNode>;
  updateLink(id: string, data: Partial<LinkInput>): Promise<AppNode>;

  uploadFile(parentId: string | null, file: File): Promise<AppNode>;
  addAttachment(questionId: string, file: File): Promise<AppNode>;
  removeAttachment(questionId: string, attachmentId: string): Promise<AppNode>;
  getFileUrl(storagePath: string): Promise<string>;

  rename(id: string, name: string): Promise<AppNode>;
  move(id: string, newParentId: string | null): Promise<AppNode>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  permanentDelete(id: string): Promise<void>;
}

const DataContext = createContext<(DataApi & { version: number }) | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const api = useMemo<DataApi>(() => (configured ? createSupabaseApi(bump) : createLocalApi(bump)), [configured, bump]);

  const value = useMemo(() => ({ ...api, version }), [api, version]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}

// ---------------------------------------------------------------------
// LOCAL (in-memory, no Supabase) implementation
// ---------------------------------------------------------------------

function createLocalApi(bump: () => void): DataApi {
  // A module-level store shared by every consumer within this browser tab
  // for the lifetime of the page. Resets on refresh — this is a demo mode,
  // clearly labelled as such in the UI.
  if (!(globalThis as any).__restikLocalStore) {
    (globalThis as any).__restikLocalStore = createSampleTree();
  }
  const store: AppNode[] = (globalThis as any).__restikLocalStore;

  function touch(node: AppNode) {
    node.updatedAt = new Date().toISOString();
  }

  function descendantIds(id: string): string[] {
    const ids = [id];
    let frontier = [id];
    while (frontier.length) {
      const next = store.filter((n) => frontier.includes(n.parentId ?? "")).map((n) => n.id);
      ids.push(...next);
      frontier = next;
    }
    return ids;
  }

  function pathFor(id: string): NodePath {
    const path: NodePath = [];
    let current = store.find((n) => n.id === id);
    while (current) {
      path.unshift({ id: current.id, name: current.name, type: current.type });
      current = current.parentId ? store.find((n) => n.id === current!.parentId) : undefined;
    }
    return path;
  }

  return {
    configured: false,
    userEmail: null,

    async listChildren(parentId) {
      return store
        .filter((n) => n.parentId === parentId && !n.deletedAt)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    },

    async getNode(id) {
      return store.find((n) => n.id === id && !n.deletedAt) ?? null;
    },

    async getPath(id) {
      return pathFor(id);
    },

    async listAllFolders() {
      return store
        .filter((n) => n.type === "folder" && !n.deletedAt)
        .map((node) => ({ node, path: pathFor(node.id) }));
    },

    async listTrash() {
      return store.filter((n) => n.deletedAt).sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
    },

    async countDescendants(id) {
      return Math.max(descendantIds(id).length - 1, 0);
    },

    async searchNodes(query) {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      const terms = q.split(/\s+/).filter(Boolean);
      const hits: SearchHit[] = [];
      for (const node of store) {
        if (node.deletedAt) continue;
        const haystack = [
          node.name,
          "question" in node.content ? (node.content as any).question : "",
          "answer" in node.content ? (node.content as any).answer : "",
          "body" in node.content ? (node.content as any).body : "",
          (node.metadata.tags ?? []).join(" ")
        ]
          .join(" ")
          .toLowerCase();
        if (terms.every((t) => haystack.includes(t))) {
          hits.push({ node, path: pathFor(node.id) });
        }
      }
      return hits.slice(0, 30);
    },

    async listRecent(limit = 10) {
      return [...store]
        .filter((n) => !n.deletedAt && n.type !== "folder")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, limit)
        .map((node) => ({ node, path: pathFor(node.id) }));
    },

    async listImportant() {
      return store
        .filter((n) => !n.deletedAt && n.metadata.importance === "High")
        .map((node) => ({ node, path: pathFor(node.id) }));
    },

    async exportTree() {
      return store.filter((n) => !n.deletedAt);
    },

    async createFolder(parentId, name) {
      const node: AppNode = {
        id: newId(),
        parentId,
        type: "folder",
        name,
        content: {},
        metadata: {},
        sortOrder: store.filter((n) => n.parentId === parentId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };
      store.push(node);
      bump();
      return node;
    },

    async createQuestion(parentId, data) {
      const node: AppNode = {
        id: newId(),
        parentId,
        type: "question",
        name: data.name,
        content: { question: data.question, answer: data.answer },
        metadata: { marks: data.marks, tags: data.tags ?? [], importance: data.importance ?? "None" },
        sortOrder: store.filter((n) => n.parentId === parentId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };
      store.push(node);
      bump();
      return node;
    },

    async updateQuestion(id, data) {
      const node = store.find((n) => n.id === id);
      if (!node) throw new Error("Question not found");
      if (data.name !== undefined) node.name = data.name;
      const content = node.content as any;
      if (data.question !== undefined) content.question = data.question;
      if (data.answer !== undefined) content.answer = data.answer;
      if (data.marks !== undefined) node.metadata.marks = data.marks;
      if (data.tags !== undefined) node.metadata.tags = data.tags;
      if (data.importance !== undefined) node.metadata.importance = data.importance;
      touch(node);
      bump();
      return node;
    },

    async createNote(parentId, data) {
      const node: AppNode = {
        id: newId(),
        parentId,
        type: "note",
        name: data.name,
        content: { body: data.body },
        metadata: {},
        sortOrder: store.filter((n) => n.parentId === parentId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };
      store.push(node);
      bump();
      return node;
    },

    async updateNote(id, data) {
      const node = store.find((n) => n.id === id);
      if (!node) throw new Error("Note not found");
      if (data.name !== undefined) node.name = data.name;
      if (data.body !== undefined) (node.content as any).body = data.body;
      touch(node);
      bump();
      return node;
    },

    async createLink(parentId, data) {
      const node: AppNode = {
        id: newId(),
        parentId,
        type: "link",
        name: data.name,
        content: { url: data.url, description: data.description },
        metadata: {},
        sortOrder: store.filter((n) => n.parentId === parentId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };
      store.push(node);
      bump();
      return node;
    },

    async updateLink(id, data) {
      const node = store.find((n) => n.id === id);
      if (!node) throw new Error("Link not found");
      if (data.name !== undefined) node.name = data.name;
      const content = node.content as any;
      if (data.url !== undefined) content.url = data.url;
      if (data.description !== undefined) content.description = data.description;
      touch(node);
      bump();
      return node;
    },

    async uploadFile() {
      throw new Error("Connect Supabase to upload files — see the README's setup steps.");
    },

    async addAttachment() {
      throw new Error("Connect Supabase to add attachments — see the README's setup steps.");
    },

    async removeAttachment(questionId, attachmentId) {
      const node = store.find((n) => n.id === questionId);
      if (!node) throw new Error("Question not found");
      node.metadata.attachments = (node.metadata.attachments ?? []).filter((a) => a.id !== attachmentId);
      touch(node);
      bump();
      return node;
    },

    async getFileUrl() {
      throw new Error("Connect Supabase to store and open files.");
    },

    async rename(id, name) {
      const node = store.find((n) => n.id === id);
      if (!node) throw new Error("Not found");
      node.name = name;
      touch(node);
      bump();
      return node;
    },

    async move(id, newParentId) {
      const node = store.find((n) => n.id === id);
      if (!node) throw new Error("Not found");
      if (descendantIds(id).includes(newParentId ?? "")) {
        throw new Error("Can't move a folder into itself or one of its own subfolders.");
      }
      node.parentId = newParentId;
      node.sortOrder = store.filter((n) => n.parentId === newParentId).length;
      touch(node);
      bump();
      return node;
    },

    async softDelete(id) {
      const now = new Date().toISOString();
      for (const did of descendantIds(id)) {
        const n = store.find((x) => x.id === did);
        if (n) n.deletedAt = now;
      }
      bump();
    },

    async restore(id) {
      for (const did of descendantIds(id)) {
        const n = store.find((x) => x.id === did);
        if (n) n.deletedAt = null;
      }
      bump();
    },

    async permanentDelete(id) {
      const ids = new Set(descendantIds(id));
      for (let i = store.length - 1; i >= 0; i--) {
        if (ids.has(store[i].id)) store.splice(i, 1);
      }
      bump();
    }
  };
}

// ---------------------------------------------------------------------
// SUPABASE implementation
// ---------------------------------------------------------------------

type Row = {
  id: string;
  parent_id: string | null;
  type: NodeType;
  name: string;
  content: any;
  metadata: any;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function rowToNode(r: Row): AppNode {
  return {
    id: r.id,
    parentId: r.parent_id,
    type: r.type,
    name: r.name,
    content: r.content ?? {},
    metadata: { ...(r.metadata ?? {}), tags: r.tags ?? [] },
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at
  };
}

function createSupabaseApi(bump: () => void): DataApi {
  const supabase = createSupabaseBrowserClient()!;
  let cachedEmail: string | null = null;
  supabase.auth.getUser().then(({ data }) => (cachedEmail = data.user?.email ?? null));

  async function requireUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Sign in to make changes — go to /login.");
    return data.user.id;
  }

  async function insertNode(partial: Partial<Row> & { type: NodeType; name: string; parent_id: string | null }) {
    const { data, error } = await supabase
      .from("nodes")
      .insert({ content: {}, metadata: {}, tags: [], sort_order: 0, ...partial })
      .select()
      .single();
    if (error) throw error;
    bump();
    return rowToNode(data as Row);
  }

  async function updateNode(id: string, patch: Partial<Row>) {
    const { data, error } = await supabase.from("nodes").update(patch).eq("id", id).select().single();
    if (error) throw error;
    bump();
    return rowToNode(data as Row);
  }

  async function pathFor(id: string): Promise<NodePath> {
    const { data, error } = await supabase.rpc("get_node_path", { target_id: id });
    if (error) throw error;
    return (data as { id: string; name: string; type: NodeType }[]).map((r) => ({ id: r.id, name: r.name, type: r.type }));
  }

  return {
    configured: true,
    get userEmail() {
      return cachedEmail;
    },

    async listChildren(parentId) {
      let query = supabase.from("nodes").select("*").is("deleted_at", null);
      query = parentId === null ? query.is("parent_id", null) : query.eq("parent_id", parentId);
      const { data, error } = await query.order("sort_order", { ascending: true }).order("name", { ascending: true });
      if (error) throw error;
      return (data as Row[]).map(rowToNode);
    },

    async getNode(id) {
      const { data, error } = await supabase.from("nodes").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
      if (error) throw error;
      return data ? rowToNode(data as Row) : null;
    },

    async getPath(id) {
      return pathFor(id);
    },

    async listAllFolders() {
      const { data, error } = await supabase.from("nodes").select("*").eq("type", "folder").is("deleted_at", null);
      if (error) throw error;
      const nodes = (data as Row[]).map(rowToNode);
      const paths = await Promise.all(nodes.map((n) => pathFor(n.id)));
      return nodes.map((node, i) => ({ node, path: paths[i] }));
    },

    async listTrash() {
      const { data, error } = await supabase
        .from("nodes")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return (data as Row[]).map(rowToNode);
    },

    async countDescendants(id) {
      const { data, error } = await supabase.rpc("get_descendant_ids", { target_id: id });
      if (error) throw error;
      return Math.max((data as { id: string }[]).length - 1, 0);
    },

    async searchNodes(query) {
      const { data, error } = await supabase.rpc("search_nodes", { search_query: query });
      if (error) throw error;
      const nodes = (data as Row[]).map(rowToNode);
      const paths = await Promise.all(nodes.map((n) => pathFor(n.id)));
      return nodes.map((node, i) => ({ node, path: paths[i] }));
    },

    async listRecent(limit = 10) {
      const { data, error } = await supabase
        .from("nodes")
        .select("*")
        .is("deleted_at", null)
        .neq("type", "folder")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const nodes = (data as Row[]).map(rowToNode);
      const paths = await Promise.all(nodes.map((n) => pathFor(n.id)));
      return nodes.map((node, i) => ({ node, path: paths[i] }));
    },

    async listImportant() {
      const { data, error } = await supabase
        .from("nodes")
        .select("*")
        .is("deleted_at", null)
        .eq("metadata->>importance", "High");
      if (error) throw error;
      const nodes = (data as Row[]).map(rowToNode);
      const paths = await Promise.all(nodes.map((n) => pathFor(n.id)));
      return nodes.map((node, i) => ({ node, path: paths[i] }));
    },

    async exportTree() {
      const { data, error } = await supabase.from("nodes").select("*").is("deleted_at", null);
      if (error) throw error;
      return (data as Row[]).map(rowToNode);
    },

    async createFolder(parentId, name) {
      const owner = await requireUserId();
      return insertNode({ owner, parent_id: parentId, type: "folder", name } as any);
    },

    async createQuestion(parentId, data) {
      const owner = await requireUserId();
      return insertNode({
        owner,
        parent_id: parentId,
        type: "question",
        name: data.name,
        content: { question: data.question, answer: data.answer },
        metadata: { marks: data.marks, importance: data.importance ?? "None" },
        tags: data.tags ?? []
      } as any);
    },

    async updateQuestion(id, data) {
      const patch: Partial<Row> = {};
      if (data.name !== undefined) patch.name = data.name;
      if (data.question !== undefined || data.answer !== undefined) {
        const existing = await this.getNode(id);
        patch.content = {
          question: data.question ?? (existing?.content as any)?.question ?? "",
          answer: data.answer ?? (existing?.content as any)?.answer ?? ""
        };
      }
      if (data.marks !== undefined || data.importance !== undefined) {
        const existing = await this.getNode(id);
        patch.metadata = {
          ...(existing?.metadata ?? {}),
          marks: data.marks ?? existing?.metadata.marks,
          importance: data.importance ?? existing?.metadata.importance
        };
      }
      if (data.tags !== undefined) patch.tags = data.tags;
      return updateNode(id, patch);
    },

    async createNote(parentId, data) {
      const owner = await requireUserId();
      return insertNode({
        owner,
        parent_id: parentId,
        type: "note",
        name: data.name,
        content: { body: data.body }
      } as any);
    },

    async updateNote(id, data) {
      const patch: Partial<Row> = {};
      if (data.name !== undefined) patch.name = data.name;
      if (data.body !== undefined) patch.content = { body: data.body };
      return updateNode(id, patch);
    },

    async createLink(parentId, data) {
      const owner = await requireUserId();
      return insertNode({
        owner,
        parent_id: parentId,
        type: "link",
        name: data.name,
        content: { url: data.url, description: data.description }
      } as any);
    },

    async updateLink(id, data) {
      const patch: Partial<Row> = {};
      if (data.name !== undefined) patch.name = data.name;
      if (data.url !== undefined || data.description !== undefined) {
        const existing = await this.getNode(id);
        patch.content = {
          url: data.url ?? (existing?.content as any)?.url ?? "",
          description: data.description ?? (existing?.content as any)?.description
        };
      }
      return updateNode(id, patch);
    },

    async uploadFile(parentId, file) {
      const owner = await requireUserId();
      const node = await insertNode({
        owner,
        parent_id: parentId,
        type: "file",
        name: file.name,
        content: { fileName: file.name, mimeType: file.type, storagePath: "", fileSize: file.size }
      } as any);

      const path = `${owner}/${node.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      return updateNode(node.id, {
        content: { fileName: file.name, mimeType: file.type, storagePath: path, fileSize: file.size }
      });
    },

    async addAttachment(questionId, file) {
      const owner = await requireUserId();
      const attachmentId = newId();
      const path = `${owner}/${questionId}/attachments/${attachmentId}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const existing = await this.getNode(questionId);
      const attachment: Attachment = { id: attachmentId, fileName: file.name, mimeType: file.type, storagePath: path, fileSize: file.size };
      const attachments = [...(existing?.metadata.attachments ?? []), attachment];

      return updateNode(questionId, { metadata: { ...(existing?.metadata ?? {}), attachments } });
    },

    async removeAttachment(questionId, attachmentId) {
      const existing = await this.getNode(questionId);
      const target = (existing?.metadata.attachments ?? []).find((a) => a.id === attachmentId);
      if (target) await supabase.storage.from("attachments").remove([target.storagePath]);
      const attachments = (existing?.metadata.attachments ?? []).filter((a) => a.id !== attachmentId);
      return updateNode(questionId, { metadata: { ...(existing?.metadata ?? {}), attachments } });
    },

    async getFileUrl(storagePath) {
      const { data, error } = await supabase.storage.from("attachments").createSignedUrl(storagePath, 3600);
      if (error) throw error;
      return data.signedUrl;
    },

    async rename(id, name) {
      return updateNode(id, { name });
    },

    async move(id, newParentId) {
      if (newParentId) {
        const { data } = await supabase.rpc("get_descendant_ids", { target_id: id });
        const ids = new Set(((data ?? []) as { id: string }[]).map((r) => r.id));
        if (ids.has(newParentId)) {
          throw new Error("Can't move a folder into itself or one of its own subfolders.");
        }
      }
      return updateNode(id, { parent_id: newParentId });
    },

    async softDelete(id) {
      const { error } = await supabase.rpc("soft_delete_node", { target_id: id });
      if (error) throw error;
      bump();
    },

    async restore(id) {
      const { error } = await supabase.rpc("restore_node", { target_id: id });
      if (error) throw error;
      bump();
    },

    async permanentDelete(id) {
      const { data } = await supabase.rpc("get_descendant_ids", { target_id: id });
      const ids = ((data ?? []) as { id: string }[]).map((r) => r.id);
      if (ids.length) {
        const { data: rows } = await supabase.from("nodes").select("*").in("id", ids);
        const paths: string[] = [];
        for (const r of (rows ?? []) as Row[]) {
          if (r.type === "file" && r.content?.storagePath) paths.push(r.content.storagePath);
          for (const a of r.metadata?.attachments ?? []) paths.push(a.storagePath);
        }
        if (paths.length) await supabase.storage.from("attachments").remove(paths);
      }
      const { error } = await supabase.from("nodes").delete().eq("id", id);
      if (error) throw error;
      bump();
    }
  };
}
