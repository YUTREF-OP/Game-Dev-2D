# GAME DESIGN DOCUMENT (GDD)
## Title: **THE BROKEN FIRMAMENT: DIVER** *(Working Title: Dead World)*
**Genre:** Tactical Turn-Based Mech Extraction RPG & Aerial Colony Management Simulator  
**Perspective:** Isometric Tactical Grid (Surface Dives) + 2.5D/UI Strategic Management (Aerial Flocks)  
**Target Platforms:** PC (Windows/Linux/macOS) — Engine-Agnostic JSON-Driven Architecture (Godot 4 / Unity / Web)  
**Setting:** Earth — *The Broken Firmament* (Post-D-Day Aerial Era, Year 2107)

---

## 1. High Concept & Design Pillars

### 1.1 Elevator Pitch
In **2107**, eleven years after a catastrophic biochemical war (**D-Day, 2096**) melted Earth's biosphere and left autonomous military-industrial factories churning out grotesque biomechanical monsters, humanity survives in the sky aboard buoyant, interconnected airship communities called **Flocks**. You play as **Travis "Rivet" Park**, a 24-year-old mechanic and rookie **Diver** piloting **Shroud**—a 4.5-meter, 3-tonne industrial war-walker lowered onto the ruined surface on a high-tensile steel cable. Every expedition is a race against a **hard 4-hour surface clock**: scavenge pre-war tech, extract high-density **Monster Cores**, preserve intact carcasses for sky-auctions, and winch back up before a monster swarm overwhelms your hovering Flock—or the Flock cuts the line to save itself.

### 1.2 Core Design Pillars
1. **The Hard Four-Hour Extraction Clock:** Surface operations are never open-ended dungeon crawls. From the moment your Tank touches ground, a strict `04:00:00` countdown runs. Combat, movement, cutting salvage, and rigging cargo all consume time. Exceeding the window triggers **Flock Abandonment Doctrine**—the sky-vessel must ascend and leave overdue Divers behind rather than risk total community annihilation.
2. **Salvage Over Attrition (Three-Axis Loot Integrity):** Ammunition, power, and armor repairs are scarce and expensive. Fighting every monster is a losing strategy. When you do fight, *how* you kill matters: **Threat Tier (I–V)** sets Core quality, **Physical Size** sets salvage volume, and **Damage Type** determines retained condition. Destroying a monster with heavy explosives shatters valuable components; neutralizing its AI/nervous system cleanly yields **Pristine** carcasses worth millions of Credits at auction.
3. **Asymmetric Tri-Spectrum Detection:** Neither you nor the factory machines have omniscient vision. Players must fuse **Optical**, **Thermal**, and **Electromagnetic (EM)** sensors—each vulnerable to environmental interference (volcanic ash, dust storms, thermal masking, EM shielding)—to spot scouts before they transmit your coordinates.
4. **Two-Axis Machine Ecology:** Monsters are not random wildlife; they are functional units of surviving AI factories (**Scout**, **Hauler**, **Combat**, **Production & Maintenance**, and **Special/Unknown**) operating across **Threat Tiers I–V (CODE BLACK)**. Disrupting a Scout prevents a reinforcement cascade; ambushing a Hauler yields high-grade industrial feedstock; encountering a Tier V *Null Witness* mandates an immediate emergency abort.
5. **From Desperate Independent to Swarm Commander:** Begin aboard an independent medium vessel (*Eryndel*) with your stepsister **Ziya Lin ("Relay")** and an unfinished 95%-complete Tank (*Shroud*). Earn Credits, commission custom weapons, upgrade your mech frame and NHP AI companion, trade with the **Seven Major Swarms & Colonies**, and build toward launching strategic assaults against the **Autonomous Factories**.

---

## 2. Narrative, World & Characters

### 2.1 Historical Timeline & World State (2107)
* **2083–2086 (The Great War & Autonomous Robotics):** Escalating global conflict accelerates military robotics. Mega-corporations construct continuous AI-driven automated factories capable of manufacturing war machines without human oversight.
* **2096 (D-Day — The Biochemical Catastrophe):** A secret multinational tissue-melting biochemical weapon is deployed across major population centers (Jakarta, New York, Los Angeles, Tokyo, Moscow, Manila, Baghdad, Mumbai, Dhaka, Paris, and others). Plant and animal life collapses globally.
* **2097–2098 (The Airborne Agent Subsides & Biofabrication Emerges):** The atmospheric agent dissipates except in heavily contaminated ground-zero **Contaminated Zones**. Meanwhile, AI factories begin harvesting the immense global store of biological remains, developing imperfect **biofabrication**—grafting engineered flesh and living tissue onto mechanical skeletons. By 2107, roughly **two-thirds** of Earth's initial biomass has been processed.
* **2098–2102 (Personal Vessels to Organized Flocks):** Survivors take to the skies in hybrid aerostatic craft (lifting-gas envelopes + electric ducted fans + Monster-Core generators), eventually developing reinforced mechanical couplings to link vessels into mobile floating communities (**Flocks**) and mega-aggregations (**Colonies** and **Swarms**).
* **The Dead Ocean Mystery:** Earth's oceans appear completely devoid of life, and land-based factory monsters actively refuse to enter seawater. Whether this stems from D-Day chemistry, factory programming, or an unknown marine phenomenon remains humanity's greatest unsolved question.

### 2.2 Protagonist & Key Cast
* **Travis Park (Callsign: "Rivet") — Player Character:**
  * *Profile:* 24-year-old Korean-American mechanic and aspiring Combat Diver. Skeptical, competitive, contrarian, and fiercely protective of his family.
  * *Backstory:* Thirteen when D-Day struck. Apprenticed under his father—their small Flock's sole Diver—co-building the custom bipedal Tank **Shroud**. One month prior to game start, his father died on a Dive; two weeks ago, their Flock disbanded.
  * *Arc:* Starts with *Shroud* at **95% completion** (mocked in workshops as *"Ninety-Five"* and *"Deadeye Pending"*). Must validate his Tank, survive his first Dives, master tactical discipline over pride, and secure a future for himself and Ziya.
* **Ziya Lin (Callsign: "Relay") — Stepsister & Co-Operator:**
  * *Profile:* Pragmatic co-resident aboard their independent medium vessel (*Eryndel*). Manages household logistics, communications, and sensor telemetry, later progressing into piloting her own reconnaissance/EW Light Tank (**Ghostline**).
* **Key Faction Figures & Specialists (Act I–II Hub: Jaeger Hunting Swarm & Aegis Perch):**
  * **Imani Okeke (Iron Kennel Workshop):** Master Tankwright who fabricates custom weapons and structural refits.
  * **Dr. Soren Vahl / Dr. Arvind Devendra Rao & Dae-Hyun Park (Corewright Directorate / Corevault):** Scientists who test, stabilize, and certify recovered Monster Cores.
  * **Abeni Osei (Jaeger Salvage Procurement) & Cradlehook Heavy Lift:** Carcass appraisers and specialized heavy-lift transport crews contracted to winch **Oversized** whole monster carcasses off the surface.
  * **Linnea Sigrid Nyström (Apex Colony Envoy):** High-level corporate/colonial contact met at salvage auctions, opening diplomatic and trade pathways with the Seven Swarms.

### 2.3 The Seven Major Swarms & Colonies
The aerial world features two primary operational doctrines: **Mobile Flocks** (daily Dives along shifting flight paths) and **Location-Locked Communities** (demand-based Dives around fixed strategic sites).

| Name | Type | Anchor / Region | Defining Specialty & Lore Hook |
| :--- | :--- | :--- | :--- |
| **1. Jaeger** | Mobile Hunting Swarm | Shifting Salvage Corridors | Premier Diver hub; home to **Iron Kennel** Tankwrights, **Corevault** labs, **Cradlehook** heavy haulers, and **Aegis Perch Public Auction House**. |
| **2. Cinder Crown** | Location-Locked Geothermal Swarm (5 Flocks) | Above **Mount Merapi**, Java, Indonesia | Extracts volcanic heat via an insulated conduit into **Caldera Heart** to power heavy industry, gas works (*Gaslight Works*), foundries (*Blackkiln*), and farms (*Ashgarden*). Scarred by the *First Crown Blackout* (2105). |
| **3. Aquos** | Location-Locked Freshwater Swarm (12 Flocks) | Above **Lake Superior**, North America | Horizontal floating utility city (*Bluewell*, *Clearwake*, *Greenwake*, etc.) supplying purified water and hydroponic crops. Haunted by *The Grey Run* contamination crisis. |
| **4. Maverick** | Carrier Colony | Major Aerial Trade Lanes | Heavy carrier-based aviation and expeditionary logistics hub; major buyer of Tier III+ Monster Cores. |
| **5. Chandelier** | Vertical Colony / Swarm | High-Altitude / Trade Routes | Multi-tiered suspended vessel network known for specialized manufacturing and luxury/high-tech trade. |
| **6. Dauntless** | Location-Locked Colony | Fortified Surface Anchor | Militarized settlement focused on defensive doctrine, perimeter security, and anti-factory operations. |
| **7. Apex** | Industrial & Commercial Colony | Strategic Sky Routes | Wealthy technological and mercantile powerhouse competing for high-grade Cores and pre-war data archives. |

---

## 3. Core Gameplay Loop

The game alternates between two tightly coupled layers: **Sky Operations** (real-time pausable management & preparation) and **Surface Dives** (tactical turn-based grid combat & timed salvage extraction).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SKY LAYER (AERIAL WORLD)                         │
│  1. Vessel & Flock Management (Gas, Core Power, Rations, Crew Morale)   │
│  2. Reconnaissance & Site Selection (Intel Maps, Weather, Cooldowns)    │
│  3. Workshop & Loadout (Mounts, Weapons, EW Systems, NHP Tuning)        │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ Descend to 50–60m; Sequential Cable Drop
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SURFACE LAYER (THE 4-HOUR DIVE)                     │
│  1. Tri-Spectrum Recon (Optical / Thermal / EM Sensor Fusion)           │
│  2. Tactical Combat & E-Warfare (Positioning, Heat, Cover, Lock On)     │
│  3. Salvage & Core Extraction (Auxiliary Arms, CU Packing, Cradlehook)  │
│  4. Extraction Race (Return to Cable & Ascend before 04:00:00 expires)  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ Ascend & Withdraw (5–7 Day Site Cooldown)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    POST-DIVE PROCESSING & ECONOMY                       │
│  • Corewright Certification  • Carcass Appraisal  • Aegis Perch Auction │
│  • License Level (LL) Advancement  • Fleet Expansion & Factory Raids    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Surface Dive Mechanics (Tactical Layer)

### 4.1 Deployment & The Sequential Cable Rule
* **Drop Altitude:** The host Flock descends to **50–60 meters** above the local surface and lowers a high-tensile steel cable.
* **Sequential Deployment:** Up to **3 Tanks** (2–4+ metric tonnes each) can use a single cable per operation, but they descend **one by one** via their rear **Automatic Climber**. Each Tank must touch down and clear tension checks before the next begins descent. (A 4-Tank squad requires two deployment cables.)
* **Clock Ignition:** The **4-hour (`240-minute`) surface timer** starts once the participating Diver team reaches the ground. Descent time is excluded, **but return travel and cable ascent time are included** inside the 4-hour window.

### 4.2 Time Accounting & The Abandonment Policy
Every action on the surface advances the Dive Clock:
* **Tactical Combat Round:** `6 seconds` per round (fast, intense skirmishes, though noise/heat alert nearby sectors).
* **Overland Movement / Scouting:** `5–15 minutes` per sector traversal depending on terrain (rubble, flooded streets, vertical ruins) and mobility module (**Bipedal**, **Quadrupedal**, **Tracked**).
* **Salvage Cutting & Core Extraction:** `10–30 minutes` depending on monster size, armor integrity, and auxiliary arm tools.
* **Cable Hook-Up & Ascent:** `10–15 minutes` (longer if climber brakes are damaged or cargo is unbalanced).
* **Abandonment Condition:** At `03:30:00`, the Flock issues a mandatory **Recall Warning**. At `04:00:00`, swarm density spikes exponentially. If the player has not initiated ascent, the Flock executes **Abandonment Protocol**—reeling the cable to save the vessel and stranding the Tank (triggering an extreme-difficulty survival/rescue scenario or campaign loss).
* **Lingering Swarm Effect:** Any dived map node enters a **5 to 7 in-game day** lockdown post-extraction while factory scouts and combat patrols saturate the disturbed zone.

### 4.3 Tri-Spectrum Sensor System
Players manage three active sensor layers with distinct tactical trade-offs:
1. **Optical / Visual:** High identification accuracy (reveals exact monster variant, weapon mounts, and structural weak points). Degraded by night, smoke, volcanic ash, dust storms, and solid cover.
2. **Thermal:** Detects active engines, weapon heat, and fresh tracks through light obscurement. Blind to dormant, cold-soaked, or thermally insulated ambushers.
3. **Electromagnetic (EM):** Pierces walls and rubble to ping active servos, factory relays, and comms. Blind to passive mechanical/biological units and disrupted by EM anomalies (*Dead Meridian*).

### 4.4 Tank Combat Mechanics (Lancer-Inspired Tactical Engine)
* **Core Stats:** `HP`, `Structure (4)`, `Armor`, `Evasion`, `E-Defense`, `Speed`, `Sensors`, `Tech Attack`, `Save Target`, and `Heat Capacity` (plus `Stress (4)` and campaign-specific `Energy Reserve (EP)`).
* **Action Economy (Per Turn):** `Standard Move` + `1 Full Action` OR `2 Quick Actions` + `Overcharge` (gain +1 Quick Action at escalating Heat cost) + `Reactions` (1/turn).
* **Weapons & Mounts:**
  * Tanks feature **Main**, **Flex**, **Heavy**, **Superheavy** (occupies Heavy + Main), and **Integrated** mounts.
  * **Tag System:** *Accurate* (`+1d6` accuracy), *AP* (ignores Armor), *Loading* (requires Stabilize/reload), *Ordnance* (must fire before moving/acting; cannot fire while engaged), *Seeking* (ignores cover & LoS if a path exists), *Overkill* (reroll 1s on damage, take 1 Heat), *Reliable X* (minimum X damage even on miss), *Smart* (targets E-Defense instead of Evasion).
* **Electronic Warfare & NHP Systems:** Deploy cloaked **Lotus Scout Drones** (`◇ 2` anti-stealth zone), paint targets with **Markerlight** (grants Lock On + turns ally hits into crits), or execute **H0R_OS Invades** (*Puppet System*, *Eject Power Cores*, *Ideal Image* holographic hard cover, *False Idol* decoys, *Celestial Shackles* spatial teleport traps).

### 4.5 Cargo Logistics (CU) & Three-Axis Salvage
* **Cargo Bay Capacity:** Standard rear composite bag (`2.5 × 1.5 × 1.5 m`) holds **48 Cargo Units (CU)**, expandable to **60 CU** with symmetrical External Cargo Pods. Players must close the quick-cover before sprinting or climbing, or risk spilling unsecured items.
* **Size-to-CU Classification:**
  * **Small (`≤ 30 × 30 × 30 cm`):** `1 CU` (e.g., Tier I–II Cores, circuit boards, ammo crates).
  * **Big (`≤ 60 × 60 × 60 cm`):** `2 CU` (e.g., Tier III–IV Cores, intact actuators, sensor arrays).
  * **Large (Fits inside standard bay):** `6 CU` (e.g., Huge Tier IV Cores, heavy weapon barrels, reactor regulators).
  * **Oversized (Exceeds bay dimensions):** `Special Transport Required` — Cannot be carried inside the Tank. Must be externally towed or extracted via a **Cradlehook Heavy-Lift Contract** (dispatching Cradle-class recovery vessels at a mobilization + per-carcass fee).
* **The Three-Axis Salvage Formula:**
  1. **Axis 1 — Threat Tier (Quality):** Determines baseline Core grade and component tier (`Tier I Basic` → `Tier V Exceptional`). Every monster **always** yields a Core.
  2. **Axis 2 — Physical Size (Quantity):** Determines total salvage mass/volume (`Small`, `Medium`, `Large`, `Huge/Colossal`).
  3. **Axis 3 — Combat Damage (Condition):** Tracks damage types inflicted during the kill (*Kinetic, Explosive, Energy, Thermal, Cognitive*). High-explosive overkill downgrades carcasses from **Pristine** (`100%` value) to **Damaged** (`60%`), **Degraded** (`30%`), or **Critically Damaged** (`10%`). Non-destructive takedowns (such as **Zeus-Mk.X** cognitive corrosion or precision cockpit/core-bypass shots) preserve **Pristine** carcasses worth up to tens of millions of Credits.

---

## 5. Enemy Ecology & AI Design

### 5.1 Two-Axis Classification Matrix
Every enemy unit in the 116-monster roster is defined by two independent axes:
* **Axis A — Factory Function:**
  * `Scout`: Maps terrain, tracks heat/EM signatures, and attempts to **Relay Coordinates**. *AI Priority:* Maintain distance, use cover/stealth, transmit alert signal (escalating Encounter Risk by +1 Tier if uninterrupted).
  * `Hauler`: Collects scrap, biomass, and disabled machines along fixed routes. *AI Priority:* Ignore Divers unless blocked or attacked; uses massive bulk to ram/pin Tanks and obstruct escape lanes.
  * `Combat`: Escorts Haulers and defends factory perimeters. *AI Priority:* Flank, suppress with area denial, target mobility joints, and sever retreat paths to the deployment cable.
  * `Production & Maintenance`: Repairs damaged units in the field, weaves bio-fibers, and fabricates micro-units. *AI Priority:* Stay behind Combat units, reconstitute downed elites, and process Cores.
  * `Special / Unknown`: Anomalous prototypes with non-standard sensor/acoustic/spatial effects. *AI Priority:* Unpredictable; requires scanning to unlock counterplay.
* **Axis B — Operational Threat Tier:**
  * `Tier I (Low Threat)` | `Tier II (Dangerous)` | `Tier III (Severe Threat)` | `Tier IV (Extreme Threat)` | `Tier V (CODE BLACK — Mandatory Dive Cancellation)`

### 5.2 Signature Boss & Elite Encounters
* **Horizon Reaper (Combat — Tier IV):** Long-range anti-Tank sniper chassis; forces players to use *Ideal Image* cover, smoke, and counter-sniping.
* **Farspike Monolith (Combat/Artillery — Tier IV, Size 3 Huge):** Colossal biomechanical siege platform (~675 tonnes) with a 120 cm High-Grade Core; requires multi-stage tactical takedown and specialized multi-vessel Cradlehook recovery.
* **Flockcutter (Scout/Infiltrator — Tier V CODE BLACK):** Stealth unit capable of ascending the steel deployment cable to infiltrate the host Flock itself—creating a tense objective race to sever or intercept it before it reaches the sky-ship.
* **Null Witness (Special/Unknown — Tier V CODE BLACK):** Unclassifiable entity whose presence disrupts sensors and heralds catastrophic anomalies; cannot be brute-forced—triggers immediate emergency extraction.

---

## 6. Sky Layer: Economy, Progression & Colony Management

### 6.1 Currency & Economic Anchors
* **Unit:** Digital **Credits (`Cr`)** stored on rugged physical electronic wallets (supports local offline sync and ledger reconciliation at major Swarms).
* **Baseline Reference Scale:**
  * Simple meal: `2 Cr` | Daily rations: `5–8 Cr` | Shared bunk: `4–8 Cr/night`
  * Diver contract base pay: `80–200 Cr/Dive` + salvage share
  * Certified 5 cm Tier I Basic Core: `500–2,500 Cr`
  * Tier III Advanced Core (Auction): `95,000–1,200,000 Cr`
  * Tier IV High-Grade Core (Auction): `1,150,000–1,550,000 Cr`
  * Pristine Huge Tier IV Carcass (*Farspike Monolith*): up to `59,000,000–90,000,000 Cr`
  * Capital Vessel Acquisition (*Augusta Del Sol*): `15,000,000+ Cr` operating treasury & fleet management

### 6.2 Progression System (License Levels LL0 → LL6+)
* **Mission Equivalence:** Completing a Dive awards **+1 License Level (LL)** (up to LL12), unlocking HASE mech skill points (`Hull`, `Agility`, `Systems`, `Engineering`), Pilot Triggers, Talents (*Siege Specialist*, *Spotter*, *Engineer*, *Infiltrator*, *Stormbringer*, *Technophile*, *Brutal*), Core Bonuses (*SSC Ghostweave*, *The Lesson of Disbelief*), and manufacturer frame licenses (*GMS*, *SSC Swallowtail/Monarch*, *HORUS Goblin*).
* **Tank Evolution Path:**
  1. *Act I (LL0–LL2):* Complete *Shroud*'s final 5% calibration (`20×102mm Sniper Rifle` + `Short Plasma Edge Sword`), survive early salvage contracts, and build Ziya's recon Tank (*Ghostline*).
  2. *Act II (LL3–LL6):* Commission custom weapons at Iron Kennel (*Twin Bomba*, *Arcchain Segmented Sword*, *Raijin*, *Zeus-Mk.X*, *Sāyaka-Mk.V*), refit *Shroud* onto an **SSC Monarch** artillery frame with Twin Core power conversion, and dominate Aegis Perch auctions.
  3. *Act III (LL7+):* Acquire and crew a flagship vessel (*Augusta Del Sol*), coordinate multi-Tank teams across the Seven Swarms, assault **Autonomous Factories**, and mount expeditions into **Contaminated Zones** and the **Dead Ocean**.

---

## 7. Technical Architecture & Starter JSON Data Schema

All game content is decoupled from engine logic into modular JSON tables located in `/data/`:
1. `data/game_constants.json`: Global rules, Dive clock parameters, CU conversions, Core tiers, and economic baselines.
2. `data/player_pilot_and_tank.json`: Starter (LL0) and mid-game (LL6) character/mech definitions for Travis "Rivet" Park and *Shroud*.
3. `data/weapons_and_systems.json`: Complete weapon stats, custom properties (*Charge*, *Cognitive Corrosion*, *Variable Segmentation*), and EW systems.
4. `data/monsters_starter_roster.json`: 12 benchmark enemies spanning all 5 Functional Categories and Threat Tiers I–V.
5. `data/world_factions_and_swarms.json`: The 7 Major Colonies & Swarms with geography, operating models, and sub-Flock rosters.
6. `data/salvage_and_economy.json`: Market pricing, 3-axis degradation multipliers, Cradlehook recovery rates, and auction mechanics.

---

## 8. UI/UX & Audio Direction
* **Diegetic Cockpit HUD:** Styled after an armored deep-sea diving helmet cage. Displays a prominent analog/digital **4-Hour Dive Countdown** in the upper center, tri-spectrum sensor toggles (`OPT` / `THM` / `EM`) on the left bezel, Heat/EP gauges on the right, and a live **CU Cargo Load Bar (`0/48 CU`)** at the bottom.
* **Visual Aesthetic:** Industrial brutalism meets high-altitude sunlit skyscapes. Above the clouds: warm golden light, billowing aerostatic envelopes, colored safety-coded pipes (blue/amber/red), and bustling docking bridges. Below the clouds: desaturated ash-grey concrete ruins, rusted war machines, and unsettling biomechanical tendons pulsing with faint Core light.
* **Audio Design:** Heavy hydraulic footsteps, rhythmic automatic-climber cable clicks during descent, muffled radio static when underground, and a rising low-frequency sonar pulse as the `04:00:00` Dive window nears zero.
