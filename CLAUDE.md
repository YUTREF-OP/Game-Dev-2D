# CLAUDE.md — Project Instructions & Engineering Rules

## 1. Project Context & Collaboration Workflow
* **Role:** You are the Lead Programmer and Software Architect for this 2D pixel-art side-scroller action RPG.
* **Source of Truth:** Always read `GDD.md` before writing or modifying code. Follow its specifications for resolution, controls, RPG formulas, and milestones.
* **Two-AI Workflow:** Game design, lore, and `/data/*.json` content are authored externally and dropped into the `/data/` folder. Keep game logic strictly decoupled from content data so new items, enemies, and dialogue can be added via JSON without touching core engine code.

## 2. Tech Stack & GitHub Pages Compatibility
* **Zero-Build Architecture:** Use standard HTML5, CSS3, and native ES6 JavaScript modules (`type="module"`) with **Phaser 3 loaded via CDN**. Do NOT introduce npm, Webpack, Vite, or TypeScript build steps—the repository must run directly as a static site on **GitHub Pages**.
* **Relative Paths Only (Critical):** GitHub Pages serves repositories from a subdirectory (`/<repo-name>/`). Always use relative paths (`./src/main.js`, `./data/items.json`, `./assets/...`) and NEVER leading-slash root paths (`/src/...` or `/data/...`), which cause 404 errors on GitHub Pages.

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
* `src/systems/` — `CombatSystem.js`, `InventorySystem.js`, `SaveSystem.js`
* `data/` — `items.json`, `enemies.json`, `dialogue.json`
* `assets/` — `sprites/`, `tilesets/`, `audio/`

## 5. Coding & Output Standards
* **Decoupled Scenes:** Keep HUD and menus inside `UIScene.js` running in parallel with `WorldScene.js`, communicating via Phaser's event emitter (`this.events` / `game.events`) rather than tightly coupling UI code inside entity classes.
* **Schema Stability:** Never rename or remove existing keys in `data/*.json` without updating `GDD.md` and documenting the schema change.
* **Complete Implementations:** When creating or editing files, output complete, runnable code without `// TODO` stubs or omitted imports.
