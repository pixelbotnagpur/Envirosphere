# RULE 50: Testing

- Changed code = run its tests. New behavior = new test. Bug fix = regression
  test that fails before the fix.
- Scope test runs: `pnpm test -- <file>`. Never run the full suite for a one-file change.
- Test the contract, not the implementation. No snapshot tests for logic.
- Content: schema tests with valid and broken fixtures; `pnpm content:check` before every build.
- Forms: test valid, invalid and network-error states (Apps Script endpoint mocked). Motion wrappers: test the
  reduced-motion fallback renders content.
- UI changes: verify in the browser at mobile (375px) and desktop (1440px) widths before
  claiming done.
- Long/verbose test output → test-runner subagent; return failures only.
- Never delete or .skip a failing test to make CI green. Report it.
