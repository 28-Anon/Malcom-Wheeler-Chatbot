# Malcom Wheeler Nicholson Chatbot

## Requirements

To start each requirement is defined clearly, can be verified independently and has a rationale method that can support it.

## How requirements were identified
Now the requirements were created from the coursework brief and then properly established via the meetings and a review of comparable conversational experiences ([ Darth Vader Chatbot, Eliza Chatbot, Eternal Ai Stan Lee]). From these we noted features to adopt ([ Potential Visual Emulated Character, In-depth Tailored Choices, Clear Personal Voice]) and pitfalls to avoid ([ Poor Accessibility, Unappealing UI, Broad Responses, Lack of Chat Adaptability]). Requirements will be revised after prototype testing; changes are recorded in the change log below.

## Functional requirements

### 1.x Conversation
| ID | Requirement | Rationale | Priority | Verification |
|----|-------------|-----------|----------|--------------|
| 1.1 | The system shall display an opening line from Wheeler-Nicholson when a new session starts. | Gives the user immediate context and sets the persona. | Must | API test: `POST /api/sessions` returns the opening node |
| 1.2 | The system shall present 2–4 response choices with each dialogue line, unless the line is an ending. | Gives users meaningful control over progression (brief requirement). | Must | Unit test on dialogue data; E2E test |
| 1.3 | The system shall return a different next line depending on which choice the user selects. | Choices must influence how the conversation progresses (brief requirement). | Must | API test: different choices return different nodes |
| 1.4 | The system shall load all dialogue content from structured JSON data, not hard-coded in components. | Separates content from logic; required by the brief; easier to edit. | Must | Code review; unit test on data loader |
| 1.5 | The system shall track a rapport score that increases or decreases according to the user's choices. | Makes user behaviour (polite/rude) affect the character's responses. | Must | Unit test: choice effects update rapport correctly |
| 1.6 | The system shall only offer certain dialogue lines when their conditions are met (e.g. minimum rapport, topic already discussed). | Creates depth: personal stories must be earned. | Must | Unit test on condition evaluation |
| 1.7 | The system shall display Wheeler-Nicholson's current mood (e.g. proud, bitter, guarded) alongside his line. | Gives visible feedback on how the conversation is going. | Should | Component test; E2E test |
| 1.8 | The system shall provide at least three distinct endings determined by the user's choices and rapport. | Rewards different approaches and encourages replay. | Should | E2E tests reaching each ending |
| 1.9 | The system shall cover at least five conversation topics (e.g. military career, pulp writing, founding the company, losing the company, legacy). | Ensures depth and variety of content. | Must | Data review; topic coverage test |

### 2.x User input
| ID | Requirement | Rationale | Priority | Verification |
|----|-------------|-----------|----------|--------------|
| 2.1 | The system shall allow the user to type a free-text question as an alternative to selecting a choice. | More natural interaction; extends beyond a basic choice tree. | Should | API test: `POST /api/sessions/:id/message` |
| 2.2 | The system shall match typed questions to a relevant topic using the team's own keyword/intent matching. | Core logic must be team-built, not an LLM (brief requirement). | Should | Unit tests with sample questions per topic |
| 2.3 | The system shall reply with an in-character fallback line when a typed question cannot be matched. | Keeps immersion and avoids dead ends. | Should | Unit test with unmatched input |
| 2.4 | The system shall reject empty messages and messages longer than 500 characters with a clear error. | Prevents misuse and confusing behaviour. | Must | API test with invalid input; component test |

### 3.x Session & progress
| ID | Requirement | Rationale | Priority | Verification |
|----|-------------|-----------|----------|--------------|
| 3.1 | The system shall allow the user to restart the conversation from the beginning at any time. | Recovery and replay (template requires restart behaviour). | Must | E2E test |
| 3.2 | The system shall show which conversation topics the user has discovered so far. | Gives a sense of progress and encourages exploration. | Should | Component test |
| 3.3 | The system shall display the conversation history for the current session. | Users can re-read earlier lines. | Must | Component test |
| 3.4 | The system shall show a summary of what the user learned when an ending is reached. | Reinforces the educational purpose. | Could | E2E test |
| 3.5 | The system shall let the user resume an unfinished conversation after refreshing the page. | Prevents lost progress. | Could | E2E test with page reload |

### 4.x Interface & supporting features
| ID | Requirement | Rationale | Priority | Verification |
|----|-------------|-----------|----------|--------------|
| 4.1 | The system shall show a typing indicator before each of Wheeler-Nicholson's lines appears. | Makes the conversation feel natural. | Could | Component test |
| 4.2 | The system shall provide an interactive timeline of key events in Wheeler-Nicholson's life. | Adds historical context beyond the dialogue. | Could | Component test; E2E test |
| 4.3 | The system shall display a clear, in-character message if the server cannot be reached. | Robustness; user is never left with a blank screen. | Must | Test with backend stopped |

## Non-functional requirements

| ID | Requirement | Target / standard | Rationale | Verification |
|----|-------------|-------------------|-----------|--------------|
| N1.1 | A first-time user shall be able to start a conversation without instructions. | 5/5 test users start within 10 seconds | Usability for casual visitors | Usability testing with 5 users |
| N1.2 | The system shall achieve a good overall usability rating. | System Usability Scale (SUS) score ≥ 68 | Industry-standard usability benchmark | SUS questionnaire after user testing |
| N2.1 | All interactive elements shall be operable by keyboard alone. | WCAG 2.2 AA, criterion 2.1.1 | Users who cannot use a mouse | Manual keyboard walkthrough |
| N2.2 | Text shall have sufficient colour contrast against its background. | WCAG 2.2 AA, criterion 1.4.3 (4.5:1 minimum) | Readability for users with low vision | axe / Lighthouse scan |
| N2.3 | Keyboard focus shall always be visible. | WCAG 2.2 AA, criterion 2.4.7 | Keyboard users must see where they are | Manual test |
| N2.4 | The app shall score highly on automated accessibility checks. | Lighthouse accessibility ≥ 90 | Objective accessibility measure | Lighthouse report |
| N3.1 | The interface shall be fully usable on screen widths from 360px to 1920px without horizontal scrolling. | Mobile-first responsive design | Users on phones, tablets and desktops | Browser dev tools + real phone test |
| N4.1 | The server shall respond to conversation requests quickly. | ≤ 500ms per request on local deployment | Conversation must feel responsive | Timed API tests |
| N5.1 | All user input shall be validated on the server before processing. | Zod schemas on every endpoint | Prevents malformed or malicious input | API tests with invalid payloads |
| N5.2 | The server shall limit repeated requests from one client. | Max 100 requests per minute per IP | Prevents abuse / denial of service | Automated test exceeding the limit |
| N5.3 | No secrets shall be stored in the repository. | `.env` excluded via `.gitignore` | Prevents credential leaks | Repository check; code review |
| N5.4 | The server shall send secure HTTP headers and restrict cross-origin requests. | helmet; CORS limited to client origin | Defends against common web attacks | Inspect response headers |
| N6.1 | The dialogue data shall contain no dead ends, broken links or unreachable lines. | 0 errors from graph validator | Users must never get stuck | Automated validator in CI |
| N6.2 | The server shall return structured error responses and never crash on bad input. | Consistent `{ error }` JSON; 4xx/5xx codes | Robustness and easier debugging | API tests for error cases |
| N7.1 | Significant functions, components and modules shall have JSDoc comments. | 100% of exported functions | Maintainability (marking criterion) | Code review |
| N7.2 | The dialogue engine shall have high automated test coverage. | ≥ 80% line coverage | Core logic must be reliable | Vitest coverage report |
| N7.3 | Code shall pass linting with no errors before merging. | ESLint, enforced in CI | Consistent, readable code | CI check on every PR |

## Change log
| Date | Change | Reason |
|------|--------|--------|
