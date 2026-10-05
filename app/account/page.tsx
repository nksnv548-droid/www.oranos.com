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
  passed: "Challenge approved — Titan Pass issued separately by ORANOS",
  reattempt: "Reattempt available",
  rejected: "Application not approved",
  failed: "Challenge not passed",
};

type Challenge = {
  id: string;
  name: string;
  slug: string;
  target_value: number;
  target_unit: string;
  sort_order: number;
};

type Submission = {
  id: string;
  challenge_id: string;
  status: string;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  integrity_status: string | null;
};

type Checkin = {
  id: string;
  day_number: number;
  checkin_date: string;
  pillar_code: string;
  completed: boolean;
  reviewer_status: string;
  submitted_at: string | null;
};

type PillarProgress = {
  pillar_code: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  reviewer_notes: string | null;
};

type Declaration = {
  status: string;
  reviewer_notes: string | null;
  reviewed_at: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

function formatTarget(challenge: Challenge) {
  if (challenge.target_unit === "meters") return `${challenge.target_value} m`;
  if (challenge.target_unit === "seconds") return `${challenge.target_value} sec`;
  return `${challenge.target_value} ${challenge.target_unit}`;
}

function statusLabel(value: string | null | undefined) {
  return value?.replaceAll("_", " ") || "not submitted";
}

export default async function AccountPage() {
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
  if (!user) redirect("/sign-in");

  const { data: applications, error: applicationError } = await supabase
    .from("titan_applications")
    .select("id,status,created_at,started_at,completed_at,rules_accepted_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const application = applications?.[0] ?? null;
  const applicationId = application?.id ?? null;

  const [
    { data: profile, error: profileError },
    { data: pass, error: passError },
    { data: challengeRows, error: challengeError },
    { data: submissions, error: submissionError },
    { data: checkins, error: checkinError },
    { data: pillarRows, error: pillarError },
    { data: declaration, error: declarationError },
    { data: outcome, error: outcomeError },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("titan_passes").select("titan_id,status,earned_at,application_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("titan_challenges").select("id,name,slug,target_value,target_unit,sort_order").eq("active", true).order("sort_order"),
    applicationId
      ? supabase.from("titan_submissions").select("id,challenge_id,status,reviewer_notes,reviewed_at,created_at,integrity_status").eq("application_id", applicationId).order("created_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: [], error: null }),
    applicationId
      ? supabase.from("titan_daily_checkins").select("id,day_number,checkin_date,pillar_code,completed,reviewer_status,submitted_at").eq("application_id", applicationId).order("day_number").order("checkin_date")
      : Promise.resolve({ data: [], error: null }),
    applicationId
      ? supabase.from("titan_pillar_progress").select("pillar_code,status,started_at,completed_at,reviewer_notes").eq("application_id", applicationId).order("created_at")
      : Promise.resolve({ data: [], error: null }),
    applicationId
      ? supabase.from("titan_declarations").select("status,reviewer_notes,reviewed_at").eq("application_id", applicationId).order("created_at", { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    applicationId
      ? supabase.from("titan_outcomes").select("outcome,titan_id,reviewer_notes,finalized_at").eq("application_id", applicationId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const dataErrors = [
    profileError,
    passError,
    applicationError,
    challengeError,
    submissionError,
    checkinError,
    pillarError,
    declarationError,
    outcomeError,
  ].filter(Boolean);

  const name = String(profile?.full_name || user.user_metadata?.full_name || "Member").trim();

  const challengeMap = new Map<string, Challenge>(
    ((challengeRows || []) as Challenge[]).map((challenge) => [challenge.id, challenge]),
  );

  const latestByChallenge = new Map<string, Submission>();
  for (const row of ((submissions || []) as Submission[])) {
    if (!latestByChallenge.has(row.challenge_id)) latestByChallenge.set(row.challenge_id, row);
  }

  const challengeProgress = ((challengeRows || []) as Challenge[]).map((challenge) => ({
    challenge,
    submission: latestByChallenge.get(challenge.id) || null,
  }));

  const approvedChallenges = new Set(
    ((submissions || []) as Submission[])
      .filter((submission) => submission.status === "approved")
      .map((submission) => submission.challenge_id),
  );
  const approvedCount = approvedChallenges.size;
  const totalChallenges = (challengeRows || []).length;
  const completedDays = new Set<number>();

  for (const checkin of ((checkins || []) as Checkin[])) {
    if (!checkin.completed) continue;
    const dayRows = ((checkins || []) as Checkin[]).filter((item) => item.day_number === checkin.day_number && item.completed);
    if (new Set(dayRows.map((item) => item.pillar_code)).size >= 3) completedDays.add(checkin.day_number);
  }

  const completedDayCount = completedDays.size;
  const progressPercent = totalChallenges
    ? Math.round((approvedCount / totalChallenges) * 100)
    : 0;

  const currentPillars = (pillarRows || []) as PillarProgress[];
  const memberApplicationStatus = application ? (applicationLabels[application.status] || statusLabel(application.status)) : null;
  const outcomeValue = typeof outcome?.outcome === "string" ? outcome.outcome : null;
  const passActive = pass?.status === "active";
  const passStatus = passActive
    ? "ACTIVE"
    : pass?.status === "revoked"
      ? "REVOKED"
      : outcomeValue === "passed"
        ? "MANUAL ISSUANCE PENDING"
        : "NOT ISSUED";
  const hasDataError = dataErrors.length > 0;

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
        <p>Your standard is built in the choices you repeat. Track your progress, review your evidence status, and take the next step.</p>
        <div className="welcome-actions">
          <a className="gold-button" href="/titan-challenge">Open Titan Challenge <span>↗</span></a>
          <a className="text-link" href="/community.html">Explore community →</a><a className="text-link" href="/oternal">Meet OTERNAL →</a>
        </div>
      </section>

      <section className="member-dashboard-status-grid" aria-label="Member status">
        <article className="member-status-card">
          <span className="eyebrow">TITAN APPLICATION</span>
          <strong>{memberApplicationStatus || "Not started"}</strong>
          <p>{application ? `Started ${formatDate(application.started_at || application.created_at)}` : "Apply from the Titan Challenge page to begin."}</p>
        </article>
        <article className="member-status-card">
          <span className="eyebrow">FITNESS EVIDENCE</span>
          <strong>{approvedCount} / {totalChallenges || 5} approved</strong>
          <p>{totalChallenges ? `${progressPercent}% of the physical evidence standard` : "Challenge standards are unavailable."}</p>
        </article>
        <article className="member-status-card">
          <span className="eyebrow">SEVEN-DAY STANDARD</span>
          <strong>{completedDayCount} / 7 days</strong>
          <p>Each completed day requires the three required pillars.</p>
        </article>
        <article className="member-status-card">
          <span className="eyebrow">TITAN PASS</span>
          <strong>{passStatus}</strong>
          <p>{passActive ? `Titan ID ${pass.titan_id}` : outcomeValue === "passed" ? "Your Titan Pass is awaiting manual ORANOS issuance." : "Issuance is handled separately by ORANOS."}</p>
        </article>
      </section>

      {hasDataError && (
        <section className="dashboard-alert" role="status">
          <div className="eyebrow">MEMBER DATA</div>
          <p>Some membership records are temporarily unavailable. The dashboard is showing the data that could be loaded safely.</p>
        </section>
      )}

      <section className="section-head">
        <div>
          <div className="eyebrow">THE ORANOS STANDARD</div>
          <h2>Four pillars. One direction.</h2>
        </div>
        <span className="section-index">01 — 04</span>
      </section>
      <section className="pillar-grid">
        {pillars.map((pillar) => {
          const progress = currentPillars.find((item) => item.pillar_code.toLowerCase() === pillar.name.toLowerCase());
          return (
            <article className="pillar-card" key={pillar.name}>
              <div className="pillar-top"><span>{pillar.mark}</span><span className="pillar-symbol">↗</span></div>
              <h3>{pillar.name}</h3>
              <p>{pillar.detail}</p>
              <div className="member-pillar-state">{progress?.status ? statusLabel(progress.status) : "Not started"}</div>
            </article>
          );
        })}
      </section>

      <section className="member-dashboard-panel">
        <div className="member-dashboard-panel-head">
          <div>
            <div className="eyebrow">TITAN PROGRESS / FITNESS</div>
            <h2>Evidence <em>status.</em></h2>
          </div>
          <span className="section-index">{approvedCount} / {totalChallenges || 5}</span>
        </div>
        {!application ? (
          <div className="member-empty"><h3>No Titan attempt yet.</h3><p>Accept the Titan standard to create your first application and unlock evidence tracking.</p><a className="gold-button" href="/titan-challenge">Start Titan ↗</a></div>
        ) : challengeProgress.length === 0 ? (
          <div className="member-empty"><h3>Challenge standards unavailable.</h3><p>We could not load the active Titan tests right now. Refresh the page and try again.</p></div>
        ) : (
          <div className="member-challenge-list">
            {challengeProgress.map(({ challenge, submission }) => (
              <article className="member-challenge-row" key={challenge.id}>
                <div className="member-challenge-index">0{challenge.sort_order}</div>
                <div className="member-challenge-main">
                  <div className="eyebrow">FITNESS / {challenge.slug.toUpperCase()}</div>
                  <h3>{challenge.name}</h3>
                  <p>{formatTarget(challenge)}</p>
                </div>
                <div className="member-challenge-review">
                  <span className={`evidence-status status-${submission?.status || "not-submitted"}`}>{statusLabel(submission?.status)}</span>
                  <small>
                    {submission?.reviewed_at
                      ? `Reviewed ${formatDateTime(submission.reviewed_at)}`
                      : submission?.created_at
                        ? `Submitted ${formatDateTime(submission.created_at)}`
                        : "No evidence submitted"}
                  </small>
                  {submission?.reviewer_notes && <p>{submission.reviewer_notes}</p>}
                  {submission?.integrity_status === "suspicious" && <small className="member-warning">Integrity flagged for team review.</small>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="member-dashboard-two-col">
        <article className="member-dashboard-panel">
          <div className="member-dashboard-panel-head">
            <div>
              <div className="eyebrow">DISCIPLINE / DAYS 01 — 07</div>
              <h2>Daily <em>check-ins.</em></h2>
            </div>
            <span className="section-index">{completedDayCount} / 07</span>
          </div>
          {!application ? (
            <div className="member-empty compact"><p>Your seven-day progress will appear after you begin a Titan attempt.</p></div>
          ) : (
            <div className="member-day-grid">
              {Array.from({ length: 7 }, (_, index) => {
                const day = index + 1;
                const dayRows = ((checkins || []) as Checkin[]).filter((row) => row.day_number === day);
                const complete = completedDays.has(day);
                const accepted = dayRows.filter((row) => row.reviewer_status === "accepted").length;
                return (
                  <div className={`member-day-card ${complete ? "is-complete" : ""}`} key={day}>
                    <span>DAY {String(day).padStart(2, "0")}</span>
                    <strong>{complete ? "COMPLETE" : "OPEN"}</strong>
                    <small>{new Set(dayRows.filter((row) => row.completed).map((row) => row.pillar_code)).size} / 3 pillars</small>
                    {accepted > 0 && <small>{accepted} accepted</small>}
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="member-dashboard-panel">
          <div className="member-dashboard-panel-head">
            <div>
              <div className="eyebrow">PERSONAL DECLARATION</div>
              <h2>Your <em>commitment.</em></h2>
            </div>
            <span className="section-index">{declaration?.status ? statusLabel(declaration.status) : "NOT SUBMITTED"}</span>
          </div>
          {!application || !declaration ? (
            <div className="member-empty compact"><p>Your declaration status will appear here when it is submitted.</p></div>
          ) : (
            <div className="member-declaration-status">
              <strong>{statusLabel(declaration.status)}</strong>
              <p>{declaration.reviewer_notes || "No reviewer note has been added."}</p>
              {declaration.reviewed_at && <small>Reviewed {formatDateTime(declaration.reviewed_at)}</small>}
            </div>
          )}
        </article>
      </section>

      <section className="member-dashboard-panel">
        <div className="member-dashboard-panel-head">
          <div>
            <div className="eyebrow">SUBMISSION HISTORY</div>
            <h2>Your evidence <em>record.</em></h2>
          </div>
          <span className="section-index">{(submissions || []).length} records</span>
        </div>
        {!application || !(submissions || []).length ? (
          <div className="member-empty"><h3>No submissions yet.</h3><p>Evidence you submit through the Titan workspace will appear here with its latest review status.</p><a className="text-link" href="/titan-challenge">Go to Titan workspace →</a></div>
        ) : (
          <div className="member-history-list">
            {((submissions || []) as Submission[]).map((submission) => {
              const challenge = challengeMap.get(submission.challenge_id);
              return (
                <article className="member-history-row" key={submission.id}>
                  <div>
                    <div className="eyebrow">{challenge?.slug?.toUpperCase() || "CHALLENGE"}</div>
                    <strong>{challenge?.name || submission.challenge_id}</strong>
                    <small>Submitted {formatDateTime(submission.created_at)}</small>
                  </div>
                  <div>
                    <span className={`evidence-status status-${submission.status}`}>{statusLabel(submission.status)}</span>
                    <small>{submission.reviewed_at ? `Reviewed ${formatDateTime(submission.reviewed_at)}` : "Awaiting ORANOS review"}</small>
                    {submission.reviewer_notes && <p>{submission.reviewer_notes}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

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
                <span className="eyebrow">ISSUED {formatDate(pass.earned_at)}</span>
              </div>
            </>
          ) : (
            <>
              <h2>{pass?.status === "revoked" ? "Pass currently inactive" : "Earn your Titan Pass."}</h2>
              <p>{outcomeValue === "passed" ? "Your Titan outcome is recorded as passed. Titan Pass allocation and issuance remain a separate manual ORANOS team step." : application ? (applicationLabels[application.status] || "Your challenge record is available.") : "The Titan Pass is issued after the ORANOS Titan Challenge is reviewed and approved. Starting a challenge does not automatically grant membership."}</p>
              {application && <div className="member-status"><span className="status-dot" /> {memberApplicationStatus}</div>}
              <div className="welcome-actions"><a className="gold-button" href="/titan-challenge">{application ? "View Titan Challenge ↗" : "Explore the Titan Challenge ↗"}</a></div>
            </>
          )}
          {(passError || applicationError || outcomeError) && <p role="status">Membership details are temporarily unavailable. Please refresh later.</p>}
        </div>
        <div className="member-status"><span className="status-dot" /> {passActive ? "TITAN PASS ACTIVE" : "MEMBERSHIP NOT YET ISSUED"}</div>
      </section>

      <footer className="dash-footer"><span>ORANOS — FORGE YOUR STANDARD.</span><a href="/community.html">Community home ↗</a></footer>
    </main>
  );
}
