import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OTERNAL — The AI Mentor of ORANOS",
  description:
    "OTERNAL is the AI Mentor of the ORANOS Community, designed around Fitness, Mindset, Lifestyle and Discipline.",
};

const pillars = [
  {
    number: "01",
    title: "FITNESS",
    detail: "Train with structure. Build strength, endurance, mobility and a sustainable rhythm.",
  },
  {
    number: "02",
    title: "MINDSET",
    detail: "Create clarity, focus and resilience through intentional daily practice.",
  },
  {
    number: "03",
    title: "LIFESTYLE",
    detail: "Turn better choices into practical routines that support the life you want.",
  },
  {
    number: "04",
    title: "DISCIPLINE",
    detail: "Keep the promises you make to yourself through consistent action.",
  },
];

function OternalMark() {
  return (
    <div className="oternal-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function WireframeFigure() {
  return (
    <svg
      className="oternal-figure"
      viewBox="0 0 520 620"
      role="img"
      aria-label="Abstract blue wireframe portrait representing OTERNAL"
    >
      <defs>
        <pattern id="oternalGrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.32" />
        </pattern>
        <linearGradient id="oternalFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#173FE8" stopOpacity="0.86" />
          <stop offset="0.62" stopColor="#173FE8" stopOpacity="0.28" />
          <stop offset="1" stopColor="#173FE8" stopOpacity="0" />
        </linearGradient>
        <filter id="oternalGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.09 0 0 0 0 0.25 0 0 0 0 0.91 0 0 0 .30 0" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="oternal-aura">
        <circle cx="260" cy="242" r="210" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.16" />
        <circle cx="260" cy="242" r="174" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.13" />
        <path d="M85 244H435M260 67V418" stroke="currentColor" strokeWidth="1" opacity="0.1" />
      </g>

      <g filter="url(#oternalGlow)" fill="url(#oternalGrid)" stroke="currentColor" strokeWidth="2">
        <path d="M260 42C185 42 132 103 138 186C142 241 128 290 112 339C99 378 103 425 140 443C171 458 201 466 222 474H298C319 466 349 458 380 443C417 425 421 378 408 339C392 290 378 241 382 186C388 103 335 42 260 42Z" opacity="0.72" />
        <path d="M206 455C185 469 168 493 160 529L134 600M314 455C335 469 352 493 360 529L386 600" fill="none" opacity="0.7" />
        <path d="M184 211C205 192 227 185 260 185C293 185 315 192 336 211M186 214C186 245 210 263 238 263C247 263 254 261 260 258C266 261 273 263 282 263C310 263 334 245 334 214" fill="none" />
        <path d="M206 218C219 210 235 210 247 219M273 219C285 210 301 210 314 218" fill="none" strokeWidth="3" />
        <path d="M248 221C250 232 250 244 244 252M272 221C270 232 270 244 276 252M246 283C255 288 265 288 274 283M224 318C248 338 272 338 296 318" fill="none" opacity="0.72" />
        <path d="M160 138C190 105 223 91 260 91C297 91 330 105 360 138M153 163C190 135 222 125 260 125C298 125 330 135 367 163" fill="none" opacity="0.48" />
        <path d="M153 196C185 178 215 170 260 170C305 170 335 178 367 196M146 231C184 220 218 216 260 216C302 216 336 220 374 231M139 269C180 264 219 261 260 261C301 261 340 264 381 269" fill="none" opacity="0.4" />
      </g>

      <g className="oternal-crown" fill="currentColor">
        <path d="M185 55L215 0L260 42L305 0L335 55L260 78Z" />
        <path d="M198 61H322L306 74H214Z" opacity="0.92" />
      </g>

      <g className="oternal-guides" fill="none" stroke="currentColor" opacity="0.48">
        <path d="M68 535H452" />
        <path d="M94 565H426" />
        <path d="M120 595H400" />
      </g>
    </svg>
  );
}

export default function OternalPage() {
  return (
    <main className="oternal-page">
      <div className="oternal-grid" aria-hidden="true" />
      <div className="oternal-noise" aria-hidden="true" />

      <header className="oternal-nav">
        <Link href="/community.html" className="oternal-oranos-link">
          <OternalMark />
          <span>ORANOS</span>
        </Link>
        <div className="oternal-nav-center">OTERNAL</div>
        <Link href="#access" className="oternal-nav-cta">
          APP / ACCESS
        </Link>
      </header>

      <section className="oternal-hero">
        <div className="oternal-hero-copy">
          <div className="oternal-eyebrow">ORANOS / INTELLIGENCE / 01</div>
          <p className="oternal-kicker">THE AI MENTOR OF THE ORANOS COMMUNITY</p>
          <h1>
            BECOME
            <br />
            <em>MORE.</em>
          </h1>
          <p className="oternal-lead">
            OTERNAL is being built to give the ORANOS journey a new layer of intelligence —
            a mentor designed around Fitness, Mindset, Lifestyle and Discipline.
          </p>
          <div className="oternal-hero-actions">
            <a href="#experience" className="oternal-button">
              DISCOVER OTERNAL <span>↓</span>
            </a>
            <Link href="/community.html" className="oternal-text-link">
              ORANOS COMMUNITY ↗
            </Link>
          </div>
          <div className="oternal-status">
            <span className="oternal-status-dot" />
            OTERNAL APP / CURRENTLY IN DEVELOPMENT
          </div>
        </div>

        <div className="oternal-hero-visual">
          <div className="oternal-coordinate">AI MENTOR / ORANOS / 01</div>
          <WireframeFigure />
          <div className="oternal-visual-caption">
            <span>OTERNAL</span>
            <span>GUIDANCE / REFLECTION / PRACTICE</span>
          </div>
        </div>
      </section>

      <section id="experience" className="oternal-section oternal-intro">
        <div className="oternal-section-index">02 / WHAT IS OTERNAL?</div>
        <div className="oternal-intro-grid">
          <h2>
            Intelligence
            <br />
            for the
            <br />
            <em>journey.</em>
          </h2>
          <div>
            <p className="oternal-large-copy">
              OTERNAL is the AI Mentor of the ORANOS Community. Its purpose is to help members
              turn the four ORANOS pillars into practical, repeatable action.
            </p>
            <p className="oternal-body">
              It is designed as a guidance layer around the work you already choose to do:
              understanding your direction, making better next-step decisions, building
              consistency and reflecting on progress.
            </p>
          </div>
        </div>
      </section>

      <section className="oternal-section oternal-pillars">
        <div className="oternal-section-index">03 / THE FOUNDATION</div>
        <div className="oternal-section-heading">
          <h2>ONE MENTOR. FOUR PILLARS.</h2>
          <p>OTERNAL is shaped around the same foundation as ORANOS.</p>
        </div>
        <div className="oternal-pillar-grid">
          {pillars.map((pillar) => (
            <article key={pillar.number} className="oternal-pillar-card">
              <span>{pillar.number}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.detail}</p>
              <i aria-hidden="true">↗</i>
            </article>
          ))}
        </div>
      </section>

      <section className="oternal-section oternal-flow">
        <div className="oternal-section-index">04 / THE EXPERIENCE</div>
        <div className="oternal-flow-grid">
          <div>
            <h2>
              From
              <br />
              intention to
              <br />
              <em>action.</em>
            </h2>
          </div>
          <div className="oternal-flow-list">
            <article>
              <span>01</span>
              <div>
                <h3>UNDERSTAND</h3>
                <p>Put the current situation, goal and direction into context.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>GUIDE</h3>
                <p>Turn that context into a practical next step you can actually take.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>REFLECT</h3>
                <p>Use consistency, feedback and reflection to keep moving with intention.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="access" className="oternal-section oternal-cta-section">
        <div className="oternal-cta-box">
          <div className="oternal-section-index">05 / OTERNAL APP</div>
          <div className="oternal-cta-layout">
            <div>
              <p className="oternal-cta-kicker">THE NEXT LAYER OF THE ORANOS JOURNEY</p>
              <h2>
                BECOME
                <br />
                <em>MORE.</em>
              </h2>
            </div>
            <div>
              <p className="oternal-body oternal-cta-copy">
                OTERNAL is being built as a dedicated AI Mentor experience for the ORANOS
                Community. The app is under development.
              </p>
              <div className="oternal-cta-actions">
                <Link href="/community.html" className="oternal-button oternal-button-solid">
                  JOIN ORANOS <span>↗</span>
                </Link>
                <Link href="/sign-in" className="oternal-text-link">
                  MEMBER ACCESS →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="oternal-footer">
        <span>OTERNAL — THE AI MENTOR OF ORANOS.</span>
        <Link href="/community.html">ORANOS ↗</Link>
      </footer>
    </main>
  );
}
