# Course coverage and crosswalk

Date: 2026-11-24

The bank includes 58 instructor-priority and exam-cue mappings in [`coverage.mjs`](../coverage.mjs), plus six supporting topics. Each mapping records the track, course reference and transcript file lines. Ethics locators prefixed `S2:` point to Susan’s mandatory-standards discussion. Source links in the app are course evidence for the questions; a related page does not necessarily identify the exact slide on screen. Scrum uses the Scrum Guide, and acronym scenarios cite the relevant deck pages in their rationales.

| Track | Topics | Questions |
|---|---:|---:|
| Session 1 | 9 | 21 |
| Session 2 | 13 | 26 |
| Session 3 | 11 | 23 |
| Session 4 | 15 | 33 |
| Session 5 | 12 | 27 |
| Ethics | 4 | 10 |
| Total | 64 | 140 |

The bank was built by scanning all five transcripts for specific study and exam cues and checking surrounding context against the pinned course PDFs. Repeated cues for the same concept are grouped. Broad advice such as “study slides that say what your role is,” logistics, and general descriptions of the exam are not treated as individual topics. This is a bank for the topics identified in the review, not a guarantee that every indirect reference was found or that all course content is tested. Known transcript gaps: Session 1 source index 971; Session 4 indices 1444 and 1650; Session 5 indices 87, 925 and 1301. Ethics covers all four values, but does not yet drill every mandatory clause separately.

Run `node --test` to verify that each topic has at least two distinct prompts, that questions carry source links and valid answer keys, and that every question is reachable in one pass. These checks validate the bank’s structure, not its difficulty relative to the actual PMP exam.
