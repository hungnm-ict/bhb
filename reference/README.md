# Upstream reference

Verbatim copies of [`laviehihi/bh-scripts`](https://github.com/laviehihi/bh-scripts)
at commit `7191b6f`, kept for reference only. **Nothing here is built or shipped.**

They are worth keeping because they encode knowledge that is expensive to
rediscover — working pixel coordinates, the exact button colours, and the
World Boss party flow — even though the code itself has been rewritten.

| File | Why it is here |
|---|---|
| `rules.js` | The proven pixel coordinates and colours, now in `src/rules/builtin.js` |
| `engine.js` | Original rule loop, rewritten as `src/core/engine.js` |
| `overlay.js` | Original panel markup, rewritten as `src/ui/overlay.js` |
| `speed-hack.js` | Original timing override, rewritten as `src/core/speed.js` |
| `wb-party.js` | World Boss team mode — **not yet ported**, planned for a later milestone |
| `README.MD` | The original Vietnamese instructions |
