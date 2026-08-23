# BoolSynth — Boolean Function Synthesizer

A static, client-side web app (no backend, no build step) that:

- Accepts a Boolean function as a **truth table**, a list of **minterms/maxterms**
  (with optional don't-cares), or a **Boolean expression**.
- Minimizes it with the **Quine–McCluskey** algorithm (essential prime implicants +
  greedy cover for the rest).
- Shows the minimized **SOP** and **POS** expressions and the full truth table.
- Draws three circuit diagrams as SVG: **AND/OR/NOT**, **NAND-only**, and **NOR-only**
  — with automatic gate layout and labeled wires.
- Runs an **equivalence check** across every input row, comparing the given function,
  the simplified expression, the NAND-only circuit, and the NOR-only circuit, and
  reports a pass/fail table + banner.

It supports 2–6 variables and runs entirely in the browser — nothing is sent to a
server, so it's safe to host as a plain static site.

## Files

```
index.html   — page structure / UI
style.css    — visual design
logic.js     — parser, evaluator, Quine–McCluskey, NAND/NOR network builders
diagram.js   — SVG schematic renderer (auto-layout, dummy-node wire routing)
app.js       — wires the UI to the engine
```

No dependencies, no `npm install`, no build step — just static files.

## Hosting it publicly (pick one, all free, all under ~2 minutes)

### Option A — Netlify Drop (fastest)
1. Go to <https://app.netlify.com/drop>
2. Drag the whole `boolsynth` folder onto the page.
3. Netlify gives you a public `https://…netlify.app` URL immediately. Done.

### Option B — GitHub Pages
1. Create a new GitHub repository and push these 5 files to it (e.g. to the `main` branch).
2. In the repo, go to **Settings → Pages**, set **Source** to the `main` branch / root folder.
3. GitHub gives you a `https://<username>.github.io/<repo>/` URL within a minute or two.

### Option C — Vercel
1. `npm i -g vercel` (or use the Vercel web UI) and run `vercel` inside the folder,
   or drag-and-drop the folder at <https://vercel.com/new>.
2. Accept the defaults (it's a static site, no framework/build command needed).

### Option D — any static host
Because it's just HTML/CSS/JS with relative paths, it also works from Cloudflare
Pages, Firebase Hosting, S3 + CloudFront, or literally opening `index.html` directly
in a browser for local testing.

## Notes on the math

- Minimization uses classic Quine–McCluskey: group minterms (plus don't-cares) by
  popcount, repeatedly combine terms differing in one bit, collect prime implicants,
  select all essential ones, then greedily cover any minterms still left uncovered.
- The **POS** (used for the NOR circuit) is derived from the *exact* function the SOP
  ends up realizing — not independently re-minimized — so that don't-care rows resolve
  the same way in both the SOP/NAND and POS/NOR paths and the four representations
  are guaranteed to agree on every single input row, not just the required ones.
- The NAND-only and NOR-only circuits use the standard two-level NAND–NAND /
  NOR–NOR transformation (double-negation trick), with a shared inverter gate per
  negated literal rather than one inverter per occurrence.
