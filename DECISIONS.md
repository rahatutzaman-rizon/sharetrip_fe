# Candidate Decisions & Notes

Please use this file to briefly outline your technical choices and the rationale behind them.

## 1. State Management & Architecture
*Why did you structure your state the way you did? Which patterns did you choose for handling the flaky API requests, loading states, and error handling?*

*(Your answer here)*
## 1. State Management & Architecture
I kept state local to the page because the problem scope is bounded to a single product listing flow, and introducing a heavier global state solution would add complexity without providing meaningful benefit for this assignment.

The state is separated by concern:
- **Query state**: `page`, `category`, and `searchInput`
- **Derived query state**: debounced search value
- **Server response state**: `products`, `total`, and `totalPages`
- **UI state**: `isLoading`, `isRefetching`, and `error`

This separation made the data flow predictable and helped avoid coupling server state too tightly to presentation concerns.

To handle the intentionally slow and flaky API, I used a few defensive patterns:
- **Debounced search input** to reduce unnecessary requests while typing
- **Request identity tracking** using a ref so stale responses cannot overwrite newer state
- **Distinct initial loading vs. background refetch states** to preserve a stable UI and avoid unnecessary layout jumps
- **Graceful error handling** for both first-load failures and subsequent refresh failures
- **Page reset on filter/search changes** so pagination remains logically consistent with the active query

I also used `useMemo`, `useCallback`, and `React.memo` selectively around expensive or frequently re-rendered UI paths such as pagination, product cards, and derived labels. The goal was not premature optimization, but to keep rendering predictable as the grid grows and the UI updates under unstable network conditions.

From an architectural perspective, I aimed for:
- clear separation between **data fetching**, **query control**, and **presentational components**
- a resilient UI that remains usable under degraded API conditions
- a structure that could be easily extended later into a custom hook such as `useProducts()` or migrated to a data-fetching library like React Query if the application grew beyond this screen





## 2. Trade-offs and Omissions
*What did you intentionally leave out given the constraints of a take-home assignment? If you had more time, what would you prioritize next?*

*(Your answer here)*
## 2. Trade-offs and Omissions
Given the scope of a take-home assignment, I focused on correctness, resilience, accessibility, and visual polish for the core listing experience rather than over-engineering the solution.

A few things I intentionally kept out:
- **Client-side caching / request deduplication library** such as React Query or SWR
- **URL-synced filters and pagination**
- **Automated retry/backoff logic**
- **Unit and integration test coverage**
- **Virtualized rendering**, since the page size is small and paginated already
- **Expanded product interactions** such as add-to-cart, wishlist, or quick preview

If I had more time, my next priorities would be:
1. Add **test coverage** around pagination, debounced search, race-condition handling, and error states
2. Move API orchestration into a reusable **custom hook**
3. Persist filters and page in the **URL query params** for better shareability and browser navigation
4. Add **retry with exponential backoff** for transient failures
5. Improve the product card further to match the Figma reference even more closely, including typography tuning and tighter spacing behavior across breakpoints

In short, I prioritized a solution that is production-minded in behavior, while keeping the implementation size appropriate for the exercise.




## 3. AI Usage
*How did you utilize AI tools (ChatGPT, Copilot, Cursor, etc.) during this assignment? Provide a brief summary of how they assisted you.*

*(Your answer here)*
## 3. AI Usage
I used AI as a development assistant, primarily for iteration speed and review support rather than as a substitute for implementation decisions.

Specifically, AI helped with:
- reviewing component structure and state organization
- refining loading/error UX patterns for a flaky API
- improving the wording and clarity of take-home documentation
- validating some React patterns around memoization, request race handling, and pagination UX

All architectural decisions, code integration, and final implementation choices were reviewed and adjusted manually. I treated AI as a collaborator for brainstorming and polish, while keeping ownership of the technical direction and final code quality.




## 4. Edge Cases Identified
*Did you notice any edge cases or bugs that you didn't have time to fix? Please list them here.*

*(Your answer here)*

## 4. Edge Cases Identified
A few edge cases are worth noting:

- Because the mock API is intentionally flaky, repeated failures can still produce a poor user experience even with graceful UI handling. In a production setup, I would add retry/backoff and likely observability hooks.
- The mock dataset is randomly generated, so category distribution and pricing are not stable across sessions. That can make UI verification slightly inconsistent.
- Search and category changes currently reset pagination intentionally, but URL persistence is not implemented, so browser refresh loses the current view state.
- If the backend were to return inconsistent pagination metadata, additional defensive normalization would be useful.
- Image loading failures are not explicitly handled yet; a fallback image or placeholder would improve robustness.
- The current implementation optimizes for a paginated grid. If the dataset size or page size increased substantially, I would revisit rendering strategy and loading approach.

Overall, I focused on making the primary user journey reliable and polished under the constraints provided, while leaving some scalability and production-hardening improvements as clear next steps.




