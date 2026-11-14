# RevoPhone integration · 3.1.2

- Authorized: integrate upstream PR #1 (f7b8ddad2bda9fe5faed3a875c72bfc7165f53bc), implement optional RevoPhone coordination and push this fork's main. RevoPhone is a separate commit/push.
- A0: goal, red lines and acceptance agreed in chat. Library snapshot 2026-08-18; routes extension-dev / code-quality-workflow; loaded A0, D5 and E5; no design candidates adopted.
- Gate: Local Fix / Local Fix Only for the reply-delivery lifecycle. Preserve native swipes, prompts, model routing and plugin-owned fields. No host changes or live account operations.
- Budget: excluding the separately adopted PR, up to 8 files / 650 changed lines including focused tests and documentation, with production changes targeted below 160 lines. Re-gate if the integration needs unrelated APIs or storage migrations.
- Baseline: fork clean at d701fd9; PR fast-forward integrated, 19 native-swipe tests pass. RevoPhone baseline: 136 pass.
- Contract: optional protocol v1, synchronous null when not deferring; otherwise a promise resolved only after rewrite cleanup and route release. Consumers must never await it inside a host event listener. Automatic first draft + rewrite counts once; later manual rewrites do not count a new turn. Cancellation uses restored original; changed context is rejected.
- Verification: all 28 native-swipe/lifecycle cases pass individually via node tests/run-tests.mjs; the in-process experimental VM suite access-violates on this Windows Node 22.19 build, so the runner discovers all cases and runs each once in a fresh process with failures preserved. Counterpart: 156 tests pass; 4 cross-repository consumer cases pass. Syntax / manifest / diff / complete patch scope pass. Existing deprecated Extras/description manifest warnings are preserved. Real account and Android acceptance remain user-run.
- Rollback: revert integration commit (independent of upstream PR). If source ownership is uncertain, discard deferred delivery rather than mutate a different reply.
- Status: implementation and source verification finished, ready for authorized commit/push to this fork's main.
