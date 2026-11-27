# Game Design Document (GDD)

## 1. Project Overview
* **Title:** Broke World
* **Genre:** 2D Side-Scroller Action RPG
* **Setting & Theme:** Sci-fi, Post apocalyptic
* **Core Hook:** Interactive Core loop gameplay
* **Target Scope:** Vertical slice (1 playable hub/safe zone, 1 combat zone, 3 enemy types, 1 boss, basic inventory & leveling).

## 2. Technical & Art Specifications
* **Engine / Framework:** HTML5 / JavaScript (ES6+) with [Phaser 3 / KAPLAY / Vanilla Canvas]
* **Base Resolution:** `320x180` (16:9 aspect ratio, integer-scaled to fit viewport)
* **Rendering Rules:** `pixelArt: true`, `antialias: false`, CSS `image-rendering: pixelated`
* **Tile & Sprite Grid:** `16x16` px environment tiles; `16x24` or `32x32` px character sprites
* **Art Style & Palette:** [e.g., 16-bit SNES style, limited 32-color palette, outline style]
* **Audio:** Retro chiptune BGM + Web Audio API / `.wav` SFX

## 3. Core Gameplay & Controls
* **Movement:** `A/D` or `Left/Right` to run, `Space` or `W` to jump (variable jump height + coyote time), `Shift` to dash/dodge (with brief invulnerability frames).
* **Combat:** `J` or `Left Click` for primary melee combo; `K` or `Right Click` for secondary skill/ranged attack.
* **Interaction & UI:** `E` to talk/interact/loot, `I` or `Tab` to open Inventory/Stats, `Esc` to pause.
* **Core Loop:** Explore side-scrolling stages -> Defeat enemies for XP & loot -> Return to safe zone/camp to equip gear, upgrade stats, and accept quests -> Unlock deeper areas.

## 4. RPG Systems & Formulas
* **Player Stats:**
  * `HP` (Health), `MP` / `Stamina` (Skill resource)
  * `ATK` (Physical damage), `DEF` (Damage reduction), `SPD` (Move/attack speed)
* **Damage Formula:** `Damage = Math.max(1, Attacker.ATK - Math.floor(Defender.DEF * 0.5))`
* **Leveling Formula:** `XP_To_Next_Level = Math.floor(100 * Math.pow(Current_Level, 1.5))`
* **Save System:** Auto-save player stats, inventory IDs, and quest flags to browser `localStorage`.

## 5. Data Architecture (AI Collaboration Contract)
All game content is stored in `/data/*.json` so content can be expanded without altering engine logic:
* **`/data/items.json`:** `{ "id": "sword_iron", "name": "Iron Broadsword", "type": "weapon", "atk": 8, "value": 50, "description": "..." }`
* **`/data/enemies.json`:** `{ "id": "slime_green", "name": "Forest Slime", "hp": 30, "atk": 5, "def": 1, "xp": 15, "ai": "patrol_hop", "drops": ["gel_01"] }`
* **`/data/dialogue.json`:** `{ "npc_id": "blacksmith", "nodes": { "start": { "text": "...", "options": [...] } } }`

## 6. Project Folder Structure
```text
/project-root
├── index.html          # Entry point & canvas container
├── GDD.md              # This design document
├── /src
│   ├── main.js         # Engine config & scene initialization
│   ├── /scenes         # BootScene, WorldScene, UIScene
│   ├── /entities       # Player.js, Enemy.js, NPC.js
│   └── /systems        # CombatSystem.js, InventorySystem.js, SaveSystem.js
├── /data               # items.json, enemies.json, dialogue.json
└── /assets
    ├── /sprites        # Player, enemy, and item spritesheets (.png)
    ├── /tilesets       # Environment tiles and Tiled maps (.json / .png)
    └── /audio          # Music and sound effects
