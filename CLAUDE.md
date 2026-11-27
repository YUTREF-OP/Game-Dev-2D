# CLAUDE.md — Project Instructions & Engineering Rules

## 1. Project Context & Collaboration Workflow
* **Role:** You are the Lead Programmer and Software Architect for this 2D pixel-art side-scroller action RPG.
* **Source of Truth:** Always read `GDD.md` before writing or modifying code. Follow its specifications for resolution, controls, RPG formulas, and milestones.
* **Two-AI Workflow:** Game design, lore, and `/data/*.json` content are authored externally and dropped into the `/data/` folder. Keep game logic strictly decoupled from content data so new items, enemies, and dialogue can be added via JSON without touching core engine code.

## 2. Tech Stack & GitHub Pages Compatibility
* **Zero-Build Architecture:** Use standard HTML5, CSS3, and native ES6 JavaScript modules (`type="module"`) with **Phaser 3 loaded via CDN**. Do NOT introduce npm, Webpack, Vite, or TypeScript build steps—the repository must run directly as a static site on **GitHub Pages**.
* **Relative Paths Only (Critical):** GitHub Pages serves repositories from a subdirectory (`/<repo-name>/`). Always use relative paths (`./src/main.js`, `./data/game_constants.json`, `./assets/...`) and NEVER leading-slash root paths (`/src/...` or `/data/...`), which cause 404 errors on GitHub Pages.

## 2a. Target Platform & Controls (Mobile-First)
* **Game Format:** The game is a **320x180 Phaser 3 side-scroller**. Where `GDD.md` describes other perspectives, engines, or platforms (e.g., isometric turn-based grid, PC), this rule wins: adapt those systems to the side-scroller format.
* **Platform:** Mobile phones in **landscape**, played in the browser (GitHub Pages) or installed via "Add to Home Screen" (`manifest.webmanifest`). Portrait shows a rotate-device overlay.
* **Primary Input = Touchscreen:** A floating virtual joystick on the left half of the screen and on-screen action buttons on the right (currently JUMP and DASH), drawn in `UIScene.js`. Every new action must get a touch control; never ship a mechanic that needs a keyboard.
* **Input Architecture:** `UIScene.js` writes touch state into the shared `InputSystem` (`src/systems/InputSystem.js`, stored in the registry as `virtualInput`); entities only read from it. The keyboard stays enabled as a desktop development fallback.
* **Touch Ergonomics:** Keep buttons at least 32 px (base resolution) with generous hit radii, support at least 3 simultaneous touches, and keep HUD readouts clear of the thumb zones (bottom-left and bottom-right).

## 3. Pixel Art & Rendering Standards
* **Base Resolution:** `320x180` (16:9), scaled via `Phaser.Scale.FIT` and `Phaser.Scale.CENTER_BOTH`.
* **Crisp Pixel Enforcement:** Always keep `pixelArt: true`, `antialias: false`, and `roundPixels: true` in the Phaser game config, and `image-rendering: pixelated;` in CSS. Never apply blurry smoothing or fractional camera scaling.
* **Fallback Graphics:** If an asset referenced in `/assets/` does not exist yet, generate a clean pixel placeholder texture via `Graphics.generateTexture()` in `BootScene.js` so the game never crashes on missing `.png` files.

## 4. Folder Structure & Code Organization
Maintain the exact directory layout defined in `GDD.md`:
* `index.html` — Entry point and viewport styling
* `src/main.js` — Phaser config and scene registration
* `src/scenes/` — `BootScene.js`, `WorldScene.js`, `UIScene.js`
* `src/entities/` — `Player.js`, `Enemy.js`, `NPC.js`
* `src/systems/` — `InputSystem.js`, `CombatSystem.js`, `InventorySystem.js`, `SaveSystem.js`
* `data/` — `game_constants.json`, `player_pilot_and_tank.json`, `weapons_and_systems.json`, `monsters_starter_roster.json`, `monsters_roster.json`, `world_factions_and_swarms.json`, `salvage_and_economy.json` (see GDD.md section 7)
* `assets/` — `sprites/`, `tilesets/`, `audio/`

## 5. Coding & Output Standards
* **Decoupled Scenes:** Keep HUD and menus inside `UIScene.js` running in parallel with `WorldScene.js`, communicating via Phaser's event emitter (`this.events` / `game.events`) rather than tightly coupling UI code inside entity classes.
* **Schema Stability:** Never rename or remove existing keys in `data/*.json` without updating `GDD.md` and documenting the schema change.
* **Complete Implementations:** When creating or editing files, output complete, runnable code without `// TODO` stubs or omitted imports.
