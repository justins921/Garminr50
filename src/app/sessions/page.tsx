"use client";

import { useFetch } from "@/hooks/use-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { History } from "lucide-react";

interface SessionItem {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  environment: string;
  sessionType: string;
  source: string;
  notes: string | null;
  _count: { shots: number };
  tags: Array<{ tag: { id: string; name: string; color: string | null } }>;
}

export default function SessionsPage() {
  const { data: sessions, loading } = useFetch<SessionItem[]>("/api/sessions");

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6" />
            Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sessions?.length ?? 0} total sessions
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !sessions?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No sessions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start a live session or import data to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{session.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {format(new Date(session.startedAt), "EEEE, MMM d, yyyy · h:mm a")}
                      </p>
                      {session.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{session.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary">{session._count.shots} shots</Badge>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">{session.environment}</Badge>
                        <Badge variant="outline" className="text-xs">{session.sessionType}</Badge>
                      </div>
                    </div>
                  </div>
                  {session.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {session.tags.map((st) => (
                        <Badge key={st.tag.id} variant="secondary" className="text-xs">
                          {st.tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
