# Fruit Blast polish handoff

**Honest state assessment — 83% shipped:** the Phaser game loop, responsive portrait framing, swap/fall/cascade rhythm, special pieces, camera shake, pooled particles, score pulses, combo callouts, pause flow, and three-star win panel already feel lively and portal-ready; however, the current fruit imagery is OS emoji rasterized into a procedural atlas, several menus/results use more emoji, all text is system-ui, and the current `index.html` has no Open Graph/Twitter metadata or share image.

## Hard constraints

- Visual/feel pass only. Do not change behavior in `src/game/matchLogic.ts`, `src/game/levels.ts`, `src/game/modes.ts`, or `src/game/storage.ts`.
- Do not change board dimensions, kinds/count, colors as game identifiers, swipe thresholds, scoring, goals, move/time limits, seeds, daily behavior, campaign progression, save keys, or scene outcome logic.
- Phaser/canvas only. Do not add DOM overlays for menu, gameplay, pause, loss, result, or win.
- Preserve the current shared tile-atlas/frame architecture, tile pool, pooled emitters, Phaser tweens, and `generateTexture` approach (`src/scenes/GameScene.ts:270-307`, `src/scenes/GameScene.ts:403-422`, `src/scenes/GameScene.ts:784-799`).
- Offline-first: no CDN, remote font/image, webfont loader, or runtime asset fetch. Ship every asset locally.
- Add a `prefers-reduced-motion` strategy for Phaser before adding/tuning motion. Reduced motion must keep interaction timing and final states while suppressing pulses, shakes, travel, particles, count-ups, confetti, and repeated title motion.
- Maintain 60 fps on a mid-range mobile device; do not allocate emitters or textures per matched tile.

## Ordered passes

### Pass 1 — Replace OS emoji rendering with authored procedural fruit art

The live tiles look attractive at a glance, but they are not custom fruit drawings in the current code. `KINDS` stores emoji glyphs (`src/game/config.ts:41-55`), and `paintTileFrame` draws those glyphs using `CanvasRenderingContext2D.fillText` (`src/scenes/GameScene.ts:310-366`). The menu repeats an emoji fruit row (`src/scenes/MenuScene.ts:24-25`), and collect-goal labels also use the glyph (`src/scenes/GameScene.ts:245-250`). Platform-dependent emoji are the largest remaining “vibe-coded” tell and vary in style/sharpness by OS.

- Keep the current six kind indices, colors, tile size, atlas key/frame names, specials, and texture creation flow.
- Replace only the glyph-paint step with six local Canvas 2D drawing functions: strawberry, orange, lemon, kiwi, blueberry cluster, and grape cluster. Use a consistent highlight direction, outline weight, leaf language, and silhouette scale; render at the atlas’s logical resolution with DPR-safe detail.
- Draw the same small fruit marks in `MenuScene` and collect-goal labels from a shared procedural texture set. Do not use emoji, external PNG packs, or a new rendering system.
- Keep line/bomb overlays and their gameplay readability; adjust their placement only to avoid covering the new silhouettes.

**Acceptance check:** menu, normal tiles, collect goals, line specials, and bomb context contain no emoji fruit; all six kinds remain distinguishable in color-blind/grayscale review by silhouette; atlas/frame ids and kind indices are unchanged; tiles are sharp at DPR 1/2/3 and generate once per scene lifecycle.

### Pass 2 — Remove the remaining emoji/glyph controls across scenes

The live menu, settings, pause, daily stats, goal, daily result, and loss state use flame/calendar/speaker/music/clipboard/sad-face emoji (`src/scenes/MenuScene.ts:31-65`, `src/scenes/SettingsScene.ts:30-54`, `src/scenes/PauseScene.ts:41-76`, `src/scenes/ResultScene.ts:54-68`, `src/scenes/LoseScene.ts:48-59`).

- Build a tiny Phaser-generated icon atlas in the same rounded geometric language as the buttons: daily/calendar, streak/flame, sound on/off, music, settings, help, home, restart, play/next, copy, target, and loss mark.
- Extend `makeButton` to accept a generated icon image plus text while preserving its stable hit container and press tween (`src/ui/Button.ts:27-85`).
- Use consistent icon boxes and alignment; keep labels and input bounds unchanged.

**Acceptance check:** every Menu/Pause/Settings/Result/Win/Lose control and stat uses local generated art rather than OS emoji or font glyphs; hit regions remain fixed while button visuals tween; icons are crisp and stylistically consistent at all scale modes.

### Pass 3 — Add the missing social and favicon asset set

Contrary to the prior assumption, current `index.html:1-26` contains only title/theme/favicon and has no description, canonical, Open Graph, Twitter card, `og.png`, or local favicon set.

- Add description, canonical, Open Graph, and Twitter metadata for the GitHub Pages URL, including 1200×630 dimensions and alt text.
- Author local `public/og.png` using the new procedural fruits, purple board palette, wordmark, and one combo/special-piece motif. Do not use an OS emoji screenshot.
- Replace the encoded data favicon with local SVG/PNG favicon and Apple touch icon files, reusing the same generated fruit language.

**Acceptance check:** major link validators show the authored card; every referenced file is emitted by Vite and works under the repository base path; no remote request occurs during boot or share-card rendering.

### Pass 4 — Give the menu/result shell a deliberate type and framing pass

All scene and button text currently uses `system-ui` (`src/scenes/MenuScene.ts:26-65`, `src/ui/Button.ts:46-55`, `src/scenes/WinScene.ts:55-70`). The hierarchy is clear but visually generic.

- Ship one local display/UI WOFF2 family or a compact pair with only required weights. Load it locally before Phaser creates text textures, with a deterministic fallback timeout; never use a remote loader.
- Keep the current portrait layout and button dimensions. Refine title lockup, stats strip, “Choose a mode,” settings/help entry, pause panel, loss panel, timed/daily result, and win panel with consistent label case, spacing, divider/fruit motifs, and icon alignment.
- Preserve score count-up, staggered stars, confetti, and all callbacks (`src/scenes/WinScene.ts:42-145`); this is presentation only.

**Acceptance check:** there is no post-input text reflow, menu and all outcome panels share one clear hierarchy, long daily/share copy fits at 320×568-equivalent scaling, and all Phaser text remains sharp in FIT mode.

### Pass 5 — Tune existing juice and implement reduced-motion parity

Do not add a second feedback system. The game already has pop tweens, pooled bursts, camera shake, line beams, bomb flash/ring, score pulses, combo callouts, initial falls, and cascade beats (`src/scenes/GameScene.ts:760-830`, `src/scenes/GameScene.ts:833-901`, `src/scenes/GameScene.ts:951-955`).

- Tune burst count/lifespan, score pulse, combo hold, and cascade beat only after testing simple matches, 4/5 matches, line/bomb detonations, and long cascades. Favor readability over more particles.
- Add a compact motion-preference module read once at boot. In reduced motion: skip camera shake/title breathing/selection pulse/confetti/particles, shorten swap/fall/pop to the minimum needed to communicate causality, set counters/stars directly to final values, and retain sound settings independently.
- Keep emitters pooled, texture reuse intact, and all state transitions/callback timing safe when tween durations collapse.

**Acceptance check:** normal motion maintains 60 fps during a multi-step cascade and makes the matched cause readable; no effect obscures score/goal; reduced-motion mode completes swaps, cascades, pause, win, loss, timed, and daily outcomes without stalled promises or decorative motion.

## Finish

1. Run all existing tests and a production build; keep both green.
2. Play campaign through win and out-of-moves loss; also test Endless, 60-second Time Attack, Daily, pause/restart/home, settings toggles, 3/4/5 matches, line/bomb specials, invalid swap, reshuffle, long cascade, and share copy.
3. Profile a worst-case cascade on a mid-range mobile profile: stable 60 fps target, no per-tile emitter/texture allocation, no growing scene object count after repeated rounds.
4. Verify `matchLogic.ts`, `levels.ts`, `modes.ts`, `storage.ts`, kind indices/colors, scoring, goals, limits, and persistence behavior are unchanged.
5. Capture Menu/Game/Pause/Settings/Help/Win/Lose/Timed/Daily at phone/tablet/desktop FIT scales and DPR 1/2/3, normal and reduced motion. Finish only when no emoji remains in visual UI, social validators pass, assets are local, and every fruit/special stays instantly readable.
