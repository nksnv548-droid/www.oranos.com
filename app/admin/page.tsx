import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";

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

  const { data: allowed, error: authError } = await supabase.rpc("is_admin");
  if (authError || allowed !== true) {
    return <main className="dashboard"><header className="dash-header"><a className="brand" href="/community.html"><img src="/oranos-crest.png" alt="ORANOS crest" className="account-logo" /><span>ORANOS <small>ADMIN</small></span></a><form action="/auth/signout" method="post"><button className="quiet-button" type="submit">Sign out ↗</button></form></header><section className="welcome"><div className="eyebrow">RESTRICTED AREA</div><h1>Admin access required.</h1><p>This account is not authorized to view Titan review records. Ask the ORANOS administrator to provision admin access.</p><a className="text-link" href="/account">Return to member space →</a></section></main>;
  }

  const { data: apps, error } = await supabase.from("titan_applications").select("id,user_id,status,created_at,started_at,completed_at,timezone").order("created_at", { ascending: false }).limit(100);
  const ids = (apps || []).map((a: any) => a.id);
  const [{ data: profiles }, { data: submissions }, { data: declarations }] = await Promise.all([
    supabase.from("profiles").select("id,full_name").in("id", (apps || []).map((a: any) => a.user_id)),
    ids.length ? supabase.from("titan_submissions").select("id,application_id,status,video_path,created_at,reviewer_notes").in("application_id", ids).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
    ids.length ? supabase.from("titan_declarations").select("id,application_id,status,video_path,question,created_at,reviewer_notes").in("application_id", ids).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
  ]);
  const names = new Map((profiles || []).map((p: any) => [p.id, p.full_name || "Member"]));
  return <main className="dashboard"><header className="dash-header"><a className="brand" href="/community.html"><img src="/oranos-crest.png" alt="ORANOS crest" className="account-logo" /><span>ORANOS <small>ADMIN / TITAN REVIEW</small></span></a><form action="/auth/signout" method="post"><button className="quiet-button" type="submit">Sign out ↗</button></form></header><section className="welcome"><div className="eyebrow">PRIVATE ADMIN / 01</div><h1>Titan <em>Review Desk.</em></h1><p>Applications and evidence overview. This phase is read-only; review decisions and pass issuance remain disabled until the verified review workflow is connected.</p><div className="member-status"><span className="status-dot" /> ADMIN AUTHORIZED</div></section><section className="section-head"><div><div className="eyebrow">APPLICATION QUEUE</div><h2>{apps?.length || 0} recent applications</h2></div><span className="section-index">LATEST 100</span></section>{error ? <p role="alert">Could not load applications. Check database permissions and try again.</p> : <section className="pillar-grid">{(apps || []).map((a: any) => <article className="pillar-card" key={a.id}><div className="eyebrow">{new Date(a.created_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})}</div><h3>{String(names.get(a.user_id) || "Member")}</h3><p>Status: <strong>{a.status.replaceAll("_"," ")}</strong></p><p>Application: <code>{a.id}</code></p><p>Submissions: {(submissions || []).filter((s: any)=>s.application_id===a.id).length} · Declarations: {(declarations || []).filter((d: any)=>d.application_id===a.id).length}</p>{(submissions || []).filter((s: any)=>s.application_id===a.id).map((s: any)=><p key={s.id}>Submission · {s.status} · {s.video_path ? "Evidence path recorded" : "No video path"}</p>)}{(declarations || []).filter((d: any)=>d.application_id===a.id).map((d: any)=><p key={d.id}>Declaration · {d.status} · {d.question}</p>)}</article>)}</section>}<footer className="dash-footer"><span>ORANOS — FORGE YOUR STANDARD.</span><a href="/account">Member space ↗</a></footer></main>;
}
