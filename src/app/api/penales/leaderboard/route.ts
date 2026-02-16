import { NextResponse } from "next/server";
import { createSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export interface Participant {
  id: string;
  name: string;
  score: number;
  playedAt?: string;
}

// GET: Obtener tabla de puntajes (mismo formato que Beer Pong)
export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ data: [], useLocalStorage: true }, { status: 200 });
  }

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("penales_goleadores")
      .select("client_id, name, goals, updated_at")
      .order("goals", { ascending: false });

    if (error) {
      console.error("Error fetching penales leaderboard:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const participants: Participant[] = (data ?? []).map((row) => ({
      id: row.client_id,
      name: row.name,
      score: row.goals,
      playedAt: row.updated_at ?? undefined,
    }));

    return NextResponse.json({ data: participants });
  } catch (err) {
    console.error("Penales leaderboard GET error:", err);
    return NextResponse.json({ error: "Error al cargar goleadores" }, { status: 500 });
  }
}

// POST: Guardar cada intento por separado (intento 2, 3... mismo formato que Beer Pong)
export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ data: [], useLocalStorage: true }, { status: 200 });
  }

  try {
    const body = await request.json();
    const clientData: Participant[] = Array.isArray(body?.data) ? body.data : [];

    if (clientData.length === 0) {
      const supabase = createSupabaseClient();
      const { data } = await supabase
        .from("penales_goleadores")
        .select("client_id, name, goals, updated_at")
        .order("goals", { ascending: false });
      return NextResponse.json({
        data: (data ?? []).map((r) => ({
          id: r.client_id,
          name: r.name,
          score: r.goals,
          playedAt: r.updated_at ?? undefined,
        })),
      });
    }

    const supabase = createSupabaseClient();

    for (const p of clientData) {
      const clientId = String(p?.id ?? "").trim();
      const name = String(p?.name ?? "").trim();
      if (!clientId || !name) continue;
      const score = Math.max(0, Number(p?.score ?? 0));
      const nameLower = name.toLowerCase();
      const playedAt = p?.playedAt ? new Date(p.playedAt).toISOString() : new Date().toISOString();

      const { data: existing } = await supabase
        .from("penales_goleadores")
        .select("id, goals")
        .eq("client_id", clientId)
        .maybeSingle();

      const row = {
        client_id: clientId,
        name,
        name_lower: nameLower,
        goals: score,
        updated_at: playedAt,
      };

      if (existing) {
        if (score >= existing.goals) {
          await supabase
            .from("penales_goleadores")
            .update(row)
            .eq("id", existing.id);
        }
      } else {
        await supabase.from("penales_goleadores").insert(row);
      }
    }

    const { data: updated } = await supabase
      .from("penales_goleadores")
      .select("client_id, name, goals, updated_at")
      .order("goals", { ascending: false });

    const participants: Participant[] = (updated ?? []).map((r) => ({
      id: r.client_id,
      name: r.name,
      score: r.goals,
      playedAt: r.updated_at ?? undefined,
    }));

    return NextResponse.json({ data: participants });
  } catch (err) {
    console.error("Penales leaderboard POST error:", err);
    return NextResponse.json({ error: "Error al guardar goleador" }, { status: 500 });
  }
}
