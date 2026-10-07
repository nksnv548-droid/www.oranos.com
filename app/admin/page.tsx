import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";
import AdminReviewDesk from "./AdminReviewDesk";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const jar = await cookies();
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(values) { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch {} },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data: allowed, error } = await supabase.rpc("is_admin");
  if (error || allowed !== true) {
    return <main className="dashboard"><header className="dash-header"><a className="brand" href="/community"><img src="/oranos-crest.png" alt="ORANOS crest" className="account-logo"/><span>ORANOS <small>ADMIN</small></span></a></header><section className="welcome"><div className="eyebrow">RESTRICTED AREA</div><h1>Admin access required.</h1><p>This account is not authorized to view Titan review records. Ask the ORANOS administrator to provision admin access.</p><a className="text-link" href="/account">Return to member space →</a></section></main>;
  }
  return <main className="dashboard"><header className="dash-header"><a className="brand" href="/community"><img src="/oranos-crest.png" alt="ORANOS crest" className="account-logo"/><span>ORANOS <small>ADMIN / TITAN REVIEW</small></span></a><form action="/auth/signout" method="post"><button className="quiet-button" type="submit">Sign out</button></form></header><AdminReviewDesk/><footer className="dash-footer"><span>ORANOS — FORGE YOUR STANDARD.</span><a href="/account">Member space</a></footer></main>;
}
