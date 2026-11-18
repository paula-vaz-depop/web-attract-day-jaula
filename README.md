# Team Day: Ticketmaster starter

Start with [BRIEF.md](BRIEF.md).

## What's here

| File | What it is |
|---|---|
| [BRIEF.md](BRIEF.md) | The brief and rules |
| [REQUIREMENTS.md](REQUIREMENTS.md) | Product requirements and wireframes |
| [TECHNICAL.md](TECHNICAL.md) | Technical requirements |
| [database.csv](database.csv) | Empty. Your reservations go here (see `DATA_PATH` in TECHNICAL.md). |
| [seed.json](seed.json) | Three events, 500 seats each (rows A–T, seats 1–25), with prices and some seats already reserved |
| `api/` | Empty. Your Node and Express API goes here. |
| `app/` | Next.js 16 scaffold (App Router routes in `app/app/`). Read [app/AGENTS.md](app/AGENTS.md) first. |
| [SPEC.md](SPEC.md) | Our numbered requirements checklist |
| [CONTEXT.md](CONTEXT.md) | Team context: decisions made, open items, work split |
| [openapi.yaml](openapi.yaml) | Our approved API contract |

## Getting started

You need Node 20 or newer.

Wire up `npm start` in [package.json](package.json) so it starts both your API and your web app (see [TECHNICAL.md](TECHNICAL.md)).
