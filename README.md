# UX Interview Insights Dashboard

This folder contains a lightweight static dashboard for synthesizing UX interview results.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000`.

## Upload format

The dashboard accepts `.csv` or `.json`.

Recommended columns:

- `participant_id` or `participant`
- `segment`
- `sentiment`
- `theme`
- `severity`
- `score`
- `quote`

It also understands a few common aliases such as `topic`, `pain_point`, `rating`, `comment`, and `snippet`.

## What it shows

- KPI summary for interviews, themes, sentiment, severity, and score
- Research agent chat for asking questions about the current filtered view
- Recurring theme ranking
- Average sentiment by segment
- Actionable insights
- Representative quotes
- Row-level detail table

The page loads with demo data so the layout is immediately visible, but any uploaded file replaces it.

## Research agent

The agent runs in the browser and analyzes the currently filtered rows. It can answer questions about summaries, priorities, sentiment, quotes, and recommended next steps in English or Korean.

Because this is a static dashboard, the agent does not call an external LLM or store uploaded data on a server.
