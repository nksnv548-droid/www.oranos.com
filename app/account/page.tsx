import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const pillars = [
  { name: "FITNESS", detail: "Train strength, endurance, mobility, and recovery.", mark: "01" },
  { name: "MINDSET", detail: "Build focus, resilience, and intentional thinking.", mark: "02" },
  { name: "LIFESTYLE", detail: "Shape daily habits that support the life you want.", mark: "03" },
  { name: "DISCIPLINE", detail: "Keep promises to yourself through consistent action.", mark: "04" },
];

export default async function AccountPage() {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(values) { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch {} },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const name = String(user.user_metadata?.full_name || "Member").trim();

  return (
    <main className="dashboard">
      <header className="dash-header">
        <a className="brand" href="/community.html"><span className="brand-mark">O</span><span>ORANOS <small>COMMUNITY</small></span></a>
        <div className="header-user"><span>{name}</span><form action="/auth/signout" method="post"><button className="quiet-button" type="submit">Sign out ↗</button></form></div>
      </header>
      <section className="welcome">
        <div className="eyebrow">MEMBER SPACE / 01</div>
        <h1>Welcome back, <em>{name}.</em></h1>
        <p>Your standard is built in the choices you repeat. Choose a pillar and take your next step.</p>
        <div className="welcome-actions"><a className="gold-button" href="/titan-challenge.html">Explore Titan Challenge <span>↗</span></a><a className="text-link" href="/community.html">Explore community →</a></div>
      </section>
      <section className="section-head"><div><div className="eyebrow">THE ORANOS STANDARD</div><h2>Four pillars. One direction.</h2></div><span className="section-index">01 — 04</span></section>
      <section className="pillar-grid">{pillars.map((pillar) => <article className="pillar-card" key={pillar.name}><div className="pillar-top"><span>{pillar.mark}</span><span className="pillar-symbol">↗</span></div><h3>{pillar.name}</h3><p>{pillar.detail}</p></article>)}</section>
      <section className="member-panel"><div><div className="eyebrow">YOUR MEMBERSHIP</div><h2>Make consistency visible.</h2><p>Challenge submissions and membership status will appear here when those features are connected. No progress is fabricated or assumed.</p></div><div className="member-status"><span className="status-dot" /> ACCOUNT ACTIVE</div></section>
      <footer className="dash-footer"><span>ORANOS — FORGE YOUR STANDARD.</span><a href="/community.html">Community home ↗</a></footer>
    </main>
  );
}
