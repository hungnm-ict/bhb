# Notice

## Origin

BHB began as a study of [`laviehihi/bh-scripts`](https://github.com/laviehihi/bh-scripts)
(examined at commit `7191b6f`). That project carries **no licence file**, so no
licence is claimed over it here and none of its source is redistributed as part
of the built userscript.

## What was carried over

Knowledge and data, not code:

- The technique of forcing `preserveDrawingBuffer` so the WebGL framebuffer can
  be read back
- The verified button coordinates and hex colours for Rerun and World Boss,
  in `src/rules/builtin.js`
- The approach to the speed hack: scaling `Date.now`, `performance.now`, the
  timer functions, and re-driving `requestAnimationFrame`
- The shape of the synthetic pointer/mouse event sequence Unity accepts

Verbatim copies of a few upstream files are kept under `reference/upstream/`
for study. They are excluded from the build and ship in no release artefact.

## What is original here

Everything under `src/`, `tests/`, and `build.js`: the module structure, the
coordinate system that makes rules resolution-independent, the profile storage
and import/export, the rule model, the engine, the UI layer, the i18n layer,
the build pipeline, and the test suite.

## If you are the upstream author

If you would prefer this project not exist in its current form, please open an
issue and it will be addressed.
