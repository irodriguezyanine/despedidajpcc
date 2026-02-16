import { NextResponse } from "next/server";
import { createSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export interface Participant {
  id: string;
  name: string;
  score: number;
  playedAt?: string;
}

// GET: Obtener tabla de puntajes (compartida entre todos los dispositivos)
export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ data: [], useLocalStorage: true }, { status: 200 });
  }

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("beerpong_leaderboard")
      .select("client_id, name, score, updated_at")
      .order("score", { ascending: false });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const participants: Participant[] = (data ?? []).map((row) => ({
      id: row.client_id,
      name: row.name,
      score: row.score,
      playedAt: row.updated_at ?? undefined,
    }));

    return NextResponse.json({ data: participants });
  } catch (err) {
    console.error("Leaderboard GET error:", err);
    return NextResponse.json({ error: "Error al cargar puntajes" }, { status: 500 });
  }
}

// POST: Guardar cada intento por separado (Rodri intento 2, intento 3...)
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
        .from("beerpong_leaderboard")
        .select("client_id, name, score, updated_at")
        .order("score", { ascending: false });
      return NextResponse.json({
        data: (data ?? []).map((r) => ({
          id: r.client_id,
          name: r.name,
          score: r.score,
          playedAt: r.updated_at ?? undefined,
        })),
      });
    }

    const supabase = createSupabaseClient();

    // Guardar cada participante/intento por separado (no sumar puntajes, cada intento es una fila)
    // Usar playedAt del cliente para conservar la hora exacta de cada jugada
    for (const p of clientData) {
      const clientId = String(p?.id ?? "").trim();
      const name = String(p?.name ?? "").trim();
      if (!clientId || !name) continue;
      const score = Math.max(0, Number(p?.score ?? 0));
      const nameLower = name.toLowerCase();
      const playedAt = p?.playedAt ? new Date(p.playedAt).toISOString() : new Date().toISOString();

      const { data: existing } = await supabase
        .from("beerpong_leaderboard")
        .select("id, score")
        .eq("client_id", clientId)
        .maybeSingle();

      const row = {
        client_id: clientId,
        name,
        name_lower: nameLower,
        score,
        updated_at: playedAt,
      };

      if (existing) {
        // Solo actualizar si el puntaje mejoró; conservar playedAt del cliente
        if (score >= existing.score) {
          await supabase
            .from("beerpong_leaderboard")
            .update(row)
            .eq("id", existing.id);
        }
      } else {
        await supabase.from("beerpong_leaderboard").insert(row);
      }
    }

    const { data: updated } = await supabase
      .from("beerpong_leaderboard")
      .select("client_id, name, score, updated_at")
      .order("score", { ascending: false });

    const participants: Participant[] = (updated ?? []).map((r) => ({
      id: r.client_id,
      name: r.name,
      score: r.score,
      playedAt: r.updated_at ?? undefined,
    }));

    return NextResponse.json({ data: participants });
  } catch (err) {
    console.error("Leaderboard POST error:", err);
    return NextResponse.json({ error: "Error al guardar puntajes" }, { status: 500 });
  }
}
