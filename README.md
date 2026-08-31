# Restik Notes

A personal, GPT-style knowledge tree for your engineering exam notes. There is
no fixed "Subject → Unit → Question" hierarchy — everything is a **node**,
and folders can contain any mix of other folders, questions, notes, files,
and links, nested as deep as you want. Search, breadcrumbs, move/rename/
delete-to-trash, a Markdown question/note editor, file attachments, dark/
light/system theme, and an installable PWA are all built in.

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS · Supabase
(Postgres + Auth + Storage) · Vercel.

---

## What changed from the first version

The first build of this app used a fixed `Subject → Topic → Question`
structure. This version replaces that entirely with a recursive **node
tree** — one table (`nodes`), where every folder, question, note, file, and
link is a row that points at its parent. Nothing in the code assumes what a
folder represents; `if (type === "subject")` doesn't exist anywhere.

Scope note: a few "nice to have" ideas from the brainstorm (AI-assisted
answer enhancement, PDF export, drag-and-drop between folders, autosave
drafts, auto-generating tables from prose) were deliberately left out of
this build, per the "keep it simple, don't add what wasn't asked for"
direction. The **Move** dialog covers reorganizing folders without
drag-and-drop, and Markdown paste/preview covers the day-to-day workflow of
pasting a Claude/ChatGPT answer straight in. All of the above can be added
later without another architecture change — the node model was built to
support them.

No data migration was needed: the previous version's "sample notes" only
ever lived in bundled code, never in a real database, so there was nothing
to carry over.

---

## How this is organized

```
app/            pages (App Router) — one folder per route
  f/[id]/       folder browser (id="root" = top level)
  n/[id]/       view a question / note / file / link
  n/[id]/edit/  edit a question or note
  new/question/ new/note/   create pages
  important/ recent/ trash/ search/   smart views over the tree
components/     UI components — tree sidebar, folder browser, editors…
lib/            DataContext (the data layer), Supabase clients, utils
types/node.ts   the one recursive Node type
supabase/       schema.sql — run this once in your Supabase project
public/         manifest, icons, service worker
```

**Two data modes, one codebase**, chosen automatically based on whether
`.env.local` has Supabase credentials:

- **Local demo mode (default, zero setup):** an in-memory sample tree
  (`lib/sample-tree.ts`) that supports every action — create, rename, move,
  delete — but **resets when you refresh the page**. It exists so you can
  try the whole app immediately. File upload is disabled in this mode
  (there's nowhere durable to put the file).
- **Supabase mode:** once `.env.local` is set, all reads/writes go to your
  real Postgres database and Storage bucket, and persist across refreshes,
  logouts, and devices.

Everything in `lib/DataContext.tsx` is written against one interface
(`DataApi`), so every page and component calls the same functions
regardless of which mode is active.

---

## Phase 1 — Run it locally (no account needed)

### 1. Install prerequisites

Node.js **18.18 or newer**. Check with `node -v`; install the LTS version
from nodejs.org if needed, then restart your terminal.

### 2. Install dependencies

```bash
cd restik-notes
npm install
```

### 3. Run it

```bash
npm run dev
```

Open **http://localhost:3000**. Try:

- Expanding **College → 5th Semester → Microprocessors** in the sidebar
- Clicking **+ New** inside any folder — it's the same menu everywhere
- Creating a folder inside a folder inside a folder (no depth limit)
- Opening "Q3 — 8085 Flag Register" and checking the diagram renders correctly
- **Ctrl+K** and typing "sign flag" — search reaches into answer text, not
  just titles
- Renaming, moving, and trashing an item via its **three-dot** menu

Remember: in this mode, refreshing the page resets everything back to the
sample tree. That's expected — it's a preview, not storage. Phase 3 below
makes it permanent.

---

## Phase 2 — Recursive folders, +New everywhere, search

Already built in — nothing to configure. Worth knowing:

- **+ New** (folder / question / note / upload file / add link) behaves
  identically at the root and ten levels deep — it's the same component
  everywhere, passed whatever folder you're currently in.
- A folder can hold subfolders *and* content side by side — there's no
  mandatory "Questions" or "Files" subfolder.
- **Move** opens a searchable folder picker and blocks moving a folder into
  its own descendant (checked both in the UI and, for Supabase mode, in the
  database function itself).
- **Delete** is soft — items go to **Trash**, where they can be restored or
  permanently deleted. Deleting a folder trashes everything inside it in
  one action; restoring it brings all of that back.
- Search (`Ctrl+K`, or the `/search?q=...` page) reaches into question
  text, answer text, note bodies, and tags — not just names — and shows the
  full path to each result.

---

## Phase 3 — Connect Supabase (database, auth, file storage)

### 1. Create a Supabase project

Go to supabase.com → **New Project**. Pick a name, a strong database
password (save it), and the closest region. Takes about 2 minutes to
provision.

### 2. Create the schema

1. In Supabase, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this project, copy the whole file, paste
   it in, click **Run**.

This creates:

- The `nodes` table (one table for the entire recursive tree) with **Row
  Level Security**, so each signed-in user only ever sees their own rows.
- SQL functions used by the app: `get_node_path` (breadcrumbs),
  `soft_delete_node` / `restore_node` (cascading trash), `search_nodes`
  (full-text search), `get_descendant_ids` (used for delete confirmations
  and cleanup).
- A private Storage bucket called `attachments`, with a policy so each
  user can only read/write inside their own folder.

### 3. Get your API keys and set environment variables

**Project Settings → API** → copy the **Project URL** and **anon public**
key (not `service_role`). Then:

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Restart `npm run dev` if it was already running.

### 4. Allow local sign-in redirects

**Authentication → URL Configuration → Redirect URLs**, add
`http://localhost:3000/**` (and your Vercel URL later, see deployment
below).

### 5. Create your account

Go to `http://localhost:3000/login`, enter your email, click **Send magic
link**, click the link in your inbox. You're signed in, and everything you
create from here saves for real.

---

## Phase 4 — Build your tree

There's no sample data to work around this time — Supabase mode starts
empty. From the home page or any folder, use **+ New** to create your first
folder, then keep nesting as deep as makes sense to you: `College → 5th
Semester → Microprocessors → Unit 1`, or `GATE → ECE`, or something
entirely different next semester — nothing in the app assumes a shape.

**Questions:** Title, Question text, Answer (Markdown, with a Write/Preview
toggle) — this is where you paste a complete answer from Claude or ChatGPT.
Marks, tags, and importance are optional. Attachments (PDF, images, etc.)
can be added to a saved question from its page.

**Notes:** Title + Markdown body — for anything that isn't a Q&A.

**Files:** PDF, PPT, PPTX, DOC, DOCX, images, and most other common study
files upload straight into the current folder and open in a new tab via a
signed URL (the Storage bucket is private, so files aren't publicly
guessable).

**Links:** name + URL + optional description, for anything you just want a
bookmark to.

---

## Phase 5 — PWA / mobile install

Already configured. **iPhone (Safari):** Share → **Add to Home Screen**.
**Android (Chrome):** three-dot menu → **Add to Home screen**. The bundled
icons are simple placeholders (`public/icons/`) — swap them for your own
artwork whenever you like.

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/restik-notes.git
git branch -M main
git push -u origin main
```

### 2. Import into Vercel

vercel.com → **Add New… → Project** → select the repo. Next.js is
auto-detected. Under **Environment Variables**, add the same two values
from `.env.local`. Click **Deploy**.

### 3. Allow the deployed URL in Supabase

**Authentication → URL Configuration → Redirect URLs** → add
`https://your-app.vercel.app/**`.

### 4. Open it from anywhere

Same URL, same account, same tree — phone, laptop, tablet, or a college
computer.

---

## Verification checklist

- [x] Desktop layout (sidebar tree + header + content)
- [x] Mobile layout (hamburger → drawer with the same tree)
- [x] **+ New** works identically at every depth — root, 1 level, 4+ levels
- [x] Folders can contain folders *and* content side by side, at any depth
- [x] Questions store Question + Answer (Markdown) + marks/tags/importance,
      persisted in the database, not just frontend state
- [x] Answer rendering: headings, bold/italic, lists, tables, math, code,
      ASCII diagrams (exact spacing preserved, horizontally scrollable),
      heading-based table of contents, explicit callout boxes
      (`> [!NOTE]` / `**Important:** …`) — nothing invented or reworded
- [x] File upload → Supabase Storage, private bucket, signed-URL open
- [x] Question attachments (separate from sibling file nodes)
- [x] Move (with cycle prevention), Rename, Delete → Trash → Restore /
      Delete forever
- [x] Search reaches into answers and note bodies, shows full path
- [x] Auth via magic link; tree is empty and inaccessible until signed in
      once Supabase is connected; RLS enforced in the database itself
- [x] Production build verified (`npm run build`) with zero errors
- [x] PWA manifest + icons + offline-capable service worker
- [x] Basic export — Settings → Export as JSON downloads the whole tree
- [ ] Deployed to Vercel — the last step is yours, following the section
      above

**Note on "refresh the browser / log out and back in" tests:** those only
hold once Supabase is connected. Local demo mode is explicitly in-memory
and resets on refresh — that's by design, not a bug, and is called out on
the Settings page too.

---

## Troubleshooting

- **Created items disappear after refresh** — you're in local demo mode;
  connect Supabase (Phase 3) for real persistence.
- **"Sign in to make changes" errors** — once Supabase is connected, you
  must be signed in (`/login`) before creating/editing/uploading anything;
  Row Level Security blocks unauthenticated writes at the database level
  too, not just in the UI.
- **File upload fails** — confirm the `attachments` bucket exists
  (Storage → should be created automatically by `schema.sql`) and that
  you're signed in.
- **`npm install` fails** — check `node -v` is 18.18+.
