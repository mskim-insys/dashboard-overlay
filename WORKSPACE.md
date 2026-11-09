# AI Coding Workspace Setup

## 1. Principles

This guide sets up the Markdown files that carry project context across AI coding sessions, starting from an empty workspace. Commit messages record what changed; these files record what is required now, why a choice was made, and which alternatives were rejected.

Documents fragment when nobody knows where the current truth of a fact lives. Three principles prevent that:

1. **One home per fact.** A requirement, a status, a rationale, or a usage instruction lives in exactly one document. Everything else links to it.
2. **Link, don't copy.** Refer to code, tests, and other documents by path instead of restating them.
3. **Create lazily.** A file exists only when its trigger (section 3) is met. Never pre-create empty templates.

## 2. Day-zero setup

An empty workspace starts with exactly two files. Everything else appears when a trigger fires.

```text
AGENTS.md      # navigation for agents: where to start, commands, boundaries
README.md      # current usage and behavior
```

As the project grows, the layout grows in this order:

```text
DECISIONS.md          # first real decision or rejected approach
specs/<topic>.md      # a requirement too big to state in a few lines
worklogs/<topic>.md   # work that spans more than one session
archive/              # superseded specs and finished worklogs
```

Rules that hold at every size:

- **Nearest `AGENTS.md` wins.** If the workspace is a subfolder of a larger repo, keep the real context in the subfolder's `AGENTS.md`. A root `AGENTS.md` only points to it.
- **Pair by name.** `specs/auth.md` and `worklogs/auth.md` share a slug.
- **No separate index files.** `AGENTS.md` lists the active specs.
- **Tool-specific files** are one-line pointers to `AGENTS.md`.
- **Track the docs in version control** so a fresh clone starts with the same context.

## 3. Responsibilities and creation triggers

Each document answers one question and must not hold another's content.

| Document | Answers | Must not contain | Create when |
| --- | --- | --- | --- |
| `README.md` | How do I use this, and how does it behave now? | History, rationale, progress | Day zero |
| `AGENTS.md` | Where do I start, how do I build and test, what must I not touch? | Rules copied from other docs | Day zero; under 50 lines |
| `DECISIONS.md` | Why X over Y, and what constraints follow? | Routine progress | A tried approach was discarded, a choice was made among viable options, an environment quirk must be known, or an improvement was deliberately deferred |
| `specs/<topic>.md` | What must be true? Requirements, constraints, acceptance criteria | Progress, rationale for choosing | The requirement is non-trivial or spans sessions |
| `worklogs/<topic>.md` | What changed, how was it verified, what is next? | Requirements, re-explained implementation | Work spans more than one session |
| `archive/` | Finished worklogs and superseded specs | Anything active | A spec is superseded or a topic is done |

Skip typo fixes, formatting, and other trivial changes: they earn no entry anywhere.

**Ownership of next steps.** The spec owns requirements, including unmet acceptance criteria. The worklog owns status and the handover. Never list the same open item in both; the worklog links to the spec criterion.

**Plans.** A complex plan is a section inside the spec, not a separate file. For large work split across sessions, add a Milestones section to the spec: each milestone (M1, M2, ...) lists its exit criteria, and completion is recorded only by checking those criteria. The worklog never keeps its own milestone status table, and there is no file per milestone or separate handover file.

**Milestone rules.** Milestone work always gets a worklog. A milestone is done only when its spec criteria are checked and the `Verified` line shows how. Tag each session entry with its milestone. A scope change updates the spec first, then gets a short worklog note.

## 4. Templates

Delete any section that has nothing to say.

**AGENTS.md** (navigation only)

```markdown
# <Project name>

<One or two sentences: what this is and who uses it.>

## Read first
- README.md for current usage and behavior
- Active specs: specs/<topic>.md (list only active ones)
- DECISIONS.md before changing architecture or retrying a past approach

## Commands
- Build: `<command>`
- Test: `<command>`

## Boundaries
- Do not edit: <generated files, vendored code, secrets>
- Ask first: <risky or irreversible actions>

## Workspace docs
- Rules for these files: <path to this guide>
```

**README.md** (current state only)

```markdown
# <Project name>
<What it does, in one paragraph.>

## Usage
## Build and run
## Current behavior and limits
```

**specs/\<topic>.md**

```markdown
# Spec: <topic>
Status: draft | active | superseded by <link>
Last updated: YYYY-MM-DD

## Goal
## Requirements
## Constraints
## Acceptance criteria
- [ ] <criterion>
## Milestones (only for large work split across sessions)
### M1 <name>
- Exit criteria: <the acceptance criteria above that must be checked>
### M2 <name>
- Exit criteria: <...>
## Plan (only for complex work)
```

**worklogs/\<topic>.md**

```markdown
# Worklog: <topic>
Spec: specs/<topic>.md
Status: in progress | done

## Handover (overwrite each session)
- Current milestone: <M2, criteria live in the spec>
- Done and verified: <what, with the check that proved it>
- Not done / partial: <what, and why>
- First step next session: <one concrete action>
- Read first: <file paths>
- Traps: <gotchas, environment quirks, links to DECISIONS entries>
- Open questions: <blockers that need the user>

## Sessions (newest first)
### YYYY-MM-DD · <milestone, if any>
- Changed: <what, with links to files>
- Verified: <command or check, and the result>
- Risks / open: <link to the spec criterion, do not restate it>
```

**DECISIONS.md entry**

```markdown
## YYYY-MM-DD-NN Short title
- Context: why this decision was needed
- Decision: what was decided
- Alternatives considered and rejected: what was tried and why it was dropped (include evidence or numbers)
- Impact / follow-ups: constraints this creates, or conditions for revisiting it
```

**Entry ID rule.** The ID is a date plus a two-digit sequence number `NN`. Agents cannot see the current time: use the date from context and never run a terminal command to get a timestamp. If the last entry has the same date, use its `NN` plus 1; otherwise start at `01`. Never reuse or renumber an ID.

## 5. Session protocol

Read only what the task needs at the start, and reconcile the documents before stopping.

**Start of a session**

1. Read the nearest `AGENTS.md`.
2. Read the spec and worklog for the topic you will touch, starting with the worklog's Handover block.
3. Scan `DECISIONS.md` titles before changing architecture or retrying an approach; open full entries only for matches.
4. Read `README.md` only if you need current behavior. Skip `archive/` unless a document points there.

**End of a session**

- [ ] A requirement changed: update the spec and its `Last updated` date.
- [ ] The work spans sessions: add a worklog entry tagged with its milestone and overwrite the Handover block. The handover is mandatory for milestone work.
- [ ] A discarded approach, choice between options, environment quirk, or deferred improvement came up: append a `DECISIONS.md` entry.
- [ ] User-visible behavior changed: update `README.md` with current behavior only.
- [ ] A fact now appears in two places: keep the copy in its home and replace the other with a link.
- [ ] A topic is finished or a spec is superseded: move it to `archive/` and name the replacement.
