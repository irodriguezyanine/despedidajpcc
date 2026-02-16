import { NextResponse } from "next/server";
import { createSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export interface VoteRecord {
  email: string;
  name: string;
  mvp: string;
  masPerra: string;
  timestamp: number;
}

// GET: Obtener todos los votos de la encuesta
export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ data: [], useLocalStorage: true }, { status: 200 });
  }

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("encuesta_votos")
      .select("email, name, mvp, mas_perra, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching encuesta votes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const votes: VoteRecord[] = (data ?? []).map((row) => ({
      email: row.email,
      name: row.name,
      mvp: row.mvp,
      masPerra: row.mas_perra,
      timestamp: new Date(row.updated_at).getTime(),
    }));

    return NextResponse.json({ data: votes });
  } catch (err) {
    console.error("Encuesta GET error:", err);
    return NextResponse.json({ error: "Error al cargar votos" }, { status: 500 });
  }
}

// POST: Guardar o actualizar un voto (reemplaza si el correo ya votó)
export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ data: [], useLocalStorage: true }, { status: 200 });
  }

  try {
    const body = await request.json();
    const { email, name, mvp, masPerra } = body ?? {};

    const trimmedEmail = String(email ?? "").trim().toLowerCase();
    const trimmedName = String(name ?? "").trim();
    const mvpVal = String(mvp ?? "").trim();
    const masPerraVal = String(masPerra ?? "").trim();

    if (!trimmedEmail || !trimmedName || !mvpVal || !masPerraVal) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createSupabaseClient();

    const { data: existing } = await supabase
      .from("encuesta_votos")
      .select("id")
      .eq("email_lower", trimmedEmail)
      .maybeSingle();

    const row = {
      email: trimmedEmail,
      email_lower: trimmedEmail,
      name: trimmedName,
      mvp: mvpVal,
      mas_perra: masPerraVal,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from("encuesta_votos")
        .update(row)
        .eq("id", existing.id);
    } else {
      await supabase.from("encuesta_votos").insert(row);
    }

    const { data: allVotes } = await supabase
      .from("encuesta_votos")
      .select("email, name, mvp, mas_perra, updated_at")
      .order("updated_at", { ascending: false });

    const votes: VoteRecord[] = (allVotes ?? []).map((r) => ({
      email: r.email,
      name: r.name,
      mvp: r.mvp,
      masPerra: r.mas_perra,
      timestamp: new Date(r.updated_at).getTime(),
    }));

    return NextResponse.json({ data: votes });
  } catch (err) {
    console.error("Encuesta POST error:", err);
    return NextResponse.json({ error: "Error al guardar voto" }, { status: 500 });
  }
}
