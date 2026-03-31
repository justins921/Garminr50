"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

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
  minTotal: number | null;
  maxTotal: number | null;
  shotCount: number;
  status: string;
  notes: string | null;
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
            <th className="p-2 text-left text-xs font-medium text-muted-foreground border-b w-36">
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
                      <div className="space-y-0.5">
                        {/* Carry */}
                        <p className="text-lg font-bold tabular-nums">{entry.avgCarry}</p>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {entry.minCarry}–{entry.maxCarry}
                        </p>

                        {/* Total */}
                        {entry.avgTotal && (
                          <>
                            <p className="text-xs font-semibold tabular-nums text-muted-foreground mt-1">
                              {entry.avgTotal} <span className="font-normal">total</span>
                            </p>
                            {entry.minTotal != null && entry.maxTotal != null && (
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                {entry.minTotal}–{entry.maxTotal}
                              </p>
                            )}
                          </>
                        )}

                        {/* Spin */}
                        {entry.avgSpinRate && (
                          <p className="text-[10px] text-muted-foreground">
                            {entry.avgSpinRate} rpm
                          </p>
                        )}

                        {/* Note */}
                        {entry.notes && (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            <span className="text-[9px] text-amber-500 leading-tight">
                              {entry.notes}
                            </span>
                          </div>
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
