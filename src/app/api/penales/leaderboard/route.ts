import { NextResponse } from "next/server";
import { createSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export interface Goleador {
  id: string;
  name: string;
  goals: number;
  updatedAt?: string;
}

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

    const goleadores: Goleador[] = (data ?? []).map((row) => ({
      id: row.client_id,
      name: row.name,
      goals: row.goals,
      updatedAt: row.updated_at ?? undefined,
    }));

    return NextResponse.json({ data: goleadores });
  } catch (err) {
    console.error("Penales leaderboard GET error:", err);
    return NextResponse.json({ error: "Error al cargar goleadores" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ data: [], useLocalStorage: true }, { status: 200 });
  }

  try {
    const body = await request.json();
    const clientId = String(body?.clientId ?? "").trim();
    const name = String(body?.name ?? "").trim();
    const goalsToAdd = Math.max(0, Number(body?.goals ?? 0));

    if (!clientId || !name) {
      return NextResponse.json({ error: "clientId y name requeridos" }, { status: 400 });
    }

    const supabase = createSupabaseClient();
    const nameLower = name.toLowerCase();

    const { data: existing } = await supabase
      .from("penales_goleadores")
      .select("id, goals")
      .eq("client_id", clientId)
      .maybeSingle();

    const newGoals = existing ? existing.goals + goalsToAdd : goalsToAdd;

    const row = {
      client_id: clientId,
      name,
      name_lower: nameLower,
      goals: newGoals,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from("penales_goleadores")
        .update(row)
        .eq("id", existing.id);
    } else {
      await supabase.from("penales_goleadores").insert(row);
    }

    const { data: updated } = await supabase
      .from("penales_goleadores")
      .select("client_id, name, goals, updated_at")
      .order("goals", { ascending: false });

    const goleadores: Goleador[] = (updated ?? []).map((r) => ({
      id: r.client_id,
      name: r.name,
      goals: r.goals,
      updatedAt: r.updated_at ?? undefined,
    }));

    return NextResponse.json({ data: goleadores });
  } catch (err) {
    console.error("Penales leaderboard POST error:", err);
    return NextResponse.json({ error: "Error al guardar goleador" }, { status: 500 });
  }
}
