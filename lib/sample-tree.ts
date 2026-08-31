import { AppNode } from "@/types/node";

// Seed data for local/no-Supabase mode. Deliberately shows the recursive
// idea in action: folders nested arbitrarily deep, questions living
// directly inside a folder alongside other folders, an empty folder,
// and a folder holding only a link — nothing here is a special case.

const now = new Date().toISOString();

function folder(id: string, parentId: string | null, name: string, sortOrder = 0): AppNode {
  return {
    id,
    parentId,
    type: "folder",
    name,
    content: {},
    metadata: {},
    sortOrder,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    isSample: true
  };
}

function question(
  id: string,
  parentId: string,
  name: string,
  q: string,
  a: string,
  marks: number,
  tags: string[],
  importance: AppNode["metadata"]["importance"],
  sortOrder = 0
): AppNode {
  return {
    id,
    parentId,
    type: "question",
    name,
    content: { question: q, answer: a },
    metadata: { marks, tags, importance },
    sortOrder,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    isSample: true
  };
}

export function createSampleTree(): AppNode[] {
  const college = folder("s-college", null, "College", 0);
  const sem5 = folder("s-sem5", "s-college", "5th Semester", 0);
  const micro = folder("s-micro", "s-sem5", "Microprocessors", 0);
  const digital = folder("s-digital", "s-sem5", "Digital Electronics", 1);
  const gate = folder("s-gate", null, "GATE", 1);
  const gateEce = folder("s-gate-ece", "s-gate", "ECE", 0);

  return [
    college,
    sem5,
    micro,
    digital,
    gate,
    gateEce,

    question(
      "s-q-interrupts-hw",
      "s-micro",
      "Q1 — Hardware Interrupts",
      "Explain the hardware interrupts of 8085 microprocessor with their priority and vector addresses.",
      `## Hardware Interrupts of 8085

The 8085 has **5 hardware interrupt pins**, each triggered by an external signal on that pin.

### Types of Hardware Interrupts

| Interrupt | Type | Vector Address | Maskable |
|---|---|---|---|
| TRAP | Edge & level (both) | 0024H | No (non-maskable) |
| RST 7.5 | Edge triggered | 003CH | Yes |
| RST 6.5 | Level triggered | 0034H | Yes |
| RST 5.5 | Level triggered | 002CH | Yes |
| INTR | Level triggered | Supplied externally | Yes |

### Priority Order (highest to lowest)

1. TRAP
2. RST 7.5
3. RST 6.5
4. RST 5.5
5. INTR

> [!IMPORTANT]
> Only TRAP is non-maskable. Only INTR needs external hardware to supply the vector.

### Diagram

\`\`\`text
        Highest Priority
             |
          TRAP  (non-maskable, edge+level)
             |
         RST 7.5  (maskable, edge)
             |
         RST 6.5  (maskable, level)
             |
         RST 5.5  (maskable, level)
             |
           INTR   (maskable, level, vector supplied externally)
             |
        Lowest Priority
\`\`\`

**Quick recall:** T-7-6-5-I, highest to lowest.`,
      10,
      ["8085", "interrupts", "hardware"],
      "High",
      0
    ),

    question(
      "s-q-flag-register",
      "s-micro",
      "Q3 — 8085 Flag Register",
      "Draw the format of the 8085 Flag Register and explain the function of each individual flag.",
      `## 8085 Flag Register

The Flag Register is an **8-bit register** reflecting the result of the last arithmetic/logic operation. Only 5 of the 8 bits are used.

### Bit Format

\`\`\`text
+-----+-----+-----+-----+-----+-----+-----+-----+
| D7  | D6  | D5  | D4  | D3  | D2  | D1  | D0  |
+-----+-----+-----+-----+-----+-----+-----+-----+
|  S  |  Z  |  X  |  AC |  X  |  P  |  X  | CY  |
+-----+-----+-----+-----+-----+-----+-----+-----+
\`\`\`

### Function of Each Flag

| Flag | Name | Set when |
|---|---|---|
| CY | Carry | Result generates a carry out of bit 7 |
| P | Parity | Result has an even number of 1 bits |
| AC | Auxiliary Carry | Carry out of bit 3 into bit 4 (used for BCD/DAA) |
| Z | Zero | Result is exactly zero |
| S | Sign | Bit 7 of the result is 1 (2's complement negative) |

**Note:** AC is not directly testable by conditional jump instructions — it exists mainly to support the \`DAA\` instruction.`,
      10,
      ["8085", "flag register", "important"],
      "High",
      1
    ),

    question(
      "s-q-addressing-modes",
      "s-micro",
      "Q4 — Addressing Modes",
      "List and explain the different addressing modes supported by the 8085 microprocessor.",
      `## Addressing Modes of 8085

| Mode | Operand location | Example |
|---|---|---|
| Immediate | Inside the instruction | \`MVI A, 32H\` |
| Register | CPU register | \`MOV A, B\` |
| Direct | Address given in instruction | \`LDA 2050H\` |
| Indirect | Address held in register pair | \`MOV A, M\` |
| Implied | Fixed by the opcode | \`CMA\` |`,
      8,
      ["8085", "addressing modes"],
      "Medium",
      2
    ),

    question(
      "s-q-excess3",
      "s-digital",
      "Q3 — Excess-3 Code",
      "Explain the Excess-3 code and its relationship with BCD. Convert (47)10 to Excess-3.",
      `## Excess-3 Code

Excess-3 is obtained by **adding 3 (0011) to each BCD digit**.

\`\`\`text
Excess-3 code = BCD code + 0011
\`\`\`

### Worked Example: Convert (47)10 to Excess-3

**Step 1 — BCD for each digit:**

\`\`\`text
4 -> 0100
7 -> 0111
\`\`\`

**Step 2 — Add 0011 to each nibble:**

\`\`\`text
0100 + 0011 = 0111
0111 + 0011 = 1010
\`\`\`

**Result:** (47)10 = **0111 1010** in Excess-3.

> [!NOTE]
> Excess-3 is self-complementary: the 9's complement of a digit is obtained by inverting every bit of its Excess-3 code.`,
      5,
      ["excess-3", "codes", "BCD"],
      "High",
      0
    ),

    question(
      "s-q-gray-code",
      "s-digital",
      "Q4 — Gray Code",
      "What is Gray code? Explain binary-to-Gray conversion with an example.",
      `## Gray Code

A binary system where **two successive values differ in only one bit** (the unit distance property).

### Binary to Gray Conversion Rule

1. MSB of Gray = MSB of binary.
2. Each next Gray bit = XOR of the current and previous binary bit.

### Worked Example — Binary 1011 to Gray

\`\`\`text
Binary:  1     0     1     1
G3 = B3            = 1
G2 = B3 xor B2      = 1
G1 = B2 xor B1      = 1
G0 = B1 xor B0      = 0

Gray code = 1110
\`\`\`

**Why it matters:** reduces glitches in mechanical encoders and digital circuits where multiple bits could otherwise change at once.`,
      5,
      ["gray code", "codes"],
      "Medium",
      1
    )
  ];
}
