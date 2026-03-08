// Demo mode data using real Garmin R50 shot data from Justin's sessions.
// Enable by setting DEMO_MODE=true in environment variables (e.g., Vercel deployment without a DB).

export const DEMO_MODE = process.env.DEMO_MODE === "true";

// ── Clubs ──────────────────────────────────────────────────────────────────

export const MOCK_CLUBS = [
  { id: "c1", name: "Driver", type: "driver", loft: 10.5, brand: "Titleist", model: "GT2", shaft: null, sortOrder: 1, isActive: true, createdAt: "2026-02-25T00:00:00Z", updatedAt: "2026-02-25T00:00:00Z", _count: { shots: 21 } },
  { id: "c3", name: "5 Wood", type: "wood", loft: 18, brand: "Titleist", model: "GT2", shaft: null, sortOrder: 5, isActive: true, createdAt: "2026-02-26T00:00:00Z", updatedAt: "2026-02-26T00:00:00Z", _count: { shots: 24 } },
];

// ── Sessions ───────────────────────────────────────────────────────────────

export const MOCK_SESSIONS = [
  { id: "s1", name: "Driver Session", startedAt: "2026-02-25T19:30:00Z", endedAt: "2026-02-25T19:42:00Z", environment: "indoor", sessionType: "practice", source: "csv-import", isLive: false, location: null, notes: null, _count: { shots: 21 }, tags: [] },
  { id: "s2", name: "5 Wood Session", startedAt: "2026-02-26T12:47:00Z", endedAt: "2026-02-26T12:55:00Z", environment: "indoor", sessionType: "practice", source: "csv-import", isLive: false, location: null, notes: null, _count: { shots: 24 }, tags: [] },
];

// ── Real Shot Data ─────────────────────────────────────────────────────────

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

// Helper to build a shot from CSV row values
function s(
  id: number, sessionId: string, clubId: string, clubName: string, clubType: string, loft: number | null, shotNum: number, ts: string,
  clubSpd: number, aoa: number, path: number, face: number, ftp: number,
  ballSpd: number, smash: number, la: number, ld: number,
  bs: number, ss: number, sr: number, sa: number,
  apex: number, carry: number, offline: number, total: number, totalOff: number,
): MockShot {
  return {
    id: `shot-${id}`, sessionId, clubId, shotNumber: shotNum, timestamp: ts,
    ballSpeed: Math.round(ballSpd * 10) / 10, clubSpeed: Math.round(clubSpd * 10) / 10,
    launchAngle: Math.round(la * 10) / 10, launchDirection: Math.round(ld * 10) / 10,
    spinRate: Math.round(sr), backSpin: Math.round(bs), sideSpin: Math.round(ss), spinAxis: Math.round(sa * 10) / 10,
    carryDistance: Math.round(carry * 10) / 10, totalDistance: Math.round(total * 10) / 10,
    offlineDistance: Math.round(offline * 10) / 10,
    apexHeight: Math.round(apex * 10) / 10, smashFactor: Math.round(smash * 100) / 100,
    angleOfAttack: Math.round(aoa * 10) / 10, clubPath: Math.round(path * 10) / 10,
    faceAngle: Math.round(face * 10) / 10, faceToPath: Math.round(ftp * 10) / 10,
    dynamicLoft: null,
    shotShape: offline > 5 ? "fade" : offline < -5 ? "draw" : "straight",
    shotResult: "good", validity: "valid", source: "csv_import",
    club: { id: clubId, name: clubName, type: clubType, loft },
    session: { id: sessionId, name: sessionId === "s1" ? "Driver Session" : "5 Wood Session" },
  };
}

// Driver session — 2/25/26, 21 shots
// 5 Wood session — 2/26/26, 24 shots
export const MOCK_SHOTS: MockShot[] = [
  // ── Driver (session s1) ──
  s(1,"s1","c1","Driver","driver",10.5,1,"2026-02-25T19:30:56Z", 100.1,3.1,-1.98,1.98,3.96, 135.2,1.35,15.14,1.38, 1992,623.1,2087,-17.37, 25.1,220.8,-15.1,242.4,-18.6),
  s(2,"s1","c1","Driver","driver",10.5,2,"2026-02-25T19:31:28Z", 101.6,2.06,3.28,5.96,2.68, 137.5,1.35,14.72,5.31, 1938,97.5,1940,-2.88, 25.0,227.8,18.5,249.6,19.8),
  s(3,"s1","c1","Driver","driver",10.5,3,"2026-02-25T19:32:11Z", 99.1,3.16,-2.57,0.24,2.81, 144.5,1.46,12.68,-0.13, 2335,289.2,2353,-7.06, 26.0,239.5,-11.0,260.8,-12.9),
  s(4,"s1","c1","Driver","driver",10.5,4,"2026-02-25T19:32:46Z", 98.7,2.09,-1.91,-1.19,0.72, 139.7,1.42,13.59,-1.22, 1937,-170.9,1945,5.04, 23.2,228.6,0.8,251.5,1.5),
  s(5,"s1","c1","Driver","driver",10.5,5,"2026-02-25T19:33:19Z", 101.2,2.13,2.97,2.75,-0.22, 142.1,1.40,13.63,2.63, 2773,-399.0,2801,8.19, 30.0,234.9,25.2,253.9,28.2),
  s(6,"s1","c1","Driver","driver",10.5,6,"2026-02-25T19:33:52Z", 97.4,1.29,-4.98,-1.17,3.81, 139.8,1.44,13.44,-1.59, 2120,29.2,2121,-0.79, 24.4,230.3,-7.6,252.5,-8.4),
  s(7,"s1","c1","Driver","driver",10.5,7,"2026-02-25T19:34:26Z", 100.2,2.25,1.47,0.42,-1.05, 143.9,1.44,12.41,0.53, 2907,-709.1,2992,13.71, 28.2,233.6,25.7,252.8,29.6),
  s(8,"s1","c1","Driver","driver",10.5,8,"2026-02-25T19:34:56Z", 98.2,3.14,-1.97,-1.18,0.79, 143.7,1.46,12.42,-1.22, 2713,24.6,2714,-0.52, 27.7,237.2,-6.2,257.0,-6.7),
  s(9,"s1","c1","Driver","driver",10.5,9,"2026-02-25T19:35:31Z", 99.3,2.42,2.4,2.55,0.15, 140.9,1.42,14.81,2.4, 2699,-330.0,2719,6.97, 31.9,235.1,22.1,253.4,24.6),
  s(10,"s1","c1","Driver","driver",10.5,10,"2026-02-25T19:36:09Z", 113.4,2.27,7.01,-1.8,-8.81, 143.1,1.26,13.37,-0.6, 2322,64.5,2323,-1.59, 27.1,238.9,-5.0,260.0,-5.6),
  s(11,"s1","c1","Driver","driver",10.5,11,"2026-02-25T19:36:51Z", 99.8,1.36,-1.15,2.72,3.87, 142.4,1.43,13.86,2.09, 3047,-554.3,3097,10.31, 32.0,233.3,27.6,251.0,30.8),
  s(12,"s1","c1","Driver","driver",10.5,12,"2026-02-25T19:37:25Z", 101.5,2.77,-5.26,2.6,7.86, 136.2,1.34,16.75,1.48, 2281,-122.3,2284,3.07, 31.7,230.9,10.7,250.0,11.9),
  s(13,"s1","c1","Driver","driver",10.5,13,"2026-02-25T19:37:57Z", 100.3,2.42,-0.04,-1.04,-1.0, 143.8,1.43,12.86,-0.86, 2601,385.1,2630,-8.42, 27.9,237.7,-17.3,257.7,-19.8),
  s(14,"s1","c1","Driver","driver",10.5,14,"2026-02-25T19:38:27Z", 100.3,1.62,0.13,0.88,0.75, 141.8,1.41,13.55,0.74, 2579,-62.6,2580,1.39, 28.7,236.0,5.4,256.1,6.0),
  s(15,"s1","c1","Driver","driver",10.5,15,"2026-02-25T19:39:00Z", 100.8,3.2,-0.25,-1.14,-0.89, 145.2,1.44,12.58,-0.97, 2782,-9.7,2782,0.2, 29.2,240.8,-4.0,260.2,-4.2),
  s(16,"s1","c1","Driver","driver",10.5,16,"2026-02-25T19:39:36Z", 99.1,0.57,-2.28,-0.85,1.43, 138.2,1.39,13.67,-0.99, 1955,218.5,1967,-6.38, 22.9,225.1,-11.3,247.8,-13.2),
  s(17,"s1","c1","Driver","driver",10.5,17,"2026-02-25T19:40:08Z", 101.0,1.16,0.38,-2.64,-3.02, 144.8,1.43,11.1,-2.12, 2611,-88.4,2613,1.94, 24.2,235.6,-6.1,257.1,-6.3),
  s(18,"s1","c1","Driver","driver",10.5,18,"2026-02-25T19:40:40Z", 106.9,2.11,5.14,-0.03,-5.17, 139.3,1.30,14.13,0.62, 2272,36.9,2272,-0.93, 26.9,232.0,1.3,252.9,1.3),
  s(19,"s1","c1","Driver","driver",10.5,19,"2026-02-25T19:41:14Z", 99.5,2.43,-3.18,-5.59,-2.41, 143.4,1.44,9.48,-4.99, 3037,-248.1,3047,4.67, 22.1,226.1,-13.1,247.5,-13.5),
  s(20,"s1","c1","Driver","driver",10.5,20,"2026-02-25T19:41:46Z", 98.6,0.75,0.39,-3.16,-3.55, 145.3,1.47,9.41,-2.55, 2541,72.7,2542,-1.64, 19.8,229.4,-12.9,262.9,-15.0),
  s(21,"s1","c1","Driver","driver",10.5,21,"2026-02-25T19:42:19Z", 99.9,2.65,-1.01,1.43,2.44, 143.9,1.44,11.6,1.05, 2310,639.0,2397,-15.46, 22.6,230.9,-16.9,253.2,-20.5),

  // ── 5 Wood (session s2) ──
  s(22,"s2","c3","5 Wood","wood",18,1,"2026-02-26T12:47:18Z", 95.5,-0.4,-0.06,0.99,1.05, 128.7,1.35,12.12,0.81, 3181,-891.1,3303,15.65, 21.3,195.2,23.8,215.4,28.3),
  s(23,"s2","c3","5 Wood","wood",18,2,"2026-02-26T12:47:34Z", 93.9,-0.59,-4.54,-6.53,-1.99, 134.8,1.44,11.52,-5.94, 2462,750.8,2574,-16.96, 19.5,207.6,-42.9,236.2,-51.5),
  s(24,"s2","c3","5 Wood","wood",18,3,"2026-02-26T12:47:53Z", 92.1,0.56,1.79,1.18,-0.61, 127.6,1.39,13.24,1.19, 2446,-1305.8,2772,28.1, 19.4,189.7,34.9,211.8,42.5),
  s(25,"s2","c3","5 Wood","wood",18,4,"2026-02-26T12:48:10Z", 80.4,6.56,2.22,4.7,2.48, 113.4,1.41,15.58,4.14, 1836,296.0,1859,-9.16, 16.9,167.9,6.0,201.2,5.8),
  s(26,"s2","c3","5 Wood","wood",18,5,"2026-02-26T12:48:28Z", 91.7,-1.41,-0.61,-4.43,-3.82, 132.5,1.45,10.39,-3.71, 2909,651.7,2981,-12.63, 18.6,200.5,-29.7,226.3,-35.5),
  s(27,"s2","c3","5 Wood","wood",18,6,"2026-02-26T12:48:46Z", 90.9,-0.91,2.11,-0.2,-2.31, 126.9,1.40,13.82,0.1, 3139,-554.6,3187,10.02, 24.2,197.3,14.1,216.4,16.7),
  s(28,"s2","c3","5 Wood","wood",18,7,"2026-02-26T12:49:05Z", 92.7,-1.54,2.1,-0.84,-2.94, 132.9,1.43,10.49,-0.43, 2364,790.9,2493,-18.5, 16.2,197.2,-21.3,242.1,-30.7),
  s(29,"s2","c3","5 Wood","wood",18,8,"2026-02-26T12:49:22Z", 89.7,1.16,2.07,-1.04,-3.11, 124.2,1.39,13.59,-0.6, 1752,303.5,1778,-9.83, 16.5,185.8,-9.5,237.4,-14.2),
  s(30,"s2","c3","5 Wood","wood",18,9,"2026-02-26T12:49:44Z", 91.9,-1.21,0.08,-4.31,-4.39, 130.4,1.42,12.5,-3.53, 3147,85.1,3148,-1.55, 23.5,203.8,-15.5,223.3,-17.0),
  s(31,"s2","c3","5 Wood","wood",18,10,"2026-02-26T12:50:04Z", 91.3,-0.62,1.24,-0.53,-1.77, 128.5,1.41,13.18,-0.28, 2642,39.7,2643,-0.86, 22.0,202.1,-2.1,223.9,-2.4),
  s(32,"s2","c3","5 Wood","wood",18,11,"2026-02-26T12:50:26Z", 90.6,-0.41,-0.35,1.01,1.36, 124.2,1.37,14.47,0.78, 1835,146.0,1841,-4.55, 18.8,191.7,-1.2,229.1,-2.2),
  s(33,"s2","c3","5 Wood","wood",18,12,"2026-02-26T12:50:46Z", 91.4,-2.37,-2.36,-4.89,-2.53, 130.7,1.43,11.43,-4.32, 3153,144.3,3157,-2.62, 21.3,201.7,-19.6,222.3,-21.8),
  s(34,"s2","c3","5 Wood","wood",18,13,"2026-02-26T12:51:52Z", 84.6,5.74,0.6,5.98,5.38, 114.2,1.35,15.93,4.99, 2212,283.0,2230,-7.29, 19.3,173.4,9.3,195.8,9.6),
  s(35,"s2","c3","5 Wood","wood",18,14,"2026-02-26T12:52:09Z", 93.1,-1.99,-0.88,-4.83,-3.95, 131.6,1.41,11.57,-4.07, 4131,-381.1,4149,5.27, 25.0,199.6,-6.6,215.9,-6.4),
  s(36,"s2","c3","5 Wood","wood",18,15,"2026-02-26T12:52:27Z", 92.5,-1.48,-0.17,-2.33,-2.16, 132.0,1.43,11.9,-1.93, 3362,288.8,3375,-4.91, 23.6,205.0,-14.7,223.9,-16.6),
  s(37,"s2","c3","5 Wood","wood",18,16,"2026-02-26T12:52:49Z", 91.3,0.84,0.27,2.64,2.37, 126.9,1.39,15.29,2.2, 2486,2.2,2486,-0.05, 25.0,204.1,8.2,224.7,8.9),
  s(38,"s2","c3","5 Wood","wood",18,17,"2026-02-26T12:53:07Z", 93.1,-0.88,-1.31,-3.2,-1.89, 132.5,1.42,11.25,-2.79, 3727,179.6,3731,-2.76, 23.7,203.4,-14.8,221.4,-16.4),
  s(39,"s2","c3","5 Wood","wood",18,18,"2026-02-26T12:53:25Z", 92.1,-0.7,1.7,0.75,-0.95, 127.5,1.38,12.63,0.82, 2073,800.4,2222,-21.11, 17.2,190.3,-17.0,229.8,-24.7),
  s(40,"s2","c3","5 Wood","wood",18,19,"2026-02-26T12:53:43Z", 92.0,-1.11,1.35,1.76,0.41, 130.5,1.42,12.72,1.61, 3111,-70.6,3112,1.3, 23.8,204.7,7.9,224.3,8.8),
  s(41,"s2","c3","5 Wood","wood",18,20,"2026-02-26T12:54:02Z", 91.7,-0.73,-1.67,-0.7,0.97, 125.6,1.37,12.58,-0.78, 2051,943.0,2258,-24.69, 16.2,183.3,-24.4,227.5,-35.5),
  s(42,"s2","c3","5 Wood","wood",18,21,"2026-02-26T12:54:20Z", 90.1,-0.3,-0.63,0.33,0.96, 124.9,1.39,12.99,0.19, 1884,760.4,2032,-21.98, 16.1,183.2,-17.3,232.1,-26.8),
  s(43,"s2","c3","5 Wood","wood",18,22,"2026-02-26T12:54:40Z", 93.1,-1.86,0.88,-4.28,-5.16, 130.8,1.41,6.68,-3.4, 4009,303.6,4021,-4.33, 14.2,185.0,-17.1,215.2,-20.7),
  s(44,"s2","c3","5 Wood","wood",18,23,"2026-02-26T12:54:58Z", 91.7,-1.4,-0.92,-4.55,-3.63, 129.5,1.41,11.74,-3.86, 2280,227.2,2291,-5.69, 17.6,197.5,-19.7,234.0,-24.3),
  s(45,"s2","c3","5 Wood","wood",18,24,"2026-02-26T12:55:15Z", 90.8,-1.3,-1.18,-5.2,-4.02, 133.0,1.47,10.07,-4.42, 3531,-815.8,3624,13.01, 20.4,200.0,2.8,220.0,5.0),
];

// ── Club Stats (computed from real data) ───────────────────────────────────

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
  overallScore: 68,
  overallGrade: "B",
  metrics: [
    { name: "Smash Factor", value: 1.41, unit: "", optimalRange: [1.44, 1.52], score: "yellow", suggestion: "Smash factor is slightly below optimal. Focus on center contact." },
    { name: "Launch Angle", value: 12.9, unit: "°", optimalRange: [10, 14], score: "green", suggestion: "Launch angle is in the optimal range for driver." },
    { name: "Spin Rate", value: 2524, unit: "rpm", optimalRange: [2000, 2800], score: "green", suggestion: "Spin rate is in the optimal range." },
    { name: "Angle of Attack", value: 2.1, unit: "°", optimalRange: [0, 5], score: "green", suggestion: "Positive angle of attack — good for driver distance." },
    { name: "Distance Consistency", value: 82, unit: "%", optimalRange: [90, 100], score: "yellow", suggestion: "Carry spread of 20+ yards. Work on consistent strike location." },
    { name: "Directional Accuracy", value: 15.3, unit: "yds offline", optimalRange: [0, 10], score: "red", suggestion: "Shots scatter both left and right. Face-to-path relationship is inconsistent." },
  ],
  strengths: ["Launch Angle", "Spin Rate", "Angle of Attack"],
  weaknesses: [
    "Face-to-path varies from -8.8° to +7.9° — directional control is the primary issue.",
    "Smash factor of 1.41 indicates some off-center hits are costing distance.",
  ],
  drills: [
    { name: "Face Tape Drill", category: "accuracy", description: "Put impact tape or foot spray on the face. Hit 10 balls and check strike pattern. Goal: cluster within a quarter-sized area.", targetIssue: "Inconsistent face contact", priority: "high" },
    { name: "Alignment Stick Gate", category: "accuracy", description: "Place two alignment sticks 8 inches apart just past the ball. Swing through the gate. This trains a consistent path.", targetIssue: "Variable club path (-5° to +7°)", priority: "high" },
    { name: "9-Shot Drill", category: "consistency", description: "Hit 3 draws, 3 fades, 3 straight. If you can control shape, you control face-to-path.", targetIssue: "Face control", priority: "medium" },
  ],
  insights: [
    "Your best 5 driver carries average 240 yards vs overall 233 — a 7-yard gap that's mostly contact quality.",
    "Your face-to-path ranges from -8.8° to +7.9°, causing shots to scatter 43 yards left-to-right. This is the #1 area to improve.",
    "5 Wood: left miss tendency with avg offline -7.4 yards. The -2.0° average face angle suggests alignment may be contributing.",
  ],
};

// ── Bag Mapping ────────────────────────────────────────────────────────────

export const MOCK_BAG_MAPPING = {
  id: "bm1",
  name: "My Bag",
  isActive: true,
  minShots: 5,
  createdAt: "2026-02-25T00:00:00Z",
  updatedAt: "2026-02-26T00:00:00Z",
  clubs: MOCK_CLUBS.map((club, i) => {
    const stats = MOCK_CLUB_STATS.find(s => s.clubId === club.id);
    return {
      id: `bmc-${i + 1}`,
      bagMappingId: "bm1",
      clubId: club.id,
      status: "completed",
      avgCarry: stats?.avgCarry ?? null,
      avgTotal: stats?.avgTotal ?? null,
      minCarry: stats ? stats.avgCarry - Math.round(stats.stdDevCarry * 1.2) : null,
      maxCarry: stats ? stats.avgCarry + Math.round(stats.stdDevCarry * 1.2) : null,
      avgOffline: stats?.avgOffline ?? null,
      dispersionRadius: stats ? Math.round(stats.dispersionWidth / 2 * 10) / 10 : null,
      dispersionAngle: stats ? Math.round(Math.atan2(stats.dispersionWidth / 2, stats.avgCarry) * 180 / Math.PI * 2 * 10) / 10 : null,
      shotCount: stats?.shotCount ?? 0,
      sessionId: null,
      createdAt: "2026-02-25T00:00:00Z",
      updatedAt: "2026-02-26T00:00:00Z",
      club: { id: club.id, name: club.name, type: club.type, loft: club.loft },
    };
  }),
};

// ── Wedge Matrix (empty — no wedge data yet) ──────────────────────────────

export const MOCK_WEDGE_MATRIX = null;

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
