import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

const OTERNAL_APP_URL = "https://oranos-eternal.vercel.app/auth?source=oranos";

export default async function OternalLaunchPage() {
  const jar = await cookies();
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {}
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/oternal/launch");

  redirect(OTERNAL_APP_URL);
}
