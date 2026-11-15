# KEMET-42 — Space Apps Challenge 2026 Submission

## 1. Project Title
**KEMET-42: Interactive 3D Lunar & Martian Outpost Simulator for Kids**

---

## 2. High-Level Summary
KEMET-42 is an immersive, scientifically grounded 3D space survival simulator engineered specifically for children aged 7–12. Built for the NASA Space Apps Challenge 2026, it puts young players in the boots of an astronaut commander tasked with sustaining a 30-Sol human base on Mars (Jezero Crater, Gale Crater) or the Moon (Artemis III South Pole candidate regions). Driven by live telemetry, real NASA physics (lunar and martian surface gravity), real-time space weather (NASA DONKI solar flare and CME feeds), and interactive life-support systems (ECLSS, MOXIE O₂ extraction, Veggie hydroponics), KEMET-42 turns authentic planetary science into guided, kid-friendly problem solving assisted by NOVA, a pedagogical vocal companion robot.

---

## 3. Link to Final Project
- **Organization GitHub Repository:** [https://github.com/v-stem-team/Kemet-42](https://github.com/v-stem-team/Kemet-42)
- **Personal Mirror Repository:** [https://github.com/Smartwarrior/KEMET-42](https://github.com/Smartwarrior/KEMET-42)

---

## 4. Link to Video Demonstration
*(Insert 30-second video demo link here — YouTube / Vimeo)*

---

## 5. Detailed Project Description

### The Challenge
Space exploration fascinates children, yet most educational tools remain static diagrams or abstract quizzes. Communicating the harsh realities of off-world survival—cosmic radiation, extreme temperature deltas, communication latency, microgravity locomotion, and circular life support—requires an intuitive, visually captivating experience that respects authentic science without overwhelming young minds.

### What We Built
KEMET-42 bridges pedagogical game design and rigorous aerospace data:
1. **Interactive 3D Base Simulation:** Built with React Three Fiber / Three.js, rendering realistic lunar/martian terrains, geodesic habitats, solar arrays, pressurized rovers, and MOXIE extraction units.
2. **Realistic Gravitational Locomotion:** Simulates 1/6th Earth gravity on the Moon (1.62 m/s²) and 0.38g on Mars (3.71 m/s²), dynamically adapting the astronaut's walking bounce and suspension physics.
3. **Daily Guided Mission Beacon System:** Every Sol features a targeted educational objective (ice core drilling, dust removal on solar arrays, shelter sealing, radiation shielding) marked by a 3D pulsing light beacon and real-time HUD telemetry distance indicator.
4. **NOVA Pediatric AI Voice Companion:** An empathetic in-game assistant utilizing natural browser speech synthesis to read alerts, deliver tiered hints (3 levels of cognitive scaffolding), and teach NASA facts adapted to 7–12-year-olds.
5. **Space Weather Defense (NASA DONKI Live Integration):** Real-time solar flare (CME) monitoring. When space radiation spikes, young commanders must sound the alarm, divert auxiliary power to electro-magnetic shields, or order EVA crews into reinforced regolith shelters.
6. **Closed-Loop Agriculture (NASA Veggie & Canadian Space Agency):** Interactive greenhouse module simulating Outredgeous Red Romaine lettuce, Cherry Belle radishes, and Zinnia flowers under photoperiod and temperature constraints inspired by CSA and NASA space food production toolkits.
7. **Clean Aerospace UI:** Fully custom SVG vector icon suite eliminating amateur emojis in favor of a sleek, Mission Control-inspired telemetry HUD.

---

## 6. Space Agency Data & Scientific Sources Used

All gameplay mechanics derive directly from verified NASA and partner agency data:
- **NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information):** Live solar flare classification and Coronal Mass Ejection (CME) tracking via `/api/donki`.
- **NASA JPL Horizons API:** Real-time interplanetary distance calculations (AU, km) and one-way light-time communication latency between Earth, Moon, and Mars.
- **NASA NSSDC Fact Sheets:** Surface gravity (Moon 1.62 m/s², Mars 3.71 m/s²), atmospheric pressure (Mars 6.36 mb vs. Lunar hard vacuum), and day lengths (24.66h Martian Sol).
- **NASA Artemis III Candidate Regions:** Shackleton crater rim, Faustini Rim A, and Malapert Massif terrain data and illumination geometry.
- **NASA Mars 2020 & Curiosity Missions:** Jezero Crater and Gale Crater (Mount Sharp) geomorphology, Perseverance MOXIE oxygen generation specs.
- **NASA Veggie & Advanced Plant Habitat (APH):** Growth cycles, LED spectrum requirements, and cabin pressurization constraints.
- **Canadian Space Agency (CSA):** Youth educational toolkits on food production in extreme and isolated environments.

---

## 7. Use of AI Tools
Antigravity AI (Gemini / Claude agentic workflows) was utilized as an engineering copilot for architectural refactoring, unit test generation (37 test suites), telemetry balance algorithms, and code styling audits. All scientific equations, mission parameters, and educational texts were strictly grounded in published NASA documentation.
