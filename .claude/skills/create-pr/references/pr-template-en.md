# PR Template (English)

Use this template when the target repository is an English-language open-source project
(OSI license present, README/CONTRIBUTING in English, existing commits/PRs in English), or
when the user explicitly asks for an English PR.

```markdown
## Summary
<1-3 bullet points describing what this PR does and why>

## Changes
- <change 1>
- <change 2>
- <change 3>

## Test plan
- [ ] <verification item 1>
- [ ] <verification item 2>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Writing guide

- **Summary**: focus on *why*, not just what. Don't restate commit messages verbatim.
- **Changes**: cover **every commit** since the branch diverged from base, grouped by logical unit — not just the latest commit.
- **Test plan**: list concrete verification steps actually performed or that the reviewer should check. Leave unverified items unchecked rather than marking them done.
- If a section doesn't apply (e.g., no test plan needed for a docs-only change), state "N/A" explicitly instead of omitting the section silently.
- Always keep the trailing attribution line.
