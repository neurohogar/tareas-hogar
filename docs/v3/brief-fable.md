# Brief: v3 plan

Request for the session that builds the v3 feature plan. It is opened in a new session with `/model fable`, with this request: «Seguí `docs/v3/brief-fable.md`» (translation: «Follow `docs/v3/brief-fable.md`»).

## What has to be delivered

`docs/v3/plan.md`: the v3 plan in **ordered epics**. Each epic is a block of value that the pipeline's analyst role later splits into features. There is no need to go down to features.

For each epic:

- what problem it attacks and for which persona (ADHD, autism, giftedness, or shared home);
- the findings that support it, cited by document and finding (for example `tdah.md §1.3B`), with the strength of their evidence;
- the hypothesis it tests and how we will validate it with the «me sirvió / me molestó» (translation: «it helped me / it bothered me») annotation;
- what it has to **avoid**, according to the research;
- what it depends on, an approximate size (S/M/L) and its risks.

After the epics:

- the proposed order and why;
- the ideas from the research that **stay out** of v3, and the reason;
- the conflicts between findings and how you resolved them (for example, routine against novelty);
- the questions only the users can answer.

Write in neutral Spanish. A plan that can be read in 15 minutes is worth more than an exhaustive one.

## What to read

1. `docs/research/v3/README.md`: method and limits of the research.
2. The four documents in `docs/research/v3/`: `tdah.md`, `tea.md`, `aacc-2e.md` and `hogar-compartido-y-apps.md`.
3. `docs/v3/backlog.md`: technical work already decided.
4. `docs/spec.md`, sections 1 and 2: what the app does today and what it excludes. Read the rest only if an epic touches an existing rule.

## Decisions already made (do not reopen them)

- **For whom:** v3 is for two adults who share a home, with autism, ADHD and giftedness. The community uses it by installing its own copy; a public instance is left for v4.
- **Central goal:** **lower the cost of getting a task started**, that is, the lack of drive and the overwhelm before starting. It is the main problem and the idea the four documents agree on. The first batch of epics aims at this.
- **Shared home:** it goes into v3, but as a **second stage**, after the personal part. Today each account has its data isolated.
- **Fixed first epic:** the «me sirvió / me molestó» (translation: «it helped me / it bothered me») annotation. A minimal gesture inside the app, stored in each person's account and with no outgoing telemetry. It is the tool every other thing is validated with. Put it first in the order.
- **Before any epic** the migration to SvelteKit 3 is done (`docs/v3/backlog.md`). It does not need planning, only to be kept in mind as a precedent.
- **Infrastructure:** only the free Firebase plan, without Blaze or Cloud Functions. Since there is no server, there are no push notifications with the app closed. Whatever depends on that is discarded or solved another way (for example, with the app open or with the device's clock). You decide whether notifications go in and how.
- **Delivery:** each feature is deployed as soon as it passes QA, so epics have to deliver value one feature at a time, not only once completed.
- **Process:** each feature goes through the 10-role pipeline (`CLAUDE.md`). The plan does not change it.

## Design constraints

- Every proposal cites the evidence that supports it. If an epic rests on weak or only anecdotal evidence, say so and treat it as a hypothesis.
- What the research asks to avoid is part of the design: streaks, points, guilt, reminders that insist, changes the app makes by itself and a childish tone.
- The app already solves quite a lot: do not repeat what exists (see the spec). Improve on that.
- The repository is public and anonymous: the plan does not name or describe specific people.
