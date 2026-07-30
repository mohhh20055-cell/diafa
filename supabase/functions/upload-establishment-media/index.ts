import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB combined across all images
const ACCEPTED = new Set(["image/png", "image/jpeg", "image/jpg"]);
const ACCEPTED_EXT = [".png", ".jpg", ".jpeg"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const extOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return json({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return json({ error: "Session invalide." }, 401);

    const form = await req.formData();
    const files = form.getAll("files") as File[];

    if (!files || files.length === 0) {
      return json({ error: "Aucun fichier fourni." }, 400);
    }
    if (files.length > 8) {
      return json({ error: "Maximum 8 images par demande." }, 400);
    }

    // Backend validation: total size across ALL images combined
    let total = 0;
    for (const f of files) {
      total += f.size;
      const typeOk = ACCEPTED.has(f.type.toLowerCase());
      const extOk = ACCEPTED_EXT.includes(extOf(f.name));
      if (!typeOk && !extOk) {
        return json(
          { error: `Format non supporté: ${f.name}. Seuls PNG, JPG, JPEG sont acceptés.` },
          400
        );
      }
    }
    if (total > MAX_TOTAL_BYTES) {
      const over = ((total - MAX_TOTAL_BYTES) / (1024 * 1024)).toFixed(2);
      return json(
        {
          error: `La taille totale (${(total / (1024 * 1024)).toFixed(
            2
          )} Mo) dépasse la limite de 10 Mo combinés (excès de ${over} Mo).`,
        },
        413
      );
    }

    const bucket = "establishment-media";
    const folder = `${user.id}`;
    const uploaded: { name: string; path: string; url: string; size: number }[] = [];

    for (const f of files) {
      const safeExt = extOf(f.name) || ".jpg";
      const objectName = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}${safeExt}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(objectName, f, {
          contentType: f.type || "image/jpeg",
          upsert: false,
        });
      if (upErr) {
        return json({ error: `Échec de l'envoi: ${upErr.message}` }, 500);
      }

      const { data: pub } = supabase.storage
        .from(bucket)
        .getPublicUrl(objectName);

      uploaded.push({
        name: f.name,
        path: objectName,
        url: pub.publicUrl,
        size: f.size,
      });
    }

    return json({ success: true, files: uploaded, totalBytes: total });
  } catch (err) {
    return json({ error: (err as Error).message || "Erreur serveur." }, 500);
  }
});
