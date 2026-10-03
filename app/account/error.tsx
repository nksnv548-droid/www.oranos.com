"use client";

import { useEffect } from "react";

export default function AccountError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep this boundary intentionally quiet; detailed errors stay server-side.
  }, []);

  return (
    <main className="dashboard">
      <section className="welcome">
        <div className="eyebrow">MEMBER SPACE / ERROR</div>
        <h1>Member space <em>could not load.</em></h1>
        <p>We could not load your ORANOS member data safely. Try again before starting another challenge action.</p>
        <button className="gold-button" type="button" onClick={() => reset()}>Try again ↗</button>
      </section>
    </main>
  );
}
