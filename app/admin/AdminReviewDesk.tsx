"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Application = {
  id: string;
  user_id: string;
  status: string;
  rules_accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  timezone: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  city: string | null;
  role: string;
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
  application_id: string | null;
  session_id: string;
  user_id: string;
  challenge_id: string;
  video_path: string | null;
  video_duration_seconds: number | null;
  gps_distance_meters: number | null;
  gps_elapsed_seconds: number | null;
  gps_route: Array<Record<string, unknown>> | null;
  integrity_status: string | null;
  integrity_signals: Record<string, unknown>;
  client_metadata: Record<string, unknown>;
  status: string;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

type Checkin = {
  id: string;
  application_id: string | null;
  user_id: string;
  day_number: number;
  checkin_date: string;
  pillar_code: string;
  completed: boolean;
  evidence: Record<string, unknown>;
  integrity_signals: Record<string, unknown>;
  notes: string | null;
  reviewer_status: string;
  submitted_at: string | null;
};

type Declaration = {
  id: string;
  application_id: string | null;
  user_id: string;
  question: string;
  video_path: string | null;
  transcript: string | null;
  integrity_status: string;
  integrity_signals: Record<string, unknown>;
  status: string;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type Outcome = {
  id: string;
  application_id: string;
  user_id: string;
  outcome: string;
  titan_id: string | null;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  cleanup_status: string;
  finalized_at: string;
  finalized_by: string | null;
};

type Pass = {
  id: string;
  application_id: string | null;
  user_id: string;
  titan_id: string;
  earned_at: string;
  status: string;
};

type Readiness = Record<string, unknown>;

const STATUS_OPTIONS = [
  "all",
  "in_progress",
  "submitted",
  "under_review",
  "reattempt",
  "passed",
  "failed",
  "rejected",
] as const;

export default function AdminReviewDesk() {
  const supabase = useMemo(() => createClient(), []);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [readinessBusy, setReadinessBusy] = useState(false);

  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  );
  const challengeMap = useMemo(
    () => new Map(challenges.map((challenge) => [challenge.id, challenge])),
    [challenges],
  );
  const applicationMap = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications],
  );
  const outcomeMap = useMemo(
    () => new Map(outcomes.map((outcome) => [outcome.application_id, outcome])),
    [outcomes],
  );
  const passMap = useMemo(
    () => new Map(passes.map((pass) => [pass.application_id || "", pass])),
    [passes],
  );

  const selectedApplication = selectedApplicationId
    ? applicationMap.get(selectedApplicationId) ?? null
    : null;

  const filteredApplications = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return applications.filter((application) => {
      if (statusFilter !== "all" && application.status !== statusFilter) return false;
      if (!needle) return true;
      const profile = profileMap.get(application.user_id);
      const haystack = [
        profile?.full_name || "",
        profile?.city || "",
        application.id,
        application.user_id,
      ].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [applications, profileMap, search, statusFilter]);

  const queueRows = useMemo(() => {
    const selected = selectedApplicationId
      ? submissions.filter((row) => row.application_id === selectedApplicationId)
      : submissions;
    return selected
      .filter((row) => row.status === "under_review" || row.status === "reattempt")
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [selectedApplicationId, submissions]);

  const selectedCheckins = useMemo(
    () => selectedApplicationId
      ? checkins
        .filter((row) => row.application_id === selectedApplicationId)
        .sort((a, b) => a.day_number - b.day_number || a.pillar_code.localeCompare(b.pillar_code))
      : [],
    [checkins, selectedApplicationId],
  );

  const selectedDeclaration = useMemo(
    () => selectedApplicationId
      ? declarations.find((row) => row.application_id === selectedApplicationId) ?? null
      : null,
    [declarations, selectedApplicationId],
  );

  const selectedSubmissions = useMemo(
    () => selectedApplicationId
      ? submissions.filter((row) => row.application_id === selectedApplicationId)
      : [],
    [selectedApplicationId, submissions],
  );

  const stats = useMemo(() => {
    const reviewCount = submissions.filter((row) => row.status === "under_review").length;
    const activeCount = applications.filter((row) =>
      ["in_progress", "submitted", "under_review", "reattempt"].includes(row.status),
    ).length;
    const passedCount = applications.filter((row) => row.status === "passed").length;
    return {
      total: applications.length,
      active: activeCount,
      review: reviewCount,
      passed: passedCount,
    };
  }, [applications, submissions]);

  const load = useCallback(async () => {
    setBusy(true);
    setMessage("");

    const { data: allowed, error: authError } = await supabase.rpc("is_admin");
    if (authError || allowed !== true) {
      setMessage("Admin authorization is required.");
      setBusy(false);
      return;
    }

    const [
      applicationsResult,
      profilesResult,
      challengesResult,
      submissionsResult,
      checkinsResult,
      declarationsResult,
      outcomesResult,
      passesResult,
    ] = await Promise.all([
      supabase
        .from("titan_applications")
        .select("id,user_id,status,rules_accepted_at,started_at,completed_at,created_at,timezone")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("profiles")
        .select("id,full_name,city,role")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("titan_challenges")
        .select("id,name,slug,target_value,target_unit,sort_order")
        .order("sort_order"),
      supabase
        .from("titan_submissions")
        .select("id,application_id,session_id,user_id,challenge_id,video_path,video_duration_seconds,gps_distance_meters,gps_elapsed_seconds,gps_route,integrity_status,integrity_signals,client_metadata,status,reviewer_notes,created_at,reviewed_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("titan_daily_checkins")
        .select("id,application_id,user_id,day_number,checkin_date,pillar_code,completed,evidence,integrity_signals,notes,reviewer_status,submitted_at")
        .order("day_number"),
      supabase
        .from("titan_declarations")
        .select("id,application_id,user_id,question,video_path,transcript,integrity_status,integrity_signals,status,reviewer_notes,reviewed_by,reviewed_at,created_at")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("titan_outcomes")
        .select("id,application_id,user_id,outcome,titan_id,reviewer_id,reviewer_notes,cleanup_status,finalized_at,finalized_by")
        .order("finalized_at", { ascending: false })
        .limit(300),
      supabase
        .from("titan_passes")
        .select("id,application_id,user_id,titan_id,earned_at,status")
        .order("earned_at", { ascending: false })
        .limit(300),
    ]);

    const errors = [
      applicationsResult.error,
      profilesResult.error,
      challengesResult.error,
      submissionsResult.error,
      checkinsResult.error,
      declarationsResult.error,
      outcomesResult.error,
      passesResult.error,
    ].filter(Boolean);

    if (errors.length) {
      setMessage(errors.map((error) => error?.message || "Unknown admin data error").join(" | "));
      setBusy(false);
      return;
    }

    const nextApplications = (applicationsResult.data || []) as Application[];
    const nextProfiles = (profilesResult.data || []) as Profile[];
    const nextChallenges = (challengesResult.data || []) as Challenge[];
    const nextSubmissions = (submissionsResult.data || []) as Submission[];

    setApplications(nextApplications);
    setProfiles(nextProfiles);
    setChallenges(nextChallenges);
    setSubmissions(nextSubmissions);
    setCheckins((checkinsResult.data || []) as Checkin[]);
    setDeclarations((declarationsResult.data || []) as Declaration[]);
    setOutcomes((outcomesResult.data || []) as Outcome[]);
    setPasses((passesResult.data || []) as Pass[]);

    if (!selectedApplicationId && nextApplications[0]) {
      setSelectedApplicationId(nextApplications[0].id);
    } else if (selectedApplicationId && !nextApplications.some((row) => row.id === selectedApplicationId)) {
      setSelectedApplicationId(nextApplications[0]?.id || null);
    }

    const urls: Record<string, string> = {};
    for (const row of nextSubmissions) {
      if (!row.video_path) continue;
      const { data: signed } = await supabase.storage
        .from("titan-videos")
        .createSignedUrl(row.video_path, 3600);
      if (signed?.signedUrl) urls[row.id] = signed.signedUrl;
    }
    setVideoUrls(urls);
    setBusy(false);
  }, [selectedApplicationId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setReadiness(null);
  }, [selectedApplicationId]);

  const reviewSubmission = async (
    row: Submission,
    decision: "approved" | "reattempt" | "rejected",
  ) => {
    setActionKey(`submission:${row.id}:${decision}`);
    setMessage("");
    try {
      const reviewerNotes = notes[row.id]?.trim() || row.reviewer_notes || null;
      const { error } = await supabase.rpc("titan_review_submission", {
        p_submission_id: row.id,
        p_decision: decision,
        p_reviewer_notes: reviewerNotes,
      });
      if (error) throw error;
      setMessage(`Evidence marked ${decision}. Final Titan outcome and Titan Pass issuance remain separate.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the evidence decision.");
    } finally {
      setActionKey(null);
    }
  };

  const reviewDeclaration = async (
    row: Declaration,
    decision: "approved" | "reattempt" | "rejected",
  ) => {
    setActionKey(`declaration:${row.id}:${decision}`);
    setMessage("");
    try {
      const reviewerNotes = notes[row.id]?.trim() || row.reviewer_notes || null;
      const { error } = await supabase
        .from("titan_declarations")
        .update({
          status: decision,
          reviewer_notes: reviewerNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;
      setMessage(`Declaration marked ${decision}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the declaration decision.");
    } finally {
      setActionKey(null);
    }
  };

  const reviewCheckin = async (row: Checkin, decision: "accepted" | "flagged" | "rejected") => {
    setActionKey(`checkin:${row.id}:${decision}`);
    setMessage("");
    try {
      const { error } = await supabase
        .from("titan_daily_checkins")
        .update({ reviewer_status: decision })
        .eq("id", row.id);
      if (error) throw error;
      setMessage(`Day ${row.day_number} / ${row.pillar_code} check-in marked ${decision}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the check-in review.");
    } finally {
      setActionKey(null);
    }
  };

  const loadReadiness = async () => {
    if (!selectedApplicationId) return;
    setReadinessBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.rpc("titan_validate_completion", {
        p_application_id: selectedApplicationId,
      });
      if (error) throw error;
      setReadiness((data || null) as Readiness | null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not validate Titan completion.");
      setReadiness(null);
    } finally {
      setReadinessBusy(false);
    }
  };

  const finalizeOutcome = async (outcome: "passed" | "failed") => {
    if (!selectedApplicationId) return;
    const confirmation = window.confirm(
      outcome === "passed"
        ? "Finalize this application as PASSED? Titan Pass issuance remains a separate manual step."
        : "Finalize this application as FAILED? This is a final administrative outcome.",
    );
    if (!confirmation) return;

    setActionKey(`outcome:${selectedApplicationId}:${outcome}`);
    setMessage("");
    try {
      const reviewerNotes = notes[`outcome:${selectedApplicationId}`]?.trim() || null;
      const { data, error } = await supabase.rpc("titan_finalize_outcome", {
        p_application_id: selectedApplicationId,
        p_outcome: outcome,
        p_reviewer_notes: reviewerNotes,
      });
      if (error) throw error;
      setMessage(
        outcome === "passed"
          ? `Application finalized as passed. ${formatOutcomeMessage(data)} Titan Pass must be issued manually by the ORANOS team.`
          : "Application finalized as failed.",
      );
      await load();
      await loadReadiness();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not finalize the Titan outcome.");
    } finally {
      setActionKey(null);
    }
  };

  if (busy && !applications.length) {
    return (
      <section className="admin-review">
        <div className="eyebrow">PRIVATE ADMIN / TITAN CONTROL</div>
        <h2>Loading the <em>command desk.</em></h2>
        <p className="titan-copy">Preparing member lookup, evidence review, challenge readiness and final outcome controls.</p>
      </section>
    );
  }

  return (
    <section className="admin-review">
      <div className="eyebrow">PRIVATE ADMIN / TITAN CONTROL</div>
      <div className="admin-review-title-row">
        <div>
          <h2>Titan <em>command desk.</em></h2>
          <p className="titan-copy">Review members, inspect evidence, validate the seven-day standard and finalize outcomes. Titan Pass issuance is always a separate manual ORANOS step.</p>
        </div>
        <div className="admin-live-badge"><span /> ADMIN WRITE ACCESS</div>
      </div>

      {message && <p className="titan-workspace-message" role="status" aria-live="polite">{message}</p>}

      <div className="admin-stat-grid">
        <Stat label="MEMBERS / ATTEMPTS" value={stats.total} />
        <Stat label="ACTIVE" value={stats.active} />
        <Stat label="EVIDENCE QUEUE" value={stats.review} />
        <Stat label="PASSED" value={stats.passed} />
      </div>

      <div className="admin-command-grid">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <div className="eyebrow">01 / MEMBER LOOKUP</div>
              <h3>Find the <em>member.</em></h3>
            </div>
            <span>{filteredApplications.length} shown</span>
          </div>

          <div className="admin-filter-bar">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, city, user ID or application ID"
              aria-label="Search members"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])}
              aria-label="Filter applications by status"
            >
              {STATUS_OPTIONS.map((status) => (
                <option value={status} key={status}>{status.replaceAll("_", " ").toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="admin-member-list">
            {filteredApplications.length === 0 ? (
              <div className="admin-empty"><h3>No matching member.</h3><p>Adjust the search or status filter.</p></div>
            ) : filteredApplications.map((application) => {
              const profile = profileMap.get(application.user_id);
              const isSelected = application.id === selectedApplicationId;
              const appOutcome = outcomeMap.get(application.id);
              const appPass = passMap.get(application.id);
              return (
                <button
                  type="button"
                  key={application.id}
                  className={isSelected ? "admin-member-row selected" : "admin-member-row"}
                  onClick={() => setSelectedApplicationId(application.id)}
                >
                  <span className="admin-member-mark">{initials(profile?.full_name || "Member")}</span>
                  <span className="admin-member-main">
                    <strong>{profile?.full_name || "Member"}</strong>
                    <small>{profile?.city || "City not supplied"} · {application.id.slice(0, 8)}…</small>
                  </span>
                  <span className="admin-member-status">
                    <StatusBadge value={application.status} />
                    {appPass?.titan_id && <small>{appPass.titan_id}</small>}
                    {!appPass && appOutcome?.titan_id && <small>Outcome ID {appOutcome.titan_id}</small>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="admin-panel admin-member-detail">
          {!selectedApplication ? (
            <div className="admin-empty">
              <div className="eyebrow">02 / MEMBER DETAIL</div>
              <h3>Select a member.</h3>
              <p>Member profile, challenge state and review history will appear here.</p>
            </div>
          ) : (
            <>
              {(() => {
                const profile = profileMap.get(selectedApplication.user_id);
                const approvedEvidence = selectedSubmissions.filter((row) => row.status === "approved").length;
                const completeDays = new Set(
                  selectedCheckins
                    .filter((row) => row.completed && ["submitted", "accepted"].includes(row.reviewer_status))
                    .map((row) => row.day_number),
                ).size;
                const declarationReady = selectedDeclaration?.status === "approved";
                const manualPass = passMap.get(selectedApplication.id);
                return (
                  <>
                    <div className="admin-panel-head">
                      <div>
                        <div className="eyebrow">02 / MEMBER DETAIL</div>
                        <h3>{profile?.full_name || "Member"} <em>profile.</em></h3>
                      </div>
                      <StatusBadge value={selectedApplication.status} />
                    </div>

                    <div className="admin-profile-grid">
                      <Info label="CITY" value={profile?.city || "—"} />
                      <Info label="ROLE" value={profile?.role || "user"} />
                      <Info label="APPLICATION" value={selectedApplication.id} mono />
                      <Info label="STARTED" value={formatDateTime(selectedApplication.started_at || selectedApplication.created_at)} />
                    </div>

                    <div className="admin-readiness-strip">
                      <ReadinessItem label="EVIDENCE" value={`${approvedEvidence}/5 approved`} ok={approvedEvidence >= 5} />
                      <ReadinessItem label="7-DAY STANDARD" value={`${completeDays}/7 days`} ok={completeDays >= 7} />
                      <ReadinessItem label="DECLARATION" value={declarationReady ? "APPROVED" : statusLabel(selectedDeclaration?.status)} ok={declarationReady} />
                      <ReadinessItem label="TITAN PASS" value={manualPass?.titan_id || "MANUAL ISSUANCE"} ok={Boolean(manualPass?.titan_id)} />
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </section>
      </div>

      {selectedApplication && (
        <>
          <section className="admin-panel admin-review-panel">
            <div className="admin-panel-head">
              <div>
                <div className="eyebrow">03 / EVIDENCE REVIEW</div>
                <h3>Review <em>proof.</em></h3>
              </div>
              <span>{queueRows.length} pending / reattempt items</span>
            </div>

            {queueRows.length === 0 ? (
              <div className="admin-empty compact">
                <h3>No pending evidence for this member.</h3>
                <p>Approved, rejected and completed evidence remains in the member history below.</p>
              </div>
            ) : (
              <div className="admin-review-list">
                {queueRows.map((row) => {
                  const challenge = challengeMap.get(row.challenge_id);
                  const isRun = challenge?.slug === "run_2k";
                  return (
                    <article className="admin-review-card" key={row.id}>
                      <div className="admin-review-head">
                        <div>
                          <div className="eyebrow">{challenge?.slug?.toUpperCase() || "CHALLENGE"}</div>
                          <h3>{challenge?.name || row.challenge_id}</h3>
                        </div>
                        <StatusBadge value={row.status} />
                      </div>

                      <div className="admin-meta-grid">
                        <Info label="SUBMITTED" value={formatDateTime(row.created_at)} />
                        <Info label="INTEGRITY" value={row.integrity_status || "—"} />
                        {isRun ? (
                          <>
                            <Info label="GPS DISTANCE" value={`${Math.round(row.gps_distance_meters || 0)} m`} />
                            <Info label="GPS TIME" value={formatSeconds(row.gps_elapsed_seconds || 0)} />
                            <Info label="ROUTE POINTS" value={String(row.gps_route?.length || 0)} />
                          </>
                        ) : (
                          <Info label="VIDEO" value={row.video_duration_seconds ? `${row.video_duration_seconds.toFixed(1)} sec` : "Uploaded"} />
                        )}
                      </div>

                      {videoUrls[row.id] && (
                        <video
                          className="admin-evidence-video"
                          controls
                          preload="metadata"
                          src={videoUrls[row.id]}
                        />
                      )}

                      {isRun && (
                        <details className="admin-gps-details">
                          <summary>Inspect GPS evidence</summary>
                          <pre>{JSON.stringify({
                            distance_meters: row.gps_distance_meters,
                            elapsed_seconds: row.gps_elapsed_seconds,
                            route_points: row.gps_route?.length || 0,
                            integrity: row.integrity_signals,
                          }, null, 2)}</pre>
                        </details>
                      )}

                      <details className="admin-gps-details">
                        <summary>Inspect submission metadata</summary>
                        <pre>{JSON.stringify({
                          integrity_signals: row.integrity_signals,
                          client_metadata: row.client_metadata,
                          challenge_target: challenge
                            ? { value: challenge.target_value, unit: challenge.target_unit }
                            : null,
                        }, null, 2)}</pre>
                      </details>

                      <textarea
                        value={notes[row.id] ?? row.reviewer_notes ?? ""}
                        onChange={(event) => setNotes((prev) => ({ ...prev, [row.id]: event.target.value }))}
                        placeholder="Reviewer notes"
                        rows={3}
                      />

                      <div className="admin-review-actions">
                        <button
                          className="review-approve"
                          type="button"
                          disabled={Boolean(actionKey)}
                          onClick={() => void reviewSubmission(row, "approved")}
                        >
                          Approve evidence
                        </button>
                        <button
                          className="review-retry"
                          type="button"
                          disabled={Boolean(actionKey)}
                          onClick={() => void reviewSubmission(row, "reattempt")}
                        >
                          Request reattempt
                        </button>
                        <button
                          className="review-reject"
                          type="button"
                          disabled={Boolean(actionKey)}
                          onClick={() => void reviewSubmission(row, "rejected")}
                        >
                          Reject evidence
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="admin-two-panel-grid">
            <section className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <div className="eyebrow">04 / DECLARATION REVIEW</div>
                  <h3>Review the <em>pledge.</em></h3>
                </div>
                <StatusBadge value={selectedDeclaration?.status || "not submitted"} />
              </div>

              {!selectedDeclaration ? (
                <div className="admin-empty compact">
                  <h3>No declaration found.</h3>
                  <p>The member has not submitted the final declaration yet.</p>
                </div>
              ) : (
                <>
                  <p className="admin-declaration-question">{selectedDeclaration.question}</p>
                  {selectedDeclaration.transcript && (
                    <details className="admin-gps-details">
                      <summary>Inspect transcript</summary>
                      <pre>{selectedDeclaration.transcript}</pre>
                    </details>
                  )}
                  <details className="admin-gps-details">
                    <summary>Inspect declaration integrity</summary>
                    <pre>{JSON.stringify(selectedDeclaration.integrity_signals || {}, null, 2)}</pre>
                  </details>
                  <textarea
                    value={notes[selectedDeclaration.id] ?? selectedDeclaration.reviewer_notes ?? ""}
                    onChange={(event) => setNotes((prev) => ({ ...prev, [selectedDeclaration.id]: event.target.value }))}
                    placeholder="Declaration reviewer notes"
                    rows={3}
                  />
                  <div className="admin-review-actions">
                    <button
                      className="review-approve"
                      type="button"
                      disabled={Boolean(actionKey)}
                      onClick={() => void reviewDeclaration(selectedDeclaration, "approved")}
                    >
                      Approve declaration
                    </button>
                    <button
                      className="review-retry"
                      type="button"
                      disabled={Boolean(actionKey)}
                      onClick={() => void reviewDeclaration(selectedDeclaration, "reattempt")}
                    >
                      Request reattempt
                    </button>
                    <button
                      className="review-reject"
                      type="button"
                      disabled={Boolean(actionKey)}
                      onClick={() => void reviewDeclaration(selectedDeclaration, "rejected")}
                    >
                      Reject declaration
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <div className="eyebrow">05 / SEVEN-DAY REVIEW</div>
                  <h3>Check-in <em>record.</em></h3>
                </div>
                <span>{new Set(selectedCheckins.map((row) => row.day_number)).size}/7 days</span>
              </div>

              {selectedCheckins.length === 0 ? (
                <div className="admin-empty compact">
                  <h3>No check-ins yet.</h3>
                  <p>The seven-day discipline record will appear here.</p>
                </div>
              ) : (
                <div className="admin-checkin-list">
                  {selectedCheckins.map((row) => (
                    <div className="admin-checkin-row" key={row.id}>
                      <div>
                        <strong>DAY {String(row.day_number).padStart(2, "0")} / {row.pillar_code}</strong>
                        <small>{row.checkin_date} · {row.completed ? "Completed" : "Not completed"}</small>
                      </div>
                      <div className="admin-checkin-actions">
                        <span className={`checkin-review-status review-${row.reviewer_status}`}>{row.reviewer_status}</span>
                        <button
                          type="button"
                          onClick={() => void reviewCheckin(row, "accepted")}
                          disabled={Boolean(actionKey)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => void reviewCheckin(row, "flagged")}
                          disabled={Boolean(actionKey)}
                        >
                          Flag
                        </button>
                        <button
                          type="button"
                          onClick={() => void reviewCheckin(row, "rejected")}
                          disabled={Boolean(actionKey)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>

          <section className="admin-panel admin-final-panel">
            <div className="admin-panel-head">
              <div>
                <div className="eyebrow">06 / FINAL OUTCOME</div>
                <h3>Make the <em>final call.</em></h3>
              </div>
              <span>{outcomeMap.get(selectedApplication.id)?.outcome || "NOT FINALIZED"}</span>
            </div>

            <div className="admin-readiness-box">
              <div>
                <p className="admin-readiness-label">SERVER VALIDATION</p>
                <strong>{readiness ? readinessLabel(readiness) : "Run completion validation before finalizing."}</strong>
                <small>Validation uses the database-side completion rule. This view does not create a Titan Pass.</small>
              </div>
              <button
                className="admin-validate-button"
                type="button"
                disabled={readinessBusy}
                onClick={() => void loadReadiness()}
              >
                {readinessBusy ? "Validating…" : "Validate completion"}
              </button>
            </div>

            {readiness && (
              <div className="admin-criteria-grid">
                <Criteria label="Approved evidence" value={readinessNumber(readiness, "fitness_approved", "fitness", 0) + "/5"} ok={readinessNumber(readiness, "fitness_approved", "fitness", 0) >= 5} />
                <Criteria label="Seven-day standard" value={readinessValue(readiness, "seven_days", "days_required")} ok={readinessReadyDays(readiness)} />
                <Criteria label="Declaration" value={Boolean(readiness.declaration) ? "APPROVED" : "NOT APPROVED"} ok={Boolean(readiness.declaration)} />
                <Criteria label="Ready" value={Boolean(readiness.ready) ? "YES" : "NO"} ok={Boolean(readiness.ready)} />
              </div>
            )}

            <textarea
              value={notes[`outcome:${selectedApplication.id}`] ?? ""}
              onChange={(event) => setNotes((prev) => ({ ...prev, [`outcome:${selectedApplication.id}`]: event.target.value }))}
              placeholder="Final outcome notes"
              rows={4}
            />

            <div className="admin-final-actions">
              <button
                className="review-approve"
                type="button"
                disabled={Boolean(actionKey) || Boolean(outcomeMap.get(selectedApplication.id)) || !readiness?.ready}
                onClick={() => void finalizeOutcome("passed")}
              >
                Finalize as PASSED
              </button>
              <button
                className="review-reject"
                type="button"
                disabled={Boolean(actionKey) || Boolean(outcomeMap.get(selectedApplication.id))}
                onClick={() => void finalizeOutcome("failed")}
              >
                Finalize as FAILED
              </button>
            </div>

            <p className="titan-note">A passed outcome does not issue a Titan Pass automatically. Phase 07 will handle the separate manual Titan Pass identity workflow.</p>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <div className="eyebrow">07 / MEMBER HISTORY</div>
                <h3>Full review <em>history.</em></h3>
              </div>
              <span>{selectedSubmissions.length} evidence records</span>
            </div>

            <div className="admin-history-list">
              {selectedSubmissions.length === 0 ? (
                <div className="admin-empty compact"><h3>No evidence history yet.</h3></div>
              ) : selectedSubmissions.map((row) => {
                const challenge = challengeMap.get(row.challenge_id);
                return (
                  <div className="admin-history-row" key={row.id}>
                    <div>
                      <span className="eyebrow">{challenge?.slug?.toUpperCase() || "CHALLENGE"}</span>
                      <strong>{challenge?.name || row.challenge_id}</strong>
                      <small>{formatDateTime(row.created_at)}</small>
                    </div>
                    <StatusBadge value={row.status} />
                    <p>{row.reviewer_notes || "No reviewer notes."}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="admin-info">
      <span>{label}</span>
      <strong className={mono ? "mono" : ""}>{value}</strong>
    </div>
  );
}

function ReadinessItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={ok ? "admin-readiness-item ok" : "admin-readiness-item"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Criteria({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={ok ? "admin-criteria ok" : "admin-criteria"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`evidence-status status-${value.replaceAll(" ", "_")}`}>{statusLabel(value)}</span>;
}

function statusLabel(value: string | null | undefined) {
  return value?.replaceAll("_", " ") || "not submitted";
}

function readinessNumber(
  data: Readiness,
  primary: string,
  fallback: string,
  defaultValue: number,
) {
  const value = data[primary] ?? data[fallback] ?? defaultValue;
  return typeof value === "number" ? value : Number(value) || defaultValue;
}

function readinessReadyDays(data: Readiness) {
  if (typeof data.ready === "boolean" && data.ready) return readinessNumber(data, "seven_days", "days_required", 0) >= 7;
  const value = data.seven_days ?? data.days_required ?? 0;
  if (typeof value === "boolean") return value;
  return Number(value) >= 7;
}

function readinessValue(data: Readiness, primary: string, fallback: string) {
  const primaryValue = data[primary];
  if (typeof primaryValue === "boolean") return primaryValue ? "7/7" : "NOT READY";
  if (typeof primaryValue === "number") return `${primaryValue}/7`;
  if (typeof primaryValue === "string") return primaryValue;
  return `${String(data[fallback] ?? 0)}/7`;
}

function readinessLabel(data: Readiness) {
  if (typeof data.ready === "boolean") return data.ready ? "PASS CRITERIA SATISFIED" : "PASS CRITERIA NOT SATISFIED";
  return "Validation response received.";
}

function formatOutcomeMessage(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  if (record.manual_issuance_required === true) return "Manual issuance required.";
  if (typeof record.titan_pass_issued === "boolean") return record.titan_pass_issued ? "Pass was issued by the backend." : "No pass issued.";
  return "";
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "M";
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

function formatSeconds(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
