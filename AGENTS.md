# Project Instructions for AI Agents

## General

1. Be concise.
2. Use simple words.
3. Use simple grammar.
4. Use positive sentences (e.g., instead of double-negatives).

## Design

1. Write system requirements as [EARS] requirements:

   ```text
   [while <pre-condition>,]
   [when <trigger>,]
   [where <feature is included>,]
   [if <trigger>,]
   the <system name> shall <system response>
   ```

2. Write user requirements as [Connextra] user stories:

   ```text
   As a user, I want to be able to [...] so that I can [...]
   ```

3. Be concise.
4. Illustrate your design with UML diagrams in [Mermaid.js].

[Connextra]: https://agilealliance.org/glossary/user-story-template/
[EARS]: https://alistairmavin.com/ears/
[Mermaid.js]: https://mermaid.ai/open-source/intro/

## Dependencies

1. Unless specifically instructed otherwise, always use the latest available
   version of tools, libraries, etc.

## Development

1. Strictly follow Test-Driven Development.

   1. Structure and comment tests with Given/When/Then, so they read like
      requirements:

      ```rust
      #[test]
      fn test_abc() -> None:
          // Given:
          ...
          // When:
          ...
          // Then:
          ...
      ```

   2. Write the simplest, clearest, most maintainable code to satisfy the test.
   3. Then, refactor to make the code easier to maintain, follow design
      patterns, etc. (Do NOT skip the refactor step!)
   4. Then, run `/code-review --fix` to identify & fix what could be improved,
      still using TDD.
2. When finding a bug, start with:
   1. reproducing the bug in conditions as similar as possible to how the end
      user would experience it,
   2. add a test to reproduce the bug,
   3. fix the bug.
   This ensures you find the real problem, so that your fix will actually solve
   it.
3. If you see a linting failure, test failure, a flaky test, etc. fix it in a
   separate, atomic commit with JUST this change, even if not caused by what you
   are working on.
4. Create small, atomic commits following "[conventional commits]", with concise
   commit messages/descriptions:
   1. Unless told otherwise, commit TDD's Red/Green steps as one `feat` commit.
   2. Unless told otherwise, commit TDD's Refactor step as one `refactor`
      commit.
5. Always sign `git` commits with `gpg`.
6. Push pull requests using `gh`, and following
   [`@.github/pull_request_template.md`](.github/pull_request_template.md).

[conventional commits]: https://www.conventionalcommits.org/en/v1.0.0/

## Shell scripts

1. Always validate scripts with `shellcheck`.
2. Always use curly braces for variables, e.g., `"${CLUSTER_NAME}"` instead of
   "$CLUSTER_NAME".
3. Always specify the shell using `env`, e.g., `#!/usr/bin/env bash` or
   `#!/usr/bin/env sh` instead of `#!bin/bash`, `#!/usr/bin/bash`, `#!/bin/sh`,
   or `#!/usr/bin/sh`.
4. When using `bash`, keep variables' scope as small as possible, e.g., using
   `local` within functions.
5. Structure code into small functions, so that each function does one thing,
   does it well, and does it only -- each with its own level of detail / its ow
   level of abstraction.

## Maintaining this file

- Keep this file for knowledge useful to almost every future agent session in
  this project.
- Do NOT repeat what the codebase already shows; point to the authoritative file
  or command instead.
- Prefer rewriting or pruning existing entries over appending new ones.
- When updating this file, preserve this bar for all agents and keep entries
  concise.
