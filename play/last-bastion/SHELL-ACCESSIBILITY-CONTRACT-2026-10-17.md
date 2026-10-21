# Shell accessibility preparation — 17 October 2026

Original inventory against `20b82c98`, retained as the integration contract. On 21 October,
`637f6ec8` implemented visible semantic title/menu/settings controls through ScreenFlow. Browser
keyboard/input, simulated-controller, persistence and focus checks pass; actual screen-reader
and physical-controller acceptance remain open. On 22 October, the separately authorized
How to Play slice adds native instructions and page controls, described vector diagrams, active
binding copy and polite content updates. See [the implementation record](archive/HELP-ACCESSIBILITY-IMPLEMENTATION-2026-10-22.md).
The subsequent 22 October slice adds native rebinding/records and isolates both capture devices;
see [the controls/records record](archive/CONTROLS-RECORDS-IMPLEMENTATION-2026-10-22.md).
Armory, hero/threat selection, LAB and other game scenes still use canvas controls. Actual
assistive-technology acceptance remains open for all implemented slices.

| Existing production contract | Preserve when implementation is justified |
|---|---|
| `shell/ScreenFlow.ts`: ShellState, ShellIntent, stepShell and ShellEffect | One state machine owns selection, enabled actions and effects. DOM actions must dispatch through it. |
| `ShellScene.ts`: ten screen render branches and clickZone | Title, menu, help, settings, controls, lab, records, armory, hero and threat selection are canvas objects/zones; inventory their names and enabled state before converting each. |
| ShellScene window keydown and gamepad handlers | Avoid duplicate activation from native button Enter/Space plus the global handler. Preserve physical menu controls independent of combat remaps and controller/pointer parity. |
| ScreenFlow settings rows/groups and display-capability filtering | Derive toggle/choice/range semantics and values from the existing rows. Do not create inert controls or expose unsupported host display choices. |
| ShellScene bindingCapture | Keep capture cancellation and input ownership explicit; stop menu navigation while binding a key/button. |
| ShellScene apply effects and save import/export | Persist once, preserve failure feedback and retry, and retain real file-input/backup behavior. These DOM helpers are not an accessible shell. |
| `platform/TouchNotice.ts` | Existing DOM dialog has a labelled heading, real links/button and initial focus. Preserve it as a separate pre-boot surface. |
| `last-bastion-codex.html` and other scene URLs | The codex is separate HTML; map, debrief and combat overlays are separate consumers. A ShellScene slice alone cannot establish whole-game accessibility. |

Recommended first implementation slice after the gate: title → menu → settings → back, reusing
ScreenFlow and its effects. Keep a single semantic action tree with actual buttons/links/inputs,
visible focus, names, selected/disabled/value state, logical tab order and screen heading.
Keep DOM focus stable across redraws; restore focus after dialogs and on return; remove listeners
and semantic nodes on scene shutdown. Map canvas coordinates to CSS through the display contract.
Decide how controller selection and DOM focus stay synchronized before adding a second renderer.

Acceptance must exercise production controls with keyboard and a screen reader: Tab/Shift+Tab,
Enter/Space once, Escape/back, toggles/sliders, disabled hero/deploy, binding capture and focus
restoration. Also retest pointer/controller, resize/DPR and scene transitions. Source searches,
unit tests or an invisible list of duplicate labels cannot establish operable screen-reader support.

The original 17 October pass added no implementation. The 21 October follow-through uses a
visible native foreground, keyed nodes and shared state/effects; it does not establish whole-game
accessibility. See CURRENT-PLAN for remaining acceptance and scope.
