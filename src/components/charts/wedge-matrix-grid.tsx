"use client";

import { Badge } from "@/components/ui/badge";

interface Entry {
  id: string;
  clubId: string;
  swingKey: string;
  swingLabel: string;
  avgCarry: number | null;
  avgTotal: number | null;
  avgSpinRate: number | null;
  avgLaunchAngle: number | null;
  minCarry: number | null;
  maxCarry: number | null;
  shotCount: number;
  status: string;
  club?: { name: string; loft: number | null } | null;
}

interface SwingKey {
  key: string;
  label: string;
}

interface Props {
  entries: Entry[];
  swingKeys: SwingKey[];
  onCellClick?: (entry: Entry) => void;
}

export function WedgeMatrixGrid({ entries, swingKeys, onCellClick }: Props) {
  // Group entries by club
  const clubIds = [...new Set(entries.map((e) => e.clubId))];
  const clubs = clubIds.map((id) => {
    const entry = entries.find((e) => e.clubId === id);
    return { id, name: entry?.club?.name ?? "Unknown", loft: entry?.club?.loft };
  });

  // Sort clubs by loft (lowest to highest = longest to shortest)
  clubs.sort((a, b) => (a.loft ?? 99) - (b.loft ?? 99));

  const getEntry = (clubId: string, swingKey: string) =>
    entries.find((e) => e.clubId === clubId && e.swingKey === swingKey);

  // Color coding for distance cells
  const getColor = (carry: number | null, status: string) => {
    if (status === "pending" || carry === null) return "bg-muted/30";
    if (status === "completed") return "bg-emerald-500/10 border-emerald-500/20";
    return "bg-amber-500/10 border-amber-500/20";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-xs font-medium text-muted-foreground border-b w-32">
              Club
            </th>
            {swingKeys.map((sk) => (
              <th
                key={sk.key}
                className="p-2 text-center text-xs font-medium text-muted-foreground border-b"
              >
                {sk.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clubs.map((club) => (
            <tr key={club.id} className="border-b">
              <td className="p-2">
                <div>
                  <span className="font-medium text-sm">{club.name}</span>
                  {club.loft && (
                    <span className="text-xs text-muted-foreground ml-1">{club.loft}°</span>
                  )}
                </div>
              </td>
              {swingKeys.map((sk) => {
                const entry = getEntry(club.id, sk.key);
                if (!entry) return <td key={sk.key} className="p-2" />;

                return (
                  <td
                    key={sk.key}
                    className={`p-2 text-center cursor-pointer transition-colors hover:bg-accent ${getColor(entry.avgCarry, entry.status)}`}
                    onClick={() => onCellClick?.(entry)}
                  >
                    {entry.avgCarry ? (
                      <div>
                        <p className="text-lg font-bold tabular-nums">{entry.avgCarry}</p>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {entry.minCarry}–{entry.maxCarry}
                        </p>
                        {entry.avgSpinRate && (
                          <p className="text-[10px] text-muted-foreground">
                            {entry.avgSpinRate} rpm
                          </p>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-[9px] mt-0.5"
                        >
                          {entry.shotCount} shots
                        </Badge>
                      </div>
                    ) : (
                      <div className="py-3">
                        <p className="text-xs text-muted-foreground">—</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {entry.shotCount > 0 ? `${entry.shotCount} shots` : "No data"}
                        </p>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
