import { NextResponse } from "next/server";
import { createSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export interface Participant {
  id: string;
  name: string;
  score: number;
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
      .select("id, name, score")
      .order("score", { ascending: false });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const participants: Participant[] = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      score: row.score,
    }));

    return NextResponse.json({ data: participants });
  } catch (err) {
    console.error("Leaderboard GET error:", err);
    return NextResponse.json({ error: "Error al cargar puntajes" }, { status: 500 });
  }
}

// POST: Guardar/actualizar puntajes (merge: por nombre, se guarda el mejor puntaje)
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
        .select("id, name, score")
        .order("score", { ascending: false });
      return NextResponse.json({ data: (data ?? []).map((r) => ({ id: r.id, name: r.name, score: r.score })) });
    }

    // Por cada nombre, tomar el mejor puntaje del cliente
    const bestByName = new Map<string, { name: string; score: number }>();
    for (const p of clientData) {
      const name = String(p?.name ?? "").trim();
      if (!name) continue;
      const score = Math.max(0, Number(p?.score ?? 0));
      const existing = bestByName.get(name.toLowerCase());
      if (!existing || score > existing.score) {
        bestByName.set(name.toLowerCase(), { name, score });
      }
    }

    const supabase = createSupabaseClient();

    const entries = Array.from(bestByName.values());
    for (const { name, score } of entries) {
      const nameLower = name.toLowerCase();
      const { data: existing } = await supabase
        .from("beerpong_leaderboard")
        .select("id, score")
        .eq("name_lower", nameLower)
        .maybeSingle();

      if (existing) {
        if (score > existing.score) {
          await supabase
            .from("beerpong_leaderboard")
            .update({ score, name, name_lower: nameLower, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        }
      } else {
        await supabase.from("beerpong_leaderboard").insert({ name, name_lower: nameLower, score });
      }
    }

    const { data: updated } = await supabase
      .from("beerpong_leaderboard")
      .select("id, name, score")
      .order("score", { ascending: false });

    const participants: Participant[] = (updated ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      score: r.score,
    }));

    return NextResponse.json({ data: participants });
  } catch (err) {
    console.error("Leaderboard POST error:", err);
    return NextResponse.json({ error: "Error al guardar puntajes" }, { status: 500 });
  }
}
