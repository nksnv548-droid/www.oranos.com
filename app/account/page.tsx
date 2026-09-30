import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";

const pillars = [
  { name: "FITNESS", detail: "Train strength, endurance, mobility, and recovery.", mark: "01" },
  { name: "MINDSET", detail: "Build focus, resilience, and intentional thinking.", mark: "02" },
  { name: "LIFESTYLE", detail: "Shape daily habits that support the life you want.", mark: "03" },
  { name: "DISCIPLINE", detail: "Keep promises to yourself through consistent action.", mark: "04" },
];

const applicationLabels: Record<string, string> = {
  in_progress: "Challenge in progress",
  submitted: "Challenge submitted",
  under_review: "Under review",
  passed: "Challenge passed",
  reattempt: "Reattempt available",
  rejected: "Application not approved",
  failed: "Challenge not passed",
};

export default async function AccountPage() {
  const jar = await cookies();
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(values) {
        try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch {}
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [{ data: profile }, { data: pass, error: passError }, { data: applications, error: applicationError }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("titan_passes").select("titan_id, status, earned_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("titan_applications").select("id, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
  ]);

  const name = String(profile?.full_name || user.user_metadata?.full_name || "Member").trim();
  const application = applications?.[0] ?? null;
  const passActive = pass?.status === "active";

  return (
    <main className="dashboard">
      <header className="dash-header">
        <a className="brand" href="/community.html">
          <img src="/oranos-crest.png" alt="ORANOS crest" className="account-logo" />
          <span>ORANOS <small>COMMUNITY</small></span>
        </a>
        <div className="header-user">
          <span>{name}</span>
          <form action="/auth/signout" method="post"><button className="quiet-button" type="submit">Sign out ↗</button></form>
        </div>
      </header>

      <section className="welcome">
        <div className="eyebrow">MEMBER SPACE / 01</div>
        <h1>Welcome back, <em>{name}.</em></h1>
        <p>Your standard is built in the choices you repeat. Choose a pillar and take your next step.</p>
        <div className="welcome-actions">
          <a className="gold-button" href="/titan-challenge">Explore Titan Challenge <span>↗</span></a>
          <a className="text-link" href="/community.html">Explore community →</a>
        </div>
      </section>

      <section className="section-head"><div><div className="eyebrow">THE ORANOS STANDARD</div><h2>Four pillars. One direction.</h2></div><span className="section-index">01 — 04</span></section>
      <section className="pillar-grid">{pillars.map(p => <article className="pillar-card" key={p.name}><div className="pillar-top"><span>{p.mark}</span><span className="pillar-symbol">↗</span></div><h3>{p.name}</h3><p>{p.detail}</p></article>)}</section>

      <section className="member-panel">
        <div>
          <div className="eyebrow">YOUR TITAN PASS</div>
          {passActive ? (
            <>
              <h2>ORANOS TITAN</h2>
              <p>Your Titan Pass is active. Your membership identity is shown below.</p>
              <div className="titan-pass-identity">
                <span className="eyebrow">TITAN ID</span>
                <strong>{pass.titan_id}</strong>
                <span className="eyebrow">ISSUED {pass.earned_at ? new Date(pass.earned_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—"}</span>
              </div>
            </>
          ) : (
            <>
              <h2>{pass?.status === "revoked" ? "Pass currently inactive" : "Earn your Titan Pass."}</h2>
              <p>{application ? (applicationLabels[application.status] || "Your challenge record is available.") : "The Titan Pass is issued after the ORANOS Titan Challenge is reviewed and approved. Starting a challenge does not automatically grant membership."}</p>
              {application && <div className="member-status"><span className="status-dot" /> {applicationLabels[application.status] || application.status.replaceAll("_", " ")}</div>}
              <div className="welcome-actions"><a className="gold-button" href="/titan-challenge">{application ? "View Titan Challenge ↗" : "Explore the Titan Challenge ↗"}</a></div>
            </>
          )}
          {(passError || applicationError) && <p role="status">Membership details are temporarily unavailable. Please refresh later.</p>}
        </div>
        <div className="member-status"><span className="status-dot" /> {passActive ? "TITAN PASS ACTIVE" : "MEMBERSHIP NOT YET ISSUED"}</div>
      </section>

      <footer className="dash-footer"><span>ORANOS — FORGE YOUR STANDARD.</span><a href="/community.html">Community home ↗</a></footer>
    </main>
  );
}
