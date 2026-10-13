# Undo coalescing — design

## Problem
Every store `set` is an undo step. Typing "hello" in the project name makes 5
steps, and dragging an opacity slider or colour picker makes dozens. Undo then
walks back one character at a time, and the 100-step history fills up fast.

## Rule
Consecutive edits to the **same target** that arrive **less than 1 s apart**
merge into the first edit's undo step, so undo reverts the whole burst.
A new step starts when:
- more than 1 s passes since the last edit of the burst;
- the target changes (another field, element, property or breakpoint);
- anything else was recorded in between (the history grew since the burst's last edit);
- the user undid or redid (there are future states). Typing after an undo must
  start a new step and clear redo, exactly as it does today.

## Targets (coalescing keys)
| action | key |
| --- | --- |
| setName | `name` |
| setProp(id, prop) | `prop:id:prop` |
| setStyle(id, bp, prop) | `style:id:bp:prop` (sliders, colour drags, typed values) |
| setPageSeo(page, patch) | `seo:page:fields` |
| setSite(patch) | `site:fields` |
| setTheme | `theme` (live colour picking) |
| setColorTokens | `tokens` |
| setOverride(inst, var) | `override:inst:var` |
| setComponentVariables(comp) | `vars:comp` |

## Mechanism
The merged edits are applied with zundo's `pause()`/`resume()` around the `set`:
the first edit of a burst records the pre-edit state, and the rest update the present
without recording. Structural actions (insert, move, delete, presets, apply theme…)
always record their own step.
