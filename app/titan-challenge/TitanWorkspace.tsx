"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Challenge = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  target_value: number;
  target_unit: string;
  max_time_seconds: number | null;
  sort_order: number;
};

type Submission = {
  id: string;
  challenge_id: string;
  session_id: string;
  video_path: string | null;
  video_duration_seconds: number | null;
  client_rep_count: number | null;
  system_rep_count: number | null;
  hold_seconds: number | null;
  gps_distance_meters: number | null;
  gps_elapsed_seconds: number | null;
  integrity_status: string | null;
  integrity_signals: Record<string, unknown>;
  status: string;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

type Point = { latitude: number; longitude: number; accuracy: number | null; timestamp: number };

function haversine(a: Point, b: Point) {
  const r = 6371000;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(x)));
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function TitanWorkspace() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string>("in_progress");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<Record<string, File | null>>({});
  const [recording, setRecording] = useState<string | null>(null);
  const [gpsRunning, setGpsRunning] = useState(false);
  const [gpsDistance, setGpsDistance] = useState(0);
  const [gpsElapsed, setGpsElapsed] = useState(0);
  const [gpsStatus, setGpsStatus] = useState("");
  const [gpsPoints, setGpsPoints] = useState<Point[]>([]);
  const [gpsSignals, setGpsSignals] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const gpsWatchRef = useRef<number | null>(null);
  const gpsTimerRef = useRef<number | null>(null);
  const gpsStartedAtRef = useRef<number | null>(null);
  const gpsPointsRef = useRef<Point[]>([]);

  const latestByChallenge = useMemo(() => {
    const map = new Map<string, Submission>();
    for (const row of submissions) {
      const prior = map.get(row.challenge_id);
      if (!prior || new Date(row.created_at).getTime() > new Date(prior.created_at).getTime()) map.set(row.challenge_id, row);
    }
    return map;
  }, [submissions]);

  const load = useCallback(async () => {
    setBusy(true);
    setMessage("");
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setMessage("Sign in is required before starting the Titan Challenge.");
      setBusy(false);
      return;
    }
    setUserId(user.id);

    const { data: app, error: appError } = await supabase
      .from("titan_applications")
      .select("id,status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appError) {
      setMessage(appError.message);
      setBusy(false);
      return;
    }
    if (!app) {
      setMessage("Accept the Titan Challenge standard above before starting your submissions.");
      setBusy(false);
      return;
    }

    setApplicationId(app.id);
    setApplicationStatus(app.status);

    const [{ data: challengeRows, error: challengeError }, { data: submissionRows, error: submissionError }] = await Promise.all([
      supabase.from("titan_challenges").select("id,slug,name,description,target_value,target_unit,max_time_seconds,sort_order").eq("active", true).order("sort_order"),
      supabase.from("titan_submissions")
        .select("id,challenge_id,session_id,video_path,video_duration_seconds,client_rep_count,system_rep_count,hold_seconds,gps_distance_meters,gps_elapsed_seconds,integrity_status,integrity_signals,status,reviewer_notes,created_at,reviewed_at")
        .eq("application_id", app.id)
        .order("created_at", { ascending: false }),
    ]);

    if (challengeError) setMessage(challengeError.message);
    if (submissionError) setMessage(submissionError.message);
    setChallenges((challengeRows || []) as Challenge[]);
    setSubmissions((submissionRows || []) as Submission[]);
    setBusy(false);
  }, [supabase]);

  useEffect(() => {
    void load();
    return () => {
      if (gpsWatchRef.current !== null) navigator.geolocation?.clearWatch(gpsWatchRef.current);
      if (gpsTimerRef.current !== null) window.clearInterval(gpsTimerRef.current);
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [load]);

  const startRecording = async (challenge: Challenge) => {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("This browser does not support camera recording. Use the upload field below.");
      return;
    }
    if (!window.MediaRecorder) {
      setMessage("This browser does not support in-page recording. Use the upload field below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || "video/webm" });
        const file = new File([blob], `${challenge.slug}-${Date.now()}.webm`, { type: blob.type });
        setSelectedFile((prev) => ({ ...prev, [challenge.id]: file }));
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setRecording(null);
      };
      recorder.start(500);
      setRecording(challenge.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Camera permission was not granted.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const submitVideo = async (challenge: Challenge) => {
    if (!applicationId || !userId) return;
    const file = selectedFile[challenge.id];
    if (!file) {
      setMessage("Record a video or choose a video file first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { data: session, error: sessionError } = await supabase
        .from("titan_sessions")
        .insert({
          application_id: applicationId,
          user_id: userId,
          challenge_id: challenge.id,
          challenge_code: challenge.slug,
          status: "active",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (sessionError || !session) throw sessionError || new Error("Could not create challenge session.");

      const path = `${userId}/${applicationId}/${session.id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("titan-videos").upload(path, file, {
        contentType: file.type || "video/webm",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: mediaMeta } = await new Promise<{ data: { duration: number | null } }>((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          resolve({ data: { duration: Number.isFinite(video.duration) ? video.duration : null } });
        };
        video.onerror = () => resolve({ data: { duration: null } });
        video.src = URL.createObjectURL(file);
      });

      const payload: Record<string, unknown> = {
        session_id: session.id,
        user_id: userId,
        challenge_id: challenge.id,
        application_id: applicationId,
        video_path: path,
        video_duration_seconds: mediaMeta.duration,
        integrity_status: "review",
        integrity_signals: {
          source: "member_camera_or_upload",
          submitted_at_client: new Date().toISOString(),
          file_type: file.type,
          file_size_bytes: file.size,
        },
        client_metadata: {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
          recorded_in_browser: file.name.endsWith(".webm"),
        },
        status: "under_review",
      };

      const { error: submissionError } = await supabase.from("titan_submissions").insert(payload);
      if (submissionError) {
        await supabase.storage.from("titan-videos").remove([path]);
        throw submissionError;
      }

      await supabase.from("titan_sessions").update({ status: "submitted", ended_at: new Date().toISOString() }).eq("id", session.id);
      setSelectedFile((prev) => ({ ...prev, [challenge.id]: null }));
      setMessage(`${challenge.name} evidence uploaded. ORANOS team review is required before approval.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit this evidence.");
      setBusy(false);
    }
  };

  const addGpsPoint = (position: GeolocationPosition) => {
    const point: Point = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      timestamp: position.timestamp,
    };
    const prior = gpsPointsRef.current.at(-1);
    if (prior) {
      const segment = haversine(prior, point);
      const dt = Math.max(0.1, (point.timestamp - prior.timestamp) / 1000);
      const speed = segment / dt;
      if (segment > 120 || speed > 8) {
        setGpsSignals((prev) => [...new Set([...prev, "GPS jump/spike detected; route retained for team review."])]);
      } else if ((point.accuracy ?? 999) <= 60) {
        setGpsDistance((d) => d + segment);
      }
    }
    gpsPointsRef.current = [...gpsPointsRef.current, point].slice(-6000);
    setGpsPoints(gpsPointsRef.current);
    setGpsElapsed(Math.floor((Date.now() - (gpsStartedAtRef.current || Date.now())) / 1000));
  };

  const stopGps = () => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
    if (gpsTimerRef.current !== null) {
      window.clearInterval(gpsTimerRef.current);
      gpsTimerRef.current = null;
    }
    setGpsRunning(false);
  };

  const startGps = async () => {
    setMessage("");
    setGpsSignals([]);
    gpsPointsRef.current = [];
    setGpsPoints([]);
    setGpsDistance(0);
    setGpsElapsed(0);
    if (!navigator.geolocation) {
      setMessage("GPS is not available in this browser.");
      return;
    }
    if (!navigator.permissions) {
      setGpsStatus("Allow location access in the browser prompt.");
    } else {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        if (permission.state === "denied") {
          setMessage("Location access is blocked. Enable location permission and try again.");
          return;
        }
      } catch {}
    }
    gpsStartedAtRef.current = Date.now();
    setGpsRunning(true);
    setGpsStatus("GPS active. Keep this screen open while running.");
    gpsWatchRef.current = navigator.geolocation.watchPosition(addGpsPoint, (error) => {
      setGpsStatus(error.message);
      setGpsSignals((prev) => [...new Set([...prev, `GPS error ${error.code}: ${error.message}`])]);
    }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 });
    gpsTimerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - (gpsStartedAtRef.current || Date.now())) / 1000);
      setGpsElapsed(elapsed);
      if (elapsed >= 840) {
        stopGps();
        setMessage("14-minute time limit reached. Your run is saved locally on this screen; review the distance before submitting.");
      }
    }, 1000);
  };

  const submitRun = async () => {
    const challenge = challenges.find((c) => c.slug === "run_2k");
    if (!challenge || !applicationId || !userId) return;
    if (gpsRunning) stopGps();
    const points = gpsPointsRef.current;
    const elapsed = gpsElapsed;
    const distance = gpsDistance;
    if (distance < 2000) {
      setMessage(`GPS distance is ${Math.round(distance)} m. The Titan standard requires 2,000 m before you can submit.`);
      return;
    }
    if (elapsed >= 840 || elapsed <= 0) {
      setMessage("The 2 km run must be completed in under 14:00.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { data: session, error: sessionError } = await supabase
        .from("titan_sessions")
        .insert({
          application_id: applicationId,
          user_id: userId,
          challenge_id: challenge.id,
          challenge_code: challenge.slug,
          status: "active",
          started_at: new Date(Date.now() - elapsed * 1000).toISOString(),
        })
        .select("id")
        .single();
      if (sessionError || !session) throw sessionError || new Error("Could not create run session.");

      const route = points.map((p) => ({ latitude: p.latitude, longitude: p.longitude, accuracy: p.accuracy, timestamp: p.timestamp }));
      const { error: submissionError } = await supabase.from("titan_submissions").insert({
        session_id: session.id,
        user_id: userId,
        challenge_id: challenge.id,
        application_id: applicationId,
        gps_distance_meters: Math.round(distance),
        gps_elapsed_seconds: elapsed,
        gps_route: route,
        integrity_status: gpsSignals.length ? "review_required" : "review",
        integrity_signals: {
          source: "browser_geolocation",
          gps_point_count: route.length,
          max_allowed_seconds: 840,
          target_distance_meters: 2000,
          signals: gpsSignals,
          high_accuracy_requested: true,
        },
        client_metadata: { user_agent: navigator.userAgent, platform: navigator.platform },
        status: "under_review",
      });
      if (submissionError) throw submissionError;
      await supabase.from("titan_sessions").update({ status: "submitted", ended_at: new Date().toISOString() }).eq("id", session.id);
      setMessage("2 km GPS evidence submitted. ORANOS team will verify the route, distance and timing.");
      setGpsStatus("Run submitted for review.");
      setGpsPoints([]);
      gpsPointsRef.current = [];
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit the GPS run.");
      setBusy(false);
    }
  };

  if (busy && !challenges.length && !applicationId) {
    return <section className="titan-workspace"><div className="eyebrow">MEMBER WORKSPACE</div><h2>Preparing your Titan session.</h2><p className="titan-copy">Sign in and accept the standard to unlock evidence submission.</p></section>;
  }

  if (!applicationId) {
    return <section className="titan-workspace"><div className="eyebrow">MEMBER WORKSPACE</div><h2>Start from the <em>standard.</em></h2><p className="titan-copy">{message}</p></section>;
  }

  return (
    <section id="titan-workspace" className="titan-section titan-workspace-section">
      <div className="eyebrow">MEMBER WORKSPACE / EVIDENCE</div>
      <h2>Complete the tests.<br /><em>Submit the proof.</em></h2>
      <p className="titan-copy">Each physical test accepts a camera recording or a video upload. The 2 km run uses live GPS before submission. Every item stays pending until the ORANOS team reviews it.</p>
      {message && <p className="titan-workspace-message" role="status" aria-live="polite">{message}</p>}
      <div className="titan-evidence-grid">
        {challenges.map((challenge) => {
          const latest = latestByChallenge.get(challenge.id);
          const file = selectedFile[challenge.id];
          const isRun = challenge.slug === "run_2k";
          return (
            <article className={isRun ? "titan-evidence-card run-card" : "titan-evidence-card"} key={challenge.id}>
              <div className="titan-evidence-top"><span className="trial-num">0{challenge.sort_order}</span><span className={latest ? `evidence-status status-${latest.status}` : "evidence-status"}>{latest?.status?.replaceAll("_", " ") || "NOT SUBMITTED"}</span></div>
              <div className="eyebrow">FITNESS / {challenge.slug.toUpperCase()}</div>
              <h3>{challenge.name}</h3>
              <p>{challenge.description || `${challenge.target_value} ${challenge.target_unit}`}</p>
              <strong className="evidence-target">{challenge.target_value}{challenge.target_unit === "meters" ? " m" : challenge.target_unit === "seconds" ? " sec" : ` ${challenge.target_unit}`}</strong>

              {isRun ? (
                <div className="gps-panel">
                  <div className="gps-stats">
                    <div><span>GPS DISTANCE</span><strong>{Math.round(gpsDistance)} m</strong></div>
                    <div><span>ELAPSED</span><strong>{formatTime(gpsElapsed)}</strong></div>
                  </div>
                  <div className="gps-actions">
                    {!gpsRunning ? <button className="gold-button" type="button" onClick={startGps} disabled={busy}>Start GPS Run ↗</button> : <button className="action" type="button" onClick={stopGps}>Pause GPS</button>}
                    <button className="action" type="button" onClick={submitRun} disabled={busy || gpsRunning || gpsDistance < 2000}>Submit 2 km GPS</button>
                  </div>
                  <p className="titan-note">{gpsStatus || "GPS route and timing are stored with your submission for team review."}</p>
                  {gpsSignals.length > 0 && <p className="gps-warning">{gpsSignals.join(" ")}</p>}
                </div>
              ) : (
                <div className="evidence-upload">
                  {recording === challenge.id ? (
                    <div className="recording-bar"><span className="recording-dot" /> RECORDING <button className="action" type="button" onClick={stopRecording}>Stop & save</button></div>
                  ) : (
                    <button className="gold-button" type="button" onClick={() => void startRecording(challenge)} disabled={busy || recording !== null}>Record video ↗</button>
                  )}
                  <label className="file-drop"><span>{file ? file.name : "Choose a video file"}</span><input type="file" accept="video/*" onChange={(e) => setSelectedFile((prev) => ({ ...prev, [challenge.id]: e.target.files?.[0] || null }))} /></label>
                  {file && <p className="titan-note">Ready: {Math.round(file.size / 1024 / 1024 * 10) / 10} MB</p>}
                  <button className="action" type="button" onClick={() => void submitVideo(challenge)} disabled={busy || !file}>Upload evidence</button>
                </div>
              )}
              <p className="titan-note">ORANOS team approval is separate from Titan Pass issuance.</p>
            </article>
          );
        })}
      </div>
      <div className="titan-review-note"><span className="eyebrow">REVIEW</span><p>Submitted evidence remains private. The ORANOS review team checks video evidence, GPS route, distance, timing and integrity signals before changing the evidence status.</p><a className="text-link" href="/account">Open member status →</a></div>
    </section>
  );
}
