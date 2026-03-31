import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LOCAL_USER_EMAIL = "local@golfpulse.local";

const wedgeMatrix = {
  "58": {
    "7": { avgCarry: 14.9, carryMin: 13.6, carryMax: 17.1, avgTotal: 21.9, totalMin: 19.9, totalMax: 22.8 },
    "8": { avgCarry: 34.8, carryMin: 29.2, carryMax: 41.1, avgTotal: 41.8, totalMin: 36.0, totalMax: 48.0 },
    "9": { avgCarry: 58.1, carryMin: 50.9, carryMax: 67.8, avgTotal: 63.8, totalMin: 57.9, totalMax: 73.0 },
    "10": { avgCarry: 65.4, carryMin: 56.6, carryMax: 73.2, avgTotal: 69.7, totalMin: 61.2, totalMax: 77.8 },
  },
  "54": {
    "7": { avgCarry: 33.2, carryMin: 29.1, carryMax: 37.2, avgTotal: 41.5, totalMin: 38.8, totalMax: 45.9 },
    "8": { avgCarry: 45.7, carryMin: 41.0, carryMax: 48.1, avgTotal: 53.2, totalMin: 50.1, totalMax: 55.8 },
    "9": { avgCarry: 65.3, carryMin: 61.5, carryMax: 71.1, avgTotal: 71.8, totalMin: 68.7, totalMax: 76.2 },
    "10": { avgCarry: 78.7, carryMin: 75.0, carryMax: 82.3, avgTotal: 85.3, totalMin: 80.0, totalMax: 87.8 },
  },
  "50": {
    "7": { avgCarry: 33.9, carryMin: 27.2, carryMax: 42.9, avgTotal: 45.2, totalMin: 39.5, totalMax: 52.7 },
    "8": { avgCarry: 47.9, carryMin: 40.9, carryMax: 57.3, avgTotal: 58.3, totalMin: 53.0, totalMax: 65.2 },
    "9": { avgCarry: 73.1, carryMin: 64.2, carryMax: 85.1, avgTotal: 81.4, totalMin: 73.2, totalMax: 92.1 },
    "10": { avgCarry: 87.8, carryMin: 81.4, carryMax: 96.8, avgTotal: 93.3, totalMin: 87.3, totalMax: 102.7 },
  },
};

const WEDGE_CLUBS = [
  { name: "58° LW (Vokey SM10)", type: "wedge", loft: 58, sortOrder: 13 },
  { name: "54° SW (Vokey SM10)", type: "wedge", loft: 54, sortOrder: 12 },
  { name: "50° GW (Vokey SM10)", type: "wedge", loft: 50, sortOrder: 11 },
];

const SWING_LABELS: Record<string, string> = {
  "7": "7 O'Clock",
  "8": "8 O'Clock",
  "9": "9 O'Clock",
  "10": "10 O'Clock",
};

async function main() {
  console.log("Seeding wedge matrix data...");

  // Get or create local user
  let user = await prisma.user.findUnique({ where: { email: LOCAL_USER_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: LOCAL_USER_EMAIL, name: "Local User" },
    });
    console.log("Created local user");
  }

  // Get or create wedge clubs
  const clubMap = new Map<string, string>(); // loft -> clubId
  for (const wc of WEDGE_CLUBS) {
    let club = await prisma.club.findFirst({
      where: { userId: user.id, loft: wc.loft, type: "wedge" },
    });
    if (!club) {
      club = await prisma.club.create({
        data: { userId: user.id, ...wc },
      });
      console.log(`Created club: ${wc.name}`);
    } else {
      // Update name to match
      await prisma.club.update({
        where: { id: club.id },
        data: { name: wc.name },
      });
      console.log(`Found existing club for ${wc.loft}° — updated name to "${wc.name}"`);
    }
    clubMap.set(String(wc.loft), club.id);
  }

  // Deactivate any existing wedge matrix
  await prisma.wedgeMatrix.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });

  // Create wedge matrix
  const lofts = ["58", "54", "50"] as const;
  const positions = ["7", "8", "9", "10"] as const;

  const entries = lofts.flatMap((loft) =>
    positions.map((pos) => {
      const data = wedgeMatrix[loft][pos];
      const clubId = clubMap.get(loft)!;
      const isChip = loft === "58" && pos === "7";
      return {
        clubId,
        swingKey: pos,
        swingLabel: SWING_LABELS[pos],
        avgCarry: data.avgCarry,
        avgTotal: data.avgTotal,
        minCarry: data.carryMin,
        maxCarry: data.carryMax,
        minTotal: data.totalMin,
        maxTotal: data.totalMax,
        shotCount: 10,
        status: "completed",
        notes: isChip ? "Chip length — not a standard partial swing" : null,
      };
    })
  );

  const matrix = await prisma.wedgeMatrix.create({
    data: {
      userId: user.id,
      name: "My Wedge Matrix",
      system: "clock",
      entries: { create: entries },
    },
    include: { entries: true },
  });

  console.log(`Created wedge matrix with ${matrix.entries.length} entries:`);
  for (const loft of lofts) {
    const clubName = WEDGE_CLUBS.find((c) => c.loft === Number(loft))!.name;
    for (const pos of positions) {
      const d = wedgeMatrix[loft][pos];
      const note = loft === "58" && pos === "7" ? " ← chip length" : "";
      console.log(
        `  ${clubName} @ ${pos} o'clock: ${d.avgCarry} carry (${d.carryMin}–${d.carryMax}), ${d.avgTotal} total${note}`
      );
    }
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
