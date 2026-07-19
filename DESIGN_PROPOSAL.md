# Fruit Blast — design proposal

## Executive decision

Keep the fast, deterministic match-3 foundation and replace the entire presentation layer with an owned **midnight orchard arcade**: custom fruit sprites, one icon system, self-hosted type, quieter hierarchy, and tactile match feedback. The home should default to campaign continuation in one tap; Zen, Time Attack, and Daily remain available without all competing equally on the first screen.

Recommended product sentence: **“Small swaps. Juicy chain reactions.”**

## Audit basis

The proposal follows a local run through the menu, Settings, How to Play, Campaign, Endless/Zen, Time Attack, Daily Challenge, live swaps/cascades, special-tile creation, pause, fixed-run result, and campaign completion. The inspection included a 390 × 844 phone viewport and the game’s fitted desktop canvas. Win/loss/result scene construction and transitions were also traced to their exact source after exercising the reachable live paths.

## 1. Vibe-coded red-flag audit

**Honest current state: 35% of a premium commercial release.** The match rules, persistence, modes, and responsive Phaser shell are credible. The visible product still resembles a capable prototype because the artwork is emoji, the type is the host system font, and almost every screen is built from the same purple gradient and capsule buttons.

### Severity 1 — remove before flagship positioning

1. **Emoji are the entire fruit art set.** Every board tile is a platform glyph (`src/game/config.ts:48`), the menu opens with the same six emoji (`src/scenes/MenuScene.ts:24`), collection goals reuse those glyphs (`src/game/levels.ts:70`), Daily share medals are emoji (`src/game/modes.ts:50`), and the lose screen uses a large sad face (`src/scenes/LoseScene.ts:52`). The fruit rendering changes across OS/browser, lacks a shared light source or silhouette discipline, and is the clearest amateur/AI-template tell.
2. **There is no owned typography.** Buttons use `system-ui` (`src/ui/Button.ts:52`); the menu, HUD, pause, win, loss, settings, and results repeat it (`src/scenes/MenuScene.ts:26`, `src/scenes/GameScene.ts:193`, `src/scenes/PauseScene.ts:41`, `src/scenes/WinScene.ts:55`, `src/scenes/LoseScene.ts:48`, `src/scenes/SettingsScene.ts:30`, `src/scenes/ResultScene.ts:40`). Weight and line breaks will materially vary by platform.
3. **The rendered game is essentially inaccessible to assistive technology.** The page mounts one Phaser canvas in an otherwise empty game div (`index.html:23`, `index.html:24`, `src/main.ts:13`, `src/main.ts:28`). Menus, mode choices, score, moves, Settings, and results have no DOM roles, accessible names, focus order, or live announcements. Keyboard-only and screen-reader users cannot discover the game structure.

### Severity 2 — conspicuous commercial-polish gaps

4. **The visual direction is a generic dark-purple casual-game gradient.** Every shell scene shares two purple stops, a strawberry-pink CTA, yellow score, and rounded purple panels (`src/ui/theme.ts:10`, `src/ui/theme.ts:21`, `src/scenes/GameScene.ts:182`). The palette is serviceable but not specific to fruit, orchards, markets, or this brand.
5. **The icon language is an uncurated mix of emoji, Unicode, and text symbols.** Home uses `✦`, `∞`, `⏱`, `📅`, `⚙`, and `?` (`src/scenes/MenuScene.ts:46`, `src/scenes/MenuScene.ts:56`, `src/scenes/MenuScene.ts:58`, `src/scenes/MenuScene.ts:60`, `src/scenes/MenuScene.ts:63`, `src/scenes/MenuScene.ts:65`); pause uses `▶`, `↻`, `⌂`, and speaker emoji (`src/scenes/PauseScene.ts:45`, `src/scenes/PauseScene.ts:50`, `src/scenes/PauseScene.ts:60`, `src/scenes/PauseScene.ts:74`). They do not share stroke, optical size, or baseline.
6. **The opening screen distributes attention across too many equal capsules.** New Game, three alternate modes, Settings, and How to Play all use the same rounded-button component, while best scores and streak occupy two prominent lines above play (`src/scenes/MenuScene.ts:31`, `src/scenes/MenuScene.ts:37`, `src/scenes/MenuScene.ts:46`, `src/scenes/MenuScene.ts:51`, `src/scenes/MenuScene.ts:56`, `src/scenes/MenuScene.ts:58`, `src/scenes/MenuScene.ts:60`, `src/scenes/MenuScene.ts:63`). It is tidy but feels like a feature menu, not a flagship game invitation.
7. **Motion is mostly reusable tween presets rather than fruit-specific material behavior.** The logo perpetually breathes (`src/scenes/MenuScene.ts:29`), scene changes are a generic 170 ms fade (`src/ui/transitions.ts:3`, `src/ui/transitions.ts:11`, `src/ui/transitions.ts:23`), and buttons use the same hover-grow/press-shrink treatment (`src/ui/Button.ts:67`, `src/ui/Button.ts:75`). Board cascades contain real juice, but the shell does not inherit it.
8. **Metadata is pre-launch quality.** There is an inline three-dot favicon, no manifest/apple icon, no description, and no Open Graph/Twitter preview (`index.html:5`, `index.html:6`, `index.html:9`, `index.html:10`). The first shared link will not present a controlled commercial brand card.

### Severity 3 — refinement and broad-appeal risks

9. **Small logical labels become too small after `FIT` scaling.** HUD labels use 24 px at a 720 px design width (`src/scenes/GameScene.ts:198`, `src/scenes/GameScene.ts:205`) and menu helper text uses 25–27 px (`src/scenes/MenuScene.ts:32`, `src/scenes/MenuScene.ts:52`). On a 390 px-wide phone that is roughly 13–15 CSS px. Bottom utility buttons are 72 logical px high (`src/scenes/MenuScene.ts:63`), about 39 CSS px at that width—below a comfortable all-ages target.
10. **State is often encoded by fruit color plus an OS-dependent fruit picture.** Distinct emoji silhouettes help today, but a replacement art set must preserve silhouette, internal pattern, and label differences; hue alone cannot identify tile type or special state (`src/game/config.ts:41`, `src/game/config.ts:48`).
11. **Loss presentation slips into generic mobile-game pathos.** “Out of moves” plus a large `😔` is visibly stock and slightly cringe (`src/scenes/LoseScene.ts:48`, `src/scenes/LoseScene.ts:52`). A precise progress recap and an energetic retry beat are stronger than an emotional emoji.
12. **Settings are too thin for a flagship shell.** Only sound and music are exposed (`src/scenes/SettingsScene.ts:30`, `src/scenes/SettingsScene.ts:34`, `src/scenes/SettingsScene.ts:39`); there is no reduced motion, haptics, contrast/pattern mode, or input help.

### Specifically not observed

- No stock-photo or mismatched downloaded art; the current build is self-contained.
- The match engine has meaningful motion tuning and pooled effects rather than only CSS-template animation (`src/game/config.ts:76`, `src/scenes/GameScene.ts:68`). Preserve the responsive feel.
- Board pieces already combine color and different fruit silhouettes in principle. Preserve and strengthen that when replacing emoji.
- Offline operation and guarded storage are already deliberate (`src/game/storage.ts:1`).

## 2. Visual direction

### Direction A — Midnight orchard arcade (recommended)

Deep aubergine atmosphere with hand-cut fruit forms, warm market-light highlights, and restrained arcade energy. This evolves the existing dark foundation without preserving its generic gradient look.

- **Wordmark:** compact custom Fruit Blast lettering with a sliced-fruit counter inside the “B” and a leaf terminal. One-color and small-size versions must remain recognizable.
- **Dark palette:** orchard night `#130D1B`, raised plum `#21162B`, cream `#FFF4DB`, berry CTA `#F05D65`, gold `#F3C14B`, mint `#49C7A5`, sky `#5D8FE8`, grape `#8A5BD2`.
- **Light palette:** paper `#FFF6E5`, warm panel `#FFFDF7`, brown-black `#30202A`, berry `#D94C5B`, leaf `#2E8B68`, golden fruit `#D79A22`.
- **Type:** self-host **Bricolage Grotesque** WOFF2 for the wordmark-adjacent display voice and **Atkinson Hyperlegible Next** WOFF2 for HUD, instructions, and controls. Use tabular figures for score/time/moves.
- **Fruit art:** six custom 128 px vector-authored sprites packed into an offline texture atlas. Each has a unique outer silhouette, leaf/stem, highlight geometry, and internal seed/segment pattern. Do not make them rounded colored squares with an icon pasted on top.
- **Specials:** line fruit gets a directional paper band and arrow cut; color bomb is a dark jam jar/seed core with a distinct ring. Effects reuse the fruit’s material language.
- **Iconography:** one filled/outlined SVG atlas with rounded cuts, not text glyphs. Home, pause, sound, timer, calendar, retry, and ads all use it.
- **Motion:** swap 160–190 ms; matched fruit squash before bursting into pulp/leaf particles; gravity has weight but settles within roughly 700–850 ms; specials draw a clear path before the hit. Camera nudge only for 4+ matches. Celebration 1.2–1.8 seconds, not a persistent confetti storm.

### Direction B — Sunlit fruit stand

Cream background, striped awning shapes, produce-crate board, ink outlines, and brighter daytime colors. It is instantly friendly and highly distinctive but requires a bigger background/UI rebuild and risks looking younger than the desired broad commercial position.

**Recommendation:** Direction A. It is premium, works with the existing night shell, flatters saturated fruit, and lets art effort concentrate on pieces and feedback rather than replacing every scene composition.

### Production rules

- No remote assets or fonts. Ship WOFF2, SVG/icon atlas, texture atlas, social image, and audio locally.
- Art is authored once at high resolution, then packed with 1×/2× tiers. Low-end mode disables expensive particles and post effects, not the core silhouettes.
- Use three surface elevations only: playfield, floating HUD, modal/result.
- Use one corner-radius family; do not make every control a pill.
- Maintain 60 fps on a low-end Android target; avoid high-performance GPU preference as a blanket requirement unless profiling proves it helps battery/frame pacing (`src/main.ts:17`).

## 3. Opening screen and mode selection

### Recommended structure

Campaign is the default longitudinal game. Daily is the recurring event. Zen and Time Attack are alternate modes behind one clear destination.

Home above the fold:

1. Wordmark and compact Settings icon.
2. One dominant context action:
   - first player: **Play — Level 1**;
   - returning campaign: **Continue — Level 7 · 2★ best**.
3. Smaller **Daily — 20 moves** card with completed/best state.
4. **Modes** button showing “Zen · Time Attack”.
5. A single progress strip: campaign level and total stars. Detailed records live in Profile/Stats, not above the Play button.

### Concrete flows

```text
Home → Play/Continue → Campaign level → Win/Lose → Next/Retry → next level
Home → Daily → deterministic 20-move board → Result → Share/Home
Home → Modes → Zen / Time Attack / Level select → chosen game
Home → Settings → Sound / Music / Motion / Haptics / Tile labels
```

Do not use a progressive mode → rules → theme funnel. Match-3 rules are stable; every additional pre-game classification is friction. Mode selection should be one sheet/scene and one tap.

### New Game behavior

Never put a destructive **New Game** ahead of Continue. Continue is primary. “Restart campaign” belongs in Settings/Profile, behind a confirmation that states exactly what resets. Preserve best scores and clearly name what stays; the current confirmation already follows that principle (`src/scenes/MenuScene.ts:80`).

## 4. Product scope

Fruit Blast does not need more top-level modes. Campaign, Zen, 60-second Time Attack, and a deterministic Daily already cover progression, relaxation, intensity, and return play (`src/game/modes.ts:14`). Depth should come from level goals, board events, and specials—not another row of mode buttons.

Recommended content roadmap:

- First eight levels remain gentle authored onboarding (`src/game/levels.ts:21`), but each introduces one concept with a visual micro-tutorial.
- Add 30–40 deliberately authored campaign levels before leaning on procedural continuation. Rotate score, collect, special-use, and obstacle goals.
- Introduce one new board mechanic at a time: crates, ice, baskets, or vines. Every obstacle must preserve deterministic testability in `matchLogic.ts` or be called out as a deliberate semantics change.
- Seasonal appearance is an offline bundled palette/board-frame selection, not remote live-ops dependency.

## 5. Addictive loop, without manipulation

### Session loop

- Campaign level: 60–120 seconds.
- Time Attack: exactly 60 seconds.
- Daily: 20 meaningful moves.
- Zen: indefinite, with a clear score milestone every 2–3 minutes and an always-visible safe exit.

Results lead with progress, then one obvious action: **Next level**, **Retry**, or **Play again**. Home is secondary but never hidden.

### Progression and reward cadence

- Campaign stars remain skill-based. Show a small level path only after play, not a giant monetized map.
- Every level gives immediate goal progress; every 3 early levels unlocks a cosmetic board frame, fruit expression, or background detail. Cosmetics do not affect odds.
- Specials are the main moment-to-moment reward: clear formation rule, satisfying forge, readable detonation, and short combo recap.
- Daily streak shows current and personal best without threatening copy. Missing a day resets the count without a funeral animation or purchase prompt.
- Weekly orchard card: complete any five levels or one Daily on three days to earn a cosmetic stamp. No fake timer; the actual week boundary is enough.

### Near-miss and comeback feel

- When one match can finish a goal, the goal meter changes shape and text (“3 lemons left”); do not secretly alter the board.
- After a campaign loss, show exact remaining goal and the strongest combo achieved. “One good match away” appears only when mathematically true.
- One optional continue may add three moves after loss. It is never required to make authored levels fair.
- No fake scarcity, rigged cascades, forced social, aggressive notification copy, or repeated “Are you sure?” exits.

## 6. Ad placement

Portal principle: request ads only at natural stops and preserve a complete no-fill/no-ad path. CrazyGames permits midgame ads at death or level completion and requires rewarded offers to be explicit; Poki places commercial breaks between gameplay stop and the next gameplay start; GameDistribution requires pause/mute around playback. See [CrazyGames ad requirements](https://docs.crazygames.com/requirements/ads/), [Poki Phaser guidance](https://sdk.poki.com/phaser), and [GameDistribution SDK implementation](https://github-wiki-see.page/m/GameDistribution/GD-HTML5/wiki/SDK-Implementation).

### Interstitial

- Request at player intent: after a win when **Next** is tapped, after a loss when **Retry** is tapped, or after a fixed run when **Play again** is tapped.
- No interstitial before the first gameplay session. First eligible request after two completed campaign levels or three completed fixed runs.
- Local cap recommendation: at least two completed levels/runs and eight minutes between shown interstitials. The portal may impose a stricter fill cap.
- Daily: only after the result has been fully shown and the player leaves/replays; never before sharing or seeing the score.
- Pause game loop, input, music, timers, and tweens before playback; restore all paths on complete, cancel, error, or unavailable fill.
- Never interrupt a swipe, cascade, special animation, live timer, pause menu, Settings, first tutorial, or win celebration.

### Rewarded

- Recommended campaign offer: after loss, **“Watch an ad for +3 moves”**, once per level. The pre-ad screen is already a gameplay stop; the label states the reward before request.
- Assisted completion advances campaign but is marked assisted and capped at one star; personal unassisted best remains distinct. Claude may prefer no star cap—see Open decisions.
- No rewarded continue in Daily. Daily score comparability is more valuable than one impression.
- Do not offer a Time Attack extension if the run can set a normal best. A separate clearly labeled assisted run is possible but adds unnecessary product complexity.
- Cosmetic rewarded offers may appear in Home/Profile occasionally, never after every session and never chained.

### Banner and house promotion

- On desktop portals, reserve one 300 × 250 side-rail slot outside the 720 × 1280 canvas after the first session. Do not cover or horizontally squeeze the game.
- No mobile banner during gameplay. If mandated, reserve a Home/Result slot and hide it while the board is active.
- A house promotion can appear as one branded result card after three sessions. It must look like promotion, not a prize chest or level reward.

## 7. Broad appeal and accessibility

- Add a semantic DOM mirror over/alongside Phaser: real buttons for menu/modal actions, headings for screens, and `aria-live` summaries for score/moves/result. The canvas remains visual; DOM owns accessibility and keyboard focus.
- Keyboard: arrows/WASD move a board cursor, Space selects, arrows choose an adjacent swap, Escape pauses, Enter activates the focused menu action.
- Screen reader: announce row/column, fruit name, selected state, valid/invalid swap, cleared count, goal progress, moves/time at sensible thresholds, and result. Do not narrate particle effects.
- Minimum final CSS text: 16 px body/control, 14 px metadata; minimum 48 × 48 CSS px actions. Measure after Phaser FIT scaling.
- Each fruit has unique silhouette + internal pattern + optional short label mode. Specials add direction/pattern, not hue alone.
- Add reduced motion, high-contrast/pattern tiles, music, effects, and haptics toggles. Honor OS reduced-motion preference where the host exposes it.
- Use plain labels: “Zen”, “60 seconds”, “20 moves”, “3 moves left”. Do not assume match-3 jargon; teach line clear and color clear when first created.
- Pause automatically on visibility loss and ad start. Resume only after explicit player intent when a timer is involved.
- Cap particles, pooled objects, texture size, and simultaneous audio voices for low-end phones. Keep the current pure match logic and deterministic Daily path testable.

## 8. Future-build constraints

These are acceptance constraints for the later implementation, not changes in this PR:

- Do not change `src/game/matchLogic.ts`, `src/game/levels.ts`, `src/game/modes.ts`, or `src/game/storage.ts` semantics without naming it as a deliberate product decision and adding migration/tests.
- Preserve Daily determinism from `dailySeed(dateKey)` and the current storage records unless an explicit pre-launch reset is agreed (`src/game/modes.ts:46`, `src/game/storage.ts:147`).
- New storage is additive and guarded; existing `fruitblast:*` keys continue to load (`src/game/storage.ts:7`).
- Everything works offline; no CDN fonts, sprite sheets, SDK dependency required for the base game, or remote configuration needed to play.
- Portal adapters must be optional and must not change game outcome on unavailable/error paths.

## 9. Open decisions for Claude

1. **Visual direction:** Midnight orchard (recommended) vs Sunlit fruit stand. Midnight reuses the current shell investment and feels premium; Sunlit is more immediately friendly but is a larger rebuild.
2. **Primary home action:** Continue Campaign (recommended) vs last-played mode. Campaign gives the product a clear spine; last mode favors frequent Zen/Time players.
3. **Mode visibility:** Daily card + one Modes button (recommended) vs all three alternate modes on Home. The compact home improves first-play clarity; full visibility improves discoverability.
4. **Rewarded continue:** +3 campaign moves once, assisted and one-star-capped (recommended) vs unrestricted stars or no continue. The cap protects mastery; no cap feels more generous; no continue is cleanest.
5. **Campaign depth:** author 30–40 levels before procedural continuation (recommended) vs keep eight authored levels. More authored pacing materially improves retention but increases design/QA cost.
6. **Accessibility architecture:** semantic DOM mirror (recommended) vs keyboard-only canvas handling. DOM adds implementation work but is the only credible path to screen-reader menus and announcements.
7. **Tile labels:** optional letter/shape overlay (recommended) vs silhouette/pattern only. Labels maximize color-vision and cognitive accessibility; the board is visually cleaner without them.
8. **Type pairing:** Bricolage Grotesque + Atkinson Hyperlegible Next (recommended) vs one rounded grotesk. The pairing gives display personality and excellent HUD readability; one family reduces payload and art direction.
9. **Ad cap:** two completed levels/runs plus eight minutes (recommended) vs portal-only frequency. A local cap guarantees feel across hosts; portal-only is simpler and may maximize fill.
