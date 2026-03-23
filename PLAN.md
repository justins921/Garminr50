# Training Modes Implementation Plan

## Overview
Add a `/training` page with three drill modes. Since the R50 bridge doesn't provide real-time data, all modes use **manual entry** — the app shows a target, the user hits on the R50, reads carry/offline from the R50 screen, and enters it. Entry UX must be fast (number pad style).

## Architecture

### New DB Models (prisma/schema.prisma)
```
DrillSession — id, userId, drillType (ladder|target|wedge_game), config (JSON),
               startedAt, endedAt, totalShots, totalScore, status (active|completed|abandoned)
DrillShot   — id, drillSessionId, shotNumber, targetDistance, actualCarry, actualOffline,
               clubUsed, score, strokesGained, timestamp
```

### New Files
- `src/app/training/page.tsx` — drill selection hub (3 cards)
- `src/app/training/ladder/page.tsx` — ladder drill
- `src/app/training/target/page.tsx` — target practice
- `src/app/training/wedge-game/page.tsx` — strokes-gained wedge game
- `src/components/training/shot-entry.tsx` — quick number-pad entry component
- `src/components/training/target-display.tsx` — big target distance display with ring visualization
- `src/components/training/drill-summary.tsx` — end-of-drill results card
- `src/components/training/score-display.tsx` — live score/progress display
- `src/lib/strokes-gained.ts` — SG approach lookup table
- `src/app/api/training/route.ts` — CRUD for drill sessions + shots

### Shared Components

**ShotEntry** — the key UX component:
- Large number display showing current input
- Number pad (0-9, backspace, decimal)
- "Carry" field (required) + "Offline" field (optional, +/- for left/right)
- Big "Submit" button
- Keyboard support for desktop

**TargetDisplay**:
- Big circle target visualization (concentric rings)
- Target distance in large text
- Ring sizes scale with distance (like GSPro)
- Shows where the shot landed after entry

**ScoreDisplay**:
- Current score / running average
- Shot count / remaining
- Progress bar or ladder visualization

## Drill Mode Details

### 1. Ladder Drill (`/training/ladder`)

**Setup screen:**
- Presets: Short Game (25-80, +10yd), Full Bag (25-250, +10yd), Mid-Range (75-175, +10yd)
- Custom: start distance, end distance, step size (5/10/15/25 yd)
- Direction: Ascending, Up-and-Back, Random
- Success criteria: hits required per rung (1/2, 2/3, 3/5)
- Miss penalty: restart rung vs. drop back one rung
- Measurement: carry vs total
- Green size: Easy (15yd radius), Medium (10yd), Hard (5yd), Pro (3yd) — scales with distance

**During drill:**
- Shows current rung target distance with ring target
- Shows progress (which rung, how many hits needed)
- User enters carry distance after each shot
- Hit = within green radius of target; Miss = outside
- Advance/fail logic based on settings
- Running stats: current streak, completion %, total shots

**End screen:**
- Highest rung reached
- Total shots taken
- Success rate per rung
- Miss tendency (long vs short)

### 2. Target Practice (`/training/target`)

**Setup screen:**
- Mode: Fixed target (user picks distance) or Random (min/max range)
- Number of shots: 10, 20, 50, unlimited
- Scoring: Ring-based (GSPro style — 1000/900/800/700... based on proximity)
- Optional: include offline scoring (2D proximity vs 1D carry-only)

**During drill:**
- Shows target with concentric rings
- Ring widths scale with distance:
  - Bullseye (1000): within 1% of target distance
  - 900: within 3%
  - 800: within 5%
  - 700: within 8%
  - 600: within 12%
  - 500: within 18%
  - 400+: beyond 18%
- If offline scoring enabled, uses 2D distance (sqrt(carry_error² + offline²))
- Running score, average score per shot, best shot

**End screen:**
- Total score
- Average score per shot
- Shot distribution across rings (histogram)
- Best/worst shots
- Miss tendency

### 3. Wedge Game — TheStack Style (`/training/wedge-game`)

**Setup screen:**
- Distance range: default 40-140 yards (adjustable)
- Number of rounds: 10, 20, 30
- Club selection: pick which wedges/short irons are in play

**During drill:**
- App generates a random target distance within range
- App suggests optimal club based on user's bag data (from ClubStats)
- User can override club selection
- User hits and enters carry distance + offline
- Scoring: **Stack Points = (SG_approach + 2) × 100**
  - 200 = PGA Tour average for that distance
  - Higher = better than tour avg
  - SG lookup: based on proximity to hole (distance remaining after shot)
  - Proximity = sqrt((target - carry)² + offline²) converted to feet

**Strokes Gained Approach Lookup Table** (from PGA Tour data):
- Maps "distance to hole in yards" → "expected strokes from there"
- SG = expected_strokes_from(target_distance) - expected_strokes_from(proximity) - 1
- Example: 100yd target, ball lands 15ft from pin
  - Expected from 100yd ≈ 2.87, Expected from 15ft ≈ 1.78
  - SG = 2.87 - 1.78 - 1 = +0.09 → 209 Stack Points

**End screen:**
- Average Stack Points
- Breakdown by distance bucket (40-70, 70-100, 100-140)
- Best/worst shots
- Comparison to PGA Tour average (200 line)
- Trend if they've played before

## Strokes Gained Lookup Data (`src/lib/strokes-gained.ts`)

Expected strokes from approach distances (from PGA Tour averages):
```
200yd → 3.18, 175yd → 3.08, 150yd → 2.98, 125yd → 2.86
100yd → 2.78, 75yd → 2.60, 50yd → 2.45, 25yd → 2.18
```
Expected putts from proximity (feet from hole):
```
1ft → 1.00, 3ft → 1.04, 5ft → 1.15, 10ft → 1.45
15ft → 1.59, 20ft → 1.70, 30ft → 1.82, 40ft → 1.89
60ft → 1.98, 90ft → 2.04
```

## Navigation
- Add "Training" to sidebar navigation
- Icon: Target (from lucide-react)

## Implementation Order
1. DB schema + migration
2. Strokes gained lookup table
3. ShotEntry component (shared across all modes)
4. TargetDisplay component
5. API route for drill sessions
6. Training hub page
7. Ladder drill
8. Target practice
9. Wedge game
10. Drill summary component
11. Add to sidebar nav
