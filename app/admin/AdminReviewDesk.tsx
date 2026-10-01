"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = {
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

type Challenge = { id: string; name: string; slug: string; target_value: number; target_unit: string };

export default function AdminReviewDesk() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");

  const challengeMap = useMemo(() => new Map(challenges.map((c) => [c.id, c])), [challenges]);

  const load = useCallback(async () => {
    setBusy(true);
    setMessage("");
    const { data: allowed, error: authError } = await supabase.rpc("is_admin");
    if (authError || allowed !== true) {
      setMessage("Admin authorization is required.");
      setBusy(false);
      return;
    }

    const [{ data: submissionRows, error: submissionError }, { data: challengeRows }] = await Promise.all([
      supabase.from("titan_submissions").select("id,application_id,session_id,user_id,challenge_id,video_path,video_duration_seconds,gps_distance_meters,gps_elapsed_seconds,gps_route,integrity_status,integrity_signals,client_metadata,status,reviewer_notes,created_at,reviewed_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("titan_challenges").select("id,name,slug,target_value,target_unit").order("sort_order"),
    ]);
    if (submissionError) {
      setMessage(submissionError.message);
      setRows([]);
      setBusy(false);
      return;
    }
    const data = (submissionRows || []) as Row[];
    setRows(data);
    setChallenges((challengeRows || []) as Challenge[]);

    const userIds = [...new Set(data.map((r) => r.user_id))];
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", userIds);
      const nextNames: Record<string, string> = {};
      for (const profile of profiles || []) nextNames[profile.id] = profile.full_name || "Member";
      setNames(nextNames);
    }

    const urls: Record<string, string> = {};
    for (const row of data) {
      if (!row.video_path) continue;
      const { data: signed } = await supabase.storage.from("titan-videos").createSignedUrl(row.video_path, 3600);
      if (signed?.signedUrl) urls[row.id] = signed.signedUrl;
    }
    setVideoUrls(urls);
    setBusy(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const review = async (row: Row, decision: "approved" | "rejected" | "reattempt") => {
    setBusy(true);
    setMessage("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Admin session expired.");
      const reviewerNotes = notes[row.id]?.trim() || null;
      const { error: updateError } = await supabase.from("titan_submissions").update({
        status: decision,
        reviewer_notes: reviewerNotes,
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", row.id);
      if (updateError) throw updateError;

      const { error: reviewError } = await supabase.from("titan_reviews").insert({
        submission_id: row.id,
        reviewer_id: auth.user.id,
        decision,
        notes: reviewerNotes,
      });
      if (reviewError) throw reviewError;

      setMessage(`Evidence marked ${decision}. Titan Pass issuance remains a separate manual team step.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the review decision.");
      setBusy(false);
    }
  };

  if (busy && !rows.length) return <section className="admin-review"><div className="eyebrow">REVIEW QUEUE</div><h2>Loading private evidence.</h2></section>;

  return (
    <section className="admin-review">
      <div className="eyebrow">PRIVATE ADMIN / REVIEW QUEUE</div>
      <h2>Evidence <em>desk.</em></h2>
      <p className="titan-copy">Only authenticated ORANOS admins can review this queue. Approving an individual submission does not issue a Titan Pass or generate a Titan ID.</p>
      {message && <p className="titan-workspace-message" role="status">{message}</p>}
      <div className="admin-review-list">
        {rows.length === 0 ? <article className="admin-empty"><h3>No submissions yet.</h3><p>Once a member uploads evidence, it will appear here.</p></article> : rows.map((row) => {
          const challenge = challengeMap.get(row.challenge_id);
          const isRun = challenge?.slug === "run_2k";
          const signalText = JSON.stringify(row.integrity_signals || {});
          return (
            <article className="admin-review-card" key={row.id}>
              <div className="admin-review-head">
                <div><div className="eyebrow">{challenge?.slug?.toUpperCase() || "CHALLENGE"}</div><h3>{names[row.user_id] || "Member"}</h3></div>
                <span className={`evidence-status status-${row.status}`}>{row.status.replaceAll("_", " ")}</span>
              </div>
              <div className="admin-meta-grid">
                <div><span>CHALLENGE</span><strong>{challenge?.name || row.challenge_id}</strong></div>
                <div><span>SUBMITTED</span><strong>{new Date(row.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</strong></div>
                {isRun ? (
                  <>
                    <div><span>GPS DISTANCE</span><strong>{Math.round(row.gps_distance_meters || 0)} m</strong></div>
                    <div><span>GPS TIME</span><strong>{formatSeconds(row.gps_elapsed_seconds || 0)}</strong></div>
                    <div><span>ROUTE POINTS</span><strong>{row.gps_route?.length || 0}</strong></div>
                    <div><span>INTEGRITY</span><strong>{row.integrity_status || "—"}</strong></div>
                  </>
                ) : (
                  <>
                    <div><span>VIDEO</span><strong>{row.video_duration_seconds ? `${row.video_duration_seconds.toFixed(1)} sec` : "Uploaded"}</strong></div>
                    <div><span>INTEGRITY</span><strong>{row.integrity_status || "—"}</strong></div>
                  </>
                )}
              </div>
              {videoUrls[row.id] && <video className="admin-evidence-video" controls preload="metadata" src={videoUrls[row.id]} />}
              {isRun && <details className="admin-gps-details"><summary>Inspect GPS evidence</summary><pre>{JSON.stringify({ distance_meters: row.gps_distance_meters, elapsed_seconds: row.gps_elapsed_seconds, route_points: row.gps_route?.length || 0, integrity: row.integrity_signals }, null, 2)}</pre></details>}
              <details className="admin-gps-details"><summary>Inspect submission metadata</summary><pre>{signalText}</pre></details>
              <textarea value={notes[row.id] ?? row.reviewer_notes ?? ""} onChange={(e) => setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))} placeholder="Reviewer notes (recommended)" rows={3} />
              <div className="admin-review-actions">
                <button className="review-approve" type="button" disabled={busy} onClick={() => void review(row, "approved")}>Approve evidence</button>
                <button className="review-retry" type="button" disabled={busy} onClick={() => void review(row, "reattempt")}>Request reattempt</button>
                <button className="review-reject" type="button" disabled={busy} onClick={() => void review(row, "rejected")}>Reject evidence</button>
              </div>
              <p className="titan-note">Decision applies to this evidence item only. Final Titan result and Titan Pass issuance are handled separately by ORANOS.</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatSeconds(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
