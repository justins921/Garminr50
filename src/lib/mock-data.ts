// Mock data for demo mode (when DATABASE_URL is not available, e.g., Vercel deployment)
// Enable by setting DEMO_MODE=true in environment variables

export const DEMO_MODE = process.env.DEMO_MODE === "true";

// ── Clubs ──────────────────────────────────────────────────────────────────

export const MOCK_CLUBS = [
  { id: "c1", name: "Driver", type: "driver", loft: 10.5, brand: "TaylorMade", model: "Qi10 Max", shaft: "Fujikura Ventus Blue 6S", sortOrder: 1, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 42 } },
  { id: "c2", name: "3 Wood", type: "wood", loft: 15, brand: "TaylorMade", model: "Qi10", shaft: null, sortOrder: 2, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 18 } },
  { id: "c3", name: "5 Wood", type: "wood", loft: 18, brand: "Callaway", model: "Paradym", shaft: null, sortOrder: 3, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 14 } },
  { id: "c4", name: "4 Hybrid", type: "hybrid", loft: 22, brand: "Titleist", model: "TSR2", shaft: null, sortOrder: 4, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 12 } },
  { id: "c5", name: "5 Iron", type: "iron", loft: 25, brand: "Titleist", model: "T200", shaft: null, sortOrder: 5, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 15 } },
  { id: "c6", name: "6 Iron", type: "iron", loft: 28, brand: "Titleist", model: "T200", shaft: null, sortOrder: 6, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 16 } },
  { id: "c7", name: "7 Iron", type: "iron", loft: 31, brand: "Titleist", model: "T200", shaft: null, sortOrder: 7, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 22 } },
  { id: "c8", name: "8 Iron", type: "iron", loft: 35, brand: "Titleist", model: "T200", shaft: null, sortOrder: 8, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 18 } },
  { id: "c9", name: "9 Iron", type: "iron", loft: 39, brand: "Titleist", model: "T200", shaft: null, sortOrder: 9, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 14 } },
  { id: "c10", name: "Pitching Wedge", type: "wedge", loft: 44, brand: "Vokey", model: "SM10", shaft: null, sortOrder: 10, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 20 } },
  { id: "c11", name: "Gap Wedge", type: "wedge", loft: 50, brand: "Vokey", model: "SM10", shaft: null, sortOrder: 11, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 16 } },
  { id: "c12", name: "Sand Wedge", type: "wedge", loft: 54, brand: "Vokey", model: "SM10", shaft: null, sortOrder: 12, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 14 } },
  { id: "c13", name: "Lob Wedge", type: "wedge", loft: 58, brand: "Vokey", model: "SM10", shaft: null, sortOrder: 13, isActive: true, createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", _count: { shots: 10 } },
];

// ── Sessions ───────────────────────────────────────────────────────────────

export const MOCK_SESSIONS = [
  { id: "s1", name: "Range Session - Full Bag", startedAt: "2026-03-05T14:00:00Z", endedAt: "2026-03-05T15:30:00Z", environment: "outdoor", sessionType: "practice", source: "r50-bridge", isLive: false, location: "TopGolf Dallas", notes: "Working on driver and irons", _count: { shots: 65 }, tags: [] },
  { id: "s2", name: "Wedge Practice", startedAt: "2026-03-03T10:00:00Z", endedAt: "2026-03-03T11:00:00Z", environment: "outdoor", sessionType: "practice", source: "r50-bridge", isLive: false, location: "Oak Hills CC", notes: "Dialing in wedge distances", _count: { shots: 48 }, tags: [] },
  { id: "s3", name: "Iron Work", startedAt: "2026-02-28T16:00:00Z", endedAt: "2026-02-28T17:15:00Z", environment: "indoor", sessionType: "practice", source: "csv-import", isLive: false, location: "Home Sim Bay", notes: null, _count: { shots: 55 }, tags: [] },
  { id: "s4", name: "Pre-Round Warmup", startedAt: "2026-02-25T07:30:00Z", endedAt: "2026-02-25T08:00:00Z", environment: "outdoor", sessionType: "warmup", source: "r50-bridge", isLive: false, location: "Pebble Beach", notes: "Quick warmup before round", _count: { shots: 22 }, tags: [] },
];

// ── Shots (representative sample for charts/analytics) ─────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface MockShot {
  id: string;
  sessionId: string;
  clubId: string;
  shotNumber: number;
  timestamp: string;
  ballSpeed: number;
  clubSpeed: number;
  launchAngle: number;
  launchDirection: number;
  spinRate: number;
  backSpin: number;
  sideSpin: number;
  spinAxis: number;
  carryDistance: number;
  totalDistance: number;
  offlineDistance: number;
  apexHeight: number;
  smashFactor: number;
  angleOfAttack: number;
  clubPath: number;
  faceAngle: number;
  faceToPath: number;
  dynamicLoft: number | null;
  shotShape: string;
  shotResult: string;
  validity: string;
  source: string;
  club: { id: string; name: string; type: string; loft: number | null };
  session?: { id: string; name: string };
}

const CLUB_PROFILES: Record<string, { carry: [number, number]; ball: [number, number]; club: [number, number]; launch: [number, number]; spin: [number, number]; offline: [number, number]; attack: [number, number] }> = {
  c1:  { carry: [235, 270], ball: [150, 165], club: [100, 112], launch: [10, 13.5], spin: [2200, 2900], offline: [-18, 22], attack: [1, 4] },
  c2:  { carry: [210, 240], ball: [138, 152], club: [93, 105], launch: [11, 15], spin: [3200, 4200], offline: [-15, 18], attack: [-1, 2] },
  c3:  { carry: [195, 220], ball: [130, 145], club: [88, 100], launch: [13, 16.5], spin: [3800, 4800], offline: [-12, 15], attack: [-2, 1] },
  c4:  { carry: [180, 205], ball: [122, 140], club: [84, 96], launch: [14, 18], spin: [4200, 5200], offline: [-10, 12], attack: [-3, 0] },
  c5:  { carry: [168, 190], ball: [118, 135], club: [82, 94], launch: [15, 19], spin: [4800, 5800], offline: [-10, 11], attack: [-4, -1] },
  c6:  { carry: [158, 178], ball: [112, 130], club: [80, 92], launch: [16, 20], spin: [5200, 6300], offline: [-9, 10], attack: [-4.5, -1.5] },
  c7:  { carry: [148, 168], ball: [108, 125], club: [77, 89], launch: [17, 22], spin: [5800, 7000], offline: [-8, 9], attack: [-5, -2] },
  c8:  { carry: [136, 155], ball: [102, 120], club: [74, 86], launch: [19, 24], spin: [6500, 7800], offline: [-7, 8], attack: [-5.5, -2.5] },
  c9:  { carry: [125, 143], ball: [96, 114], club: [71, 83], launch: [21, 27], spin: [7200, 8800], offline: [-7, 7], attack: [-6, -3] },
  c10: { carry: [115, 132], ball: [90, 106], club: [68, 80], launch: [24, 30], spin: [8000, 9500], offline: [-6, 6], attack: [-5.5, -2.5] },
  c11: { carry: [100, 118], ball: [82, 98], club: [65, 77], launch: [26, 32], spin: [8500, 10200], offline: [-5, 5], attack: [-5, -2] },
  c12: { carry: [85, 102], ball: [74, 90], club: [62, 74], launch: [28, 35], spin: [9000, 10800], offline: [-5, 5], attack: [-5, -2] },
  c13: { carry: [65, 85], ball: [64, 80], club: [58, 70], launch: [31, 38], spin: [9500, 11500], offline: [-5, 5], attack: [-4, -1] },
};

function generateMockShots(): MockShot[] {
  const rng = seededRandom(42);
  const r = (min: number, max: number) => Math.round((rng() * (max - min) + min) * 10) / 10;
  const shots: MockShot[] = [];
  let shotId = 1;

  const sessionsForClub: Record<string, string[]> = {
    c1: ["s1", "s3", "s4"], c2: ["s1", "s4"], c3: ["s1"],
    c4: ["s1", "s3"], c5: ["s1", "s3"], c6: ["s1", "s3"],
    c7: ["s1", "s3", "s4"], c8: ["s1", "s3"], c9: ["s3"],
    c10: ["s2", "s3"], c11: ["s2"], c12: ["s2"], c13: ["s2"],
  };

  for (const club of MOCK_CLUBS) {
    const prof = CLUB_PROFILES[club.id];
    if (!prof) continue;
    const sessions = sessionsForClub[club.id] ?? ["s1"];
    const count = club._count.shots;

    for (let i = 0; i < count; i++) {
      const sessionId = sessions[Math.floor(rng() * sessions.length)];
      const carry = r(prof.carry[0], prof.carry[1]);
      const ballSpeed = r(prof.ball[0], prof.ball[1]);
      const clubSpeed = r(prof.club[0], prof.club[1]);
      const launch = r(prof.launch[0], prof.launch[1]);
      const spin = Math.round(r(prof.spin[0], prof.spin[1]));
      const offline = r(prof.offline[0], prof.offline[1]);
      const attack = r(prof.attack[0], prof.attack[1]);
      const smash = Math.round((ballSpeed / clubSpeed) * 100) / 100;
      const total = Math.round((carry + r(5, 20)) * 10) / 10;
      const sideSpin = Math.round(offline * r(15, 35));
      const faceAngle = r(-3, 3);
      const clubPath = r(-4, 4);

      const isGood = rng() > 0.15;

      shots.push({
        id: `shot-${shotId++}`,
        sessionId,
        clubId: club.id,
        shotNumber: i + 1,
        timestamp: new Date(Date.now() - (count - i) * 60000 * rng() * 5).toISOString(),
        ballSpeed, clubSpeed, launchAngle: launch, launchDirection: r(-3, 3),
        spinRate: spin, backSpin: spin - Math.abs(sideSpin), sideSpin, spinAxis: r(-8, 8),
        carryDistance: carry, totalDistance: total, offlineDistance: offline,
        apexHeight: r(20, 40), smashFactor: smash, angleOfAttack: attack,
        clubPath, faceAngle, faceToPath: Math.round((faceAngle - clubPath) * 10) / 10,
        dynamicLoft: null,
        shotShape: offline > 5 ? "fade" : offline < -5 ? "draw" : "straight",
        shotResult: isGood ? "good" : rng() > 0.5 ? "thin" : "fat",
        validity: "valid",
        source: "demo",
        club: { id: club.id, name: club.name, type: club.type, loft: club.loft },
        session: MOCK_SESSIONS.find(s => s.id === sessionId) ? { id: sessionId, name: MOCK_SESSIONS.find(s => s.id === sessionId)!.name } : undefined,
      });
    }
  }

  return shots;
}

export const MOCK_SHOTS = generateMockShots();

// ── Club Stats ─────────────────────────────────────────────────────────────

function computeMockClubStats() {
  const clubGroups = new Map<string, MockShot[]>();
  for (const shot of MOCK_SHOTS) {
    const group = clubGroups.get(shot.clubId) ?? [];
    group.push(shot);
    clubGroups.set(shot.clubId, group);
  }

  return MOCK_CLUBS.filter(c => (clubGroups.get(c.id)?.length ?? 0) > 0).map(club => {
    const shots = clubGroups.get(club.id)!;
    const carries = shots.map(s => s.carryDistance);
    const totals = shots.map(s => s.totalDistance);
    const balls = shots.map(s => s.ballSpeed);
    const clubs = shots.map(s => s.clubSpeed);
    const launches = shots.map(s => s.launchAngle);
    const spins = shots.map(s => s.spinRate);
    const smashes = shots.map(s => s.smashFactor);
    const offlines = shots.map(s => s.offlineDistance);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr: number[]) => {
      const m = avg(arr);
      return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
    };
    const sorted = [...carries].sort((a, b) => b - a);

    const avgOff = avg(offlines);

    return {
      clubId: club.id,
      clubName: club.name,
      clubType: club.type,
      shotCount: shots.length,
      avgCarry: Math.round(avg(carries)),
      avgTotal: Math.round(avg(totals)),
      medianCarry: Math.round(sorted[Math.floor(sorted.length / 2)]),
      medianTotal: Math.round(avg(totals)),
      stdDevCarry: Math.round(std(carries) * 10) / 10,
      stdDevTotal: Math.round(std(totals) * 10) / 10,
      avgBallSpeed: Math.round(avg(balls) * 10) / 10,
      avgClubSpeed: Math.round(avg(clubs) * 10) / 10,
      avgLaunchAngle: Math.round(avg(launches) * 10) / 10,
      avgSpinRate: Math.round(avg(spins)),
      avgSmashFactor: Math.round(avg(smashes) * 100) / 100,
      avgOffline: Math.round(avgOff * 10) / 10,
      dispersionWidth: Math.round((Math.max(...offlines) - Math.min(...offlines)) * 10) / 10,
      dispersionDepth: Math.round((Math.max(...carries) - Math.min(...carries)) * 10) / 10,
      consistencyScore: Math.round(Math.max(0, 100 - (std(carries) / avg(carries)) * 500)),
      bestCarry: Math.round(Math.max(...carries)),
      best5Carry: Math.round(avg(sorted.slice(0, Math.min(5, sorted.length)))),
      best10Carry: Math.round(avg(sorted.slice(0, Math.min(10, sorted.length)))),
      missTendency: avgOff > 3 ? "right" as const : avgOff < -3 ? "left" as const : "straight" as const,
    };
  });
}

export const MOCK_CLUB_STATS = computeMockClubStats();

// ── Analytics Overview ─────────────────────────────────────────────────────

export const MOCK_OVERVIEW = {
  totalShots: MOCK_SHOTS.length,
  totalSessions: MOCK_SESSIONS.length,
  recentSessions: MOCK_SESSIONS.map(s => ({
    id: s.id,
    name: s.name,
    startedAt: s.startedAt,
    environment: s.environment,
    sessionType: s.sessionType,
    _count: s._count,
  })),
};

// ── Gapping Data ───────────────────────────────────────────────────────────

export function getMockGapping() {
  const sorted = [...MOCK_CLUB_STATS].sort((a, b) => b.avgCarry - a.avgCarry);
  return {
    clubs: sorted.map((c, i) => ({
      clubName: c.clubName,
      avgCarry: c.avgCarry,
      avgTotal: c.avgTotal,
      minCarry: c.avgCarry - Math.round(c.stdDevCarry * 1.5),
      maxCarry: c.avgCarry + Math.round(c.stdDevCarry * 1.5),
      gapToNext: i < sorted.length - 1 ? c.avgCarry - sorted[i + 1].avgCarry : undefined,
      overlapWithNext: i < sorted.length - 1
        ? Math.max(0, (c.avgCarry - c.stdDevCarry * 1.5) - (sorted[i + 1].avgCarry + sorted[i + 1].stdDevCarry * 1.5) < 0
            ? Math.round(Math.abs((c.avgCarry - c.stdDevCarry * 1.5) - (sorted[i + 1].avgCarry + sorted[i + 1].stdDevCarry * 1.5)))
            : 0)
        : undefined,
    })),
  };
}

// ── Optimizer ──────────────────────────────────────────────────────────────

export const MOCK_OPTIMIZER_RESULT = {
  overallScore: 72,
  overallGrade: "B+",
  metrics: [
    { name: "Smash Factor", value: 1.46, unit: "", optimalRange: [1.44, 1.52], score: "green", suggestion: "Smash factor is in the optimal range." },
    { name: "Launch Angle", value: 11.8, unit: "°", optimalRange: [10, 14], score: "green", suggestion: "Launch angle is in the optimal range." },
    { name: "Spin Rate", value: 2650, unit: "rpm", optimalRange: [2000, 2800], score: "green", suggestion: "Spin rate is in the optimal range." },
    { name: "Angle of Attack", value: 2.3, unit: "°", optimalRange: [0, 5], score: "green", suggestion: "Angle of attack is in the optimal range." },
    { name: "Distance Consistency", value: 88, unit: "%", optimalRange: [92, 100], score: "yellow", suggestion: "Your distance spread is too wide. Focus on consistent contact." },
    { name: "Directional Accuracy", value: 11.2, unit: "yds offline", optimalRange: [0, 8], score: "red", suggestion: "You tend to miss right by 11 yards. Work on face angle at impact." },
  ],
  strengths: ["Smash Factor", "Launch Angle", "Spin Rate", "Angle of Attack"],
  weaknesses: ["You tend to miss right by 11 yards. Work on face angle at impact."],
  drills: [
    { name: "Headcover Gate Drill", category: "accuracy", description: "Place a headcover just outside the ball. Practice swinging without hitting it to train an inside-out path.", targetIssue: "Outside-in swing path causing right miss", priority: "high" },
    { name: "Step Drill", category: "accuracy", description: "Take your setup, then step your lead foot toward the target as you start your downswing. This promotes an inside-out path.", targetIssue: "Over-the-top move", priority: "high" },
    { name: "Progressive Power Drill", category: "consistency", description: "Hit 3 shots at 50% power, 3 at 75%, and 3 at 100%. Compare carry distances. Your best results often come at 85-90% effort.", targetIssue: "Finding optimal swing tempo", priority: "low" },
  ],
  insights: [
    "Your best 5 shots average 268 yards vs your overall 252 yards — a 16-yard gap. Consistency work will close this gap.",
    "52% of your shots miss right. This is your primary miss pattern.",
  ],
};

// ── Bag Mapping ────────────────────────────────────────────────────────────

export const MOCK_BAG_MAPPING = {
  id: "bm1",
  name: "My Bag",
  isActive: true,
  minShots: 5,
  createdAt: "2026-03-01T00:00:00Z",
  updatedAt: "2026-03-05T00:00:00Z",
  clubs: MOCK_CLUBS.slice(0, 10).map((club, i) => {
    const stats = MOCK_CLUB_STATS.find(s => s.clubId === club.id);
    const isCompleted = i < 8;
    return {
      id: `bmc-${i + 1}`,
      bagMappingId: "bm1",
      clubId: club.id,
      status: isCompleted ? "completed" : "pending",
      avgCarry: isCompleted ? stats?.avgCarry ?? null : null,
      avgTotal: isCompleted ? stats?.avgTotal ?? null : null,
      minCarry: isCompleted && stats ? stats.avgCarry - Math.round(stats.stdDevCarry * 1.2) : null,
      maxCarry: isCompleted && stats ? stats.avgCarry + Math.round(stats.stdDevCarry * 1.2) : null,
      avgOffline: isCompleted ? stats?.avgOffline ?? null : null,
      dispersionRadius: isCompleted && stats ? Math.round(stats.dispersionWidth / 2 * 10) / 10 : null,
      dispersionAngle: isCompleted && stats ? Math.round(Math.atan2(stats.dispersionWidth / 2, stats.avgCarry) * 180 / Math.PI * 2 * 10) / 10 : null,
      shotCount: isCompleted ? stats?.shotCount ?? 0 : i === 8 ? 3 : 0,
      sessionId: null,
      createdAt: "2026-03-01T00:00:00Z",
      updatedAt: "2026-03-05T00:00:00Z",
      club: { id: club.id, name: club.name, type: club.type, loft: club.loft },
    };
  }),
};

// ── Wedge Matrix ───────────────────────────────────────────────────────────

const WEDGE_SWING_KEYS = [
  { key: "7:30", label: "7:30 Position" },
  { key: "9:00", label: "9:00 Position" },
  { key: "10:30", label: "10:30 Position" },
  { key: "full", label: "Full Swing" },
];

const WEDGE_CLUBS_FOR_MATRIX = MOCK_CLUBS.filter(c => c.type === "wedge");

function generateWedgeEntries() {
  const entries = [];
  let id = 1;
  const distanceFactors: Record<string, number> = { "7:30": 0.45, "9:00": 0.65, "10:30": 0.82, "full": 1.0 };
  const baseCarries: Record<string, number> = { c10: 125, c11: 108, c12: 92, c13: 72 };

  for (const club of WEDGE_CLUBS_FOR_MATRIX) {
    for (const sk of WEDGE_SWING_KEYS) {
      const base = baseCarries[club.id] ?? 100;
      const factor = distanceFactors[sk.key] ?? 1;
      const carry = Math.round(base * factor);
      const isCompleted = !(club.id === "c13" && (sk.key === "7:30" || sk.key === "9:00"));

      entries.push({
        id: `wme-${id++}`,
        wedgeMatrixId: "wm1",
        clubId: club.id,
        swingKey: sk.key,
        swingLabel: sk.label,
        targetDistance: null,
        avgCarry: isCompleted ? carry : null,
        avgTotal: isCompleted ? carry + 8 : null,
        avgSpinRate: isCompleted ? Math.round(8500 + (58 - (club.loft ?? 50)) * -80 + (1 - factor) * 1200) : null,
        avgLaunchAngle: isCompleted ? Math.round((28 + (club.loft! - 44) * 0.8 - factor * 3) * 10) / 10 : null,
        minCarry: isCompleted ? carry - 4 : null,
        maxCarry: isCompleted ? carry + 5 : null,
        shotCount: isCompleted ? 8 : club.id === "c13" && sk.key === "9:00" ? 2 : 0,
        status: isCompleted ? "completed" : club.id === "c13" && sk.key === "9:00" ? "in_progress" : "pending",
        sessionId: null,
        createdAt: "2026-03-02T00:00:00Z",
        updatedAt: "2026-03-05T00:00:00Z",
        club: { name: club.name, loft: club.loft },
      });
    }
  }

  return entries;
}

export const MOCK_WEDGE_MATRIX = {
  id: "wm1",
  name: "My Wedge Matrix",
  system: "clock",
  isActive: true,
  createdAt: "2026-03-02T00:00:00Z",
  updatedAt: "2026-03-05T00:00:00Z",
  swingKeys: WEDGE_SWING_KEYS,
  entries: generateWedgeEntries(),
};

// ── Session Detail ─────────────────────────────────────────────────────────

export function getMockSessionDetail(id: string) {
  const session = MOCK_SESSIONS.find(s => s.id === id);
  if (!session) return null;

  const shots = MOCK_SHOTS.filter(s => s.sessionId === id).map((s, i) => ({
    ...s,
    shotNumber: i + 1,
  }));

  return { ...session, shots, tags: [] };
}
