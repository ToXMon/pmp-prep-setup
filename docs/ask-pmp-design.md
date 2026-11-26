# Ask PMP design review

- Date: 2026-11-25
- POC: PMP Prep Setup maintainer
- TL;DR: Keep the quiz app as it is. Add an Ask PMP tab that retrieves course evidence and uses it to answer project or study questions. The choices below are proposals for review, not approved architecture.

## What happens when you ask a question

1. In the Ask PMP tab, select Project Coach or PMP Study Coach. The existing quizzes keep working without sign-in.
2. A private backend checks your access before retrieving anything or calling a model. The public app does not contain the model key or course passages.
3. The backend ranks the 36 semantic topics using titles, concepts, and aliases. It follows the top topics' source maps to fetch only the relevant passages. The semantic index helps find the evidence; the cited passages are the evidence. Session 1 citations use exact transcript lines and chunk-level entry bounds.
4. The model gets the question, the requested mode, and the selected passages. The backend checks that cited IDs belong to those passages. That ID check catches invented locators; it does not prove that a passage supports a claim, so we also review sample answers before release.
5. Project Coach gives a recommended next step and can draft an artifact for you to review. It does not contact anyone or change your tools. Study Coach can explain concepts or generate an original drill, then wait for your answer before showing the rubric. It labels instructor guidance separately from PMI guidance.
6. If the source is incomplete or doesn't answer the question, the reply says so. It never invents a slide, source ID, or timestamp.

Example: “A supplier missed a contractual milestone on our hybrid project. What do I do before escalating?” The backend would look for issue management, governance, and the hybrid boundary. The coach could suggest checking the agreed response and decision authority, but it couldn't know the terms of your contract unless you told it.

## Round 1: Agreed scope

| Decision | Agreed direction |
|---|---|
| Access | The maintainer alone can use Ask PMP. Existing quizzes stay public. |
| Project inputs | Sanitized text only. No uploads or durable chat history. |
| Model processing | Use Surplus Intelligence for hosted inference, with a maintainer-supplied server-side key. Try heavily discounted, capable open-weight models first. GLM 5.3 is a candidate, pending verification of the provider's model ID, availability, and price. |
| Evidence policy | Ground study answers in course evidence. Label general project judgment separately. Verify official PMI claims against official sources. |
| First release | Project next steps, cited concept explanations, and one original drill at a time with feedback after the learner answers. No new progress sync. |

## Round 2: Access, evidence and model calls

Ask PMP should work from phone and laptop without the maintainer's Mac running. Use a single browser password prompt over HTTPS instead of GitHub OAuth. The public quizzes remain independent of sign-in and model availability.

The maintainer approved passage-grounded answers through Surplus Intelligence's discounted marketplace routes without a Venice-only requirement. Send the sanitized question and relevant retrieved passages, not a bulk copy of the course. Keep the corpus and credentials on the backend and omit replay links. The public order book showed `glm-5.3` at 99.81% off, with Venice at 20.01% off, on November 25, 2026. The app uses `min99` on GLM 5.3, with no provider pin or fallback to a lower discount. Actual prices and eligible sellers vary.

Use `glm-5.3` through the [Surplus minimum-discount endpoint](https://www.surplusintelligence.ai/docs/marketplace/minimum-discount-routing.md). Retry once only on the documented discount-supply cooldown with a short `Retry-After`. Do not retry ambiguous timeouts, authentication errors, out-of-credit errors, or invalid requests. There is no model or price fallback. The floor filters offers against reference pricing; it does not guarantee zero cost. Leave buyer-owned priority and fallback routes disabled because the floor does not cover them.

## Before launch

- Provision an Akash lease over HTTPS using the pinned public image. It uses the original semantic summaries and source locators; it does not contain raw transcripts. Configure the app password and funded Surplus key using the [runbook](ask-pmp-run.md).
- Run a synthetic live inference check using the real key and verify authorized and signed-out browser flows. Point the public app to the hosted coach only after those checks pass.

Before a deployment request, demonstrate retrieval on held-out paraphrases, inspect whether citations support the answers, test questions with missing evidence, and check that signed-out requests cannot reach course evidence or model inference. Local retrieval results alone do not establish answer quality.
