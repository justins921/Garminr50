import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLUBS = [
  { name: "Driver", type: "driver", loft: 10.5, sortOrder: 1 },
  { name: "3 Wood", type: "wood", loft: 15, sortOrder: 2 },
  { name: "5 Wood", type: "wood", loft: 18, sortOrder: 3 },
  { name: "4 Hybrid", type: "hybrid", loft: 22, sortOrder: 4 },
  { name: "5 Iron", type: "iron", loft: 25, sortOrder: 5 },
  { name: "6 Iron", type: "iron", loft: 28, sortOrder: 6 },
  { name: "7 Iron", type: "iron", loft: 31, sortOrder: 7 },
  { name: "8 Iron", type: "iron", loft: 35, sortOrder: 8 },
  { name: "9 Iron", type: "iron", loft: 39, sortOrder: 9 },
  { name: "Pitching Wedge", type: "wedge", loft: 44, sortOrder: 10 },
  { name: "Gap Wedge", type: "wedge", loft: 50, sortOrder: 11 },
  { name: "Sand Wedge", type: "wedge", loft: 54, sortOrder: 12 },
  { name: "Lob Wedge", type: "wedge", loft: 58, sortOrder: 13 },
];

// Realistic shot data ranges per club
const CLUB_RANGES: Record<string, { carry: [number, number]; ball: [number, number]; club: [number, number]; launch: [number, number]; spin: [number, number]; offline: [number, number] }> = {
  Driver:          { carry: [220, 280], ball: [145, 170], club: [95, 115], launch: [9, 14], spin: [2000, 3200], offline: [-25, 25] },
  "3 Wood":        { carry: [200, 245], ball: [135, 155], club: [90, 108], launch: [10, 15], spin: [3000, 4500], offline: [-20, 20] },
  "5 Wood":        { carry: [185, 225], ball: [125, 148], club: [85, 103], launch: [12, 17], spin: [3500, 5000], offline: [-18, 18] },
  "4 Hybrid":      { carry: [170, 210], ball: [120, 142], club: [82, 98],  launch: [13, 18], spin: [4000, 5500], offline: [-15, 15] },
  "5 Iron":        { carry: [160, 195], ball: [115, 138], club: [80, 95],  launch: [14, 19], spin: [4500, 6000], offline: [-14, 14] },
  "6 Iron":        { carry: [150, 180], ball: [110, 132], club: [78, 93],  launch: [15, 20], spin: [5000, 6500], offline: [-13, 13] },
  "7 Iron":        { carry: [140, 170], ball: [105, 128], club: [75, 90],  launch: [16, 22], spin: [5500, 7200], offline: [-12, 12] },
  "8 Iron":        { carry: [130, 158], ball: [100, 122], club: [73, 88],  launch: [18, 25], spin: [6000, 8000], offline: [-11, 11] },
  "9 Iron":        { carry: [120, 145], ball: [95, 115],  club: [70, 85],  launch: [20, 28], spin: [7000, 9000], offline: [-10, 10] },
  "Pitching Wedge":{ carry: [110, 135], ball: [88, 108],  club: [68, 82],  launch: [22, 30], spin: [7500, 9500], offline: [-9, 9] },
  "Gap Wedge":     { carry: [95, 120],  ball: [80, 100],  club: [65, 78],  launch: [25, 33], spin: [8000, 10500], offline: [-8, 8] },
  "Sand Wedge":    { carry: [80, 105],  ball: [72, 92],   club: [60, 75],  launch: [27, 36], spin: [8500, 11000], offline: [-7, 7] },
  "Lob Wedge":     { carry: [60, 90],   ball: [60, 82],   club: [55, 70],  launch: [30, 40], spin: [9000, 12000], offline: [-7, 7] },
};

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function normalRand(min: number, max: number): number {
  // Box-Muller for more realistic distribution clustered around mean
  const mean = (min + max) / 2;
  const sd = (max - min) / 4;
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.round(Math.max(min, Math.min(max, mean + z * sd)) * 10) / 10;
}

async function main() {
  console.log("Seeding database...");

  // Create clubs
  const clubs = [];
  for (const c of CLUBS) {
    const club = await prisma.club.create({ data: c });
    clubs.push(club);
  }
  console.log(`Created ${clubs.length} clubs`);

  // Create tags
  const tagNames = ["indoor", "outdoor", "driver-focus", "wedge-work", "gapping", "warm-up", "stock-shots"];
  const tags = [];
  for (const name of tagNames) {
    const tag = await prisma.tag.create({ data: { name } });
    tags.push(tag);
  }

  // Create sessions with realistic shot data
  const sessionConfigs = [
    { name: "Driver Session", date: new Date("2026-03-01T10:00:00"), clubs: ["Driver"], env: "indoor", type: "practice", shots: 30 },
    { name: "Iron Work", date: new Date("2026-03-03T14:00:00"), clubs: ["7 Iron", "8 Iron", "9 Iron"], env: "indoor", type: "practice", shots: 45 },
    { name: "Full Bag Gapping", date: new Date("2026-03-05T09:00:00"), clubs: CLUBS.map(c => c.name), env: "outdoor", type: "gapping", shots: 65 },
    { name: "Wedge Session", date: new Date("2026-03-07T16:00:00"), clubs: ["Pitching Wedge", "Gap Wedge", "Sand Wedge", "Lob Wedge"], env: "indoor", type: "stock_shot", shots: 40 },
  ];

  for (const config of sessionConfigs) {
    const session = await prisma.session.create({
      data: {
        name: config.name,
        startedAt: config.date,
        endedAt: new Date(config.date.getTime() + 60 * 60 * 1000),
        environment: config.env,
        sessionType: config.type,
        source: "manual",
        notes: `Seed data: ${config.name}`,
      },
    });

    // Add tags
    if (config.env === "indoor") {
      await prisma.sessionTag.create({ data: { sessionId: session.id, tagId: tags[0].id } });
    } else {
      await prisma.sessionTag.create({ data: { sessionId: session.id, tagId: tags[1].id } });
    }

    let shotNum = 0;
    for (let i = 0; i < config.shots; i++) {
      shotNum++;
      const clubName = config.clubs[i % config.clubs.length];
      const club = clubs.find((c) => c.name === clubName)!;
      const ranges = CLUB_RANGES[clubName];

      const ballSpeed = normalRand(ranges.ball[0], ranges.ball[1]);
      const clubSpeed = normalRand(ranges.club[0], ranges.club[1]);
      const carry = normalRand(ranges.carry[0], ranges.carry[1]);
      const offline = normalRand(ranges.offline[0], ranges.offline[1]);
      const spinRate = Math.round(normalRand(ranges.spin[0], ranges.spin[1]));
      const launchAngle = normalRand(ranges.launch[0], ranges.launch[1]);
      const smashFactor = Math.round((ballSpeed / clubSpeed) * 100) / 100;

      // ~10% chance of mishit
      const isMishit = Math.random() < 0.1;
      const validity = isMishit ? "invalid" : "valid";
      const shotResult = isMishit
        ? ["thin", "fat", "toe", "heel"][Math.floor(Math.random() * 4)]
        : "good";

      const shotShape = offline < -5 ? "draw" : offline > 5 ? "fade" : "straight";

      await prisma.shot.create({
        data: {
          sessionId: session.id,
          clubId: club.id,
          shotNumber: shotNum,
          timestamp: new Date(config.date.getTime() + shotNum * 45000), // ~45s per shot
          ballSpeed: isMishit ? ballSpeed * 0.75 : ballSpeed,
          clubSpeed,
          launchAngle: isMishit ? launchAngle * 0.8 : launchAngle,
          launchDirection: offline * 0.3,
          spinRate: isMishit ? spinRate * 1.3 : spinRate,
          spinAxis: offline * 2,
          carryDistance: isMishit ? carry * 0.7 : carry,
          totalDistance: isMishit ? carry * 0.75 : carry * 1.08,
          offlineDistance: isMishit ? offline * 2 : offline,
          apexHeight: carry * 0.12 + rand(-3, 3),
          smashFactor: isMishit ? smashFactor * 0.85 : smashFactor,
          angleOfAttack: rand(-5, 5),
          clubPath: rand(-4, 4),
          faceAngle: rand(-3, 3),
          faceToPath: rand(-2, 2),
          shotShape,
          shotResult,
          validity,
          source: "manual",
        },
      });
    }

    console.log(`Created session "${config.name}" with ${config.shots} shots`);
  }

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
