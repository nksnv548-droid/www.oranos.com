import type { Metadata } from "next";
import Link from "next/link";

const OTERNAL_LAUNCH_PATH = "/oternal/launch";

export const metadata: Metadata = {
  title: "OTERNAL — Your AI Mentor of ORANOS",
  description: "Meet OTERNAL, created by Nithin Kumar as the AI Mentor of the ORANOS Community. Explore Fitness, Mindset, Lifestyle and Discipline.",
};

const pillars = [
  ["01", "FITNESS", "Build strength, move with purpose and create a routine that fits your life."],
  ["02", "MINDSET", "Find clarity, reflect on challenges and approach your goals with intention."],
  ["03", "LIFESTYLE", "Build everyday habits and choices that support the life you want."],
  ["04", "DISCIPLINE", "Turn your intentions into small actions you can keep repeating."],
];
const features = [
  ["01", "Personal AI guidance", "Share a goal or challenge and explore clear, useful next steps."],
  ["02", "Fitness support", "Explore training ideas and ways to build a steady routine."],
  ["03", "Mindset and reflection", "Think through your choices, focus and personal challenges."],
  ["04", "Lifestyle habits", "Find simple routines that work with your day-to-day life."],
  ["05", "Discipline", "Break a big goal into smaller actions you can repeat."],
  ["06", "Progress reflection", "Look at what worked, what was difficult and what to try next."],
];
const guidance = [
  ["01", "UNDERSTAND", "Tell OTERNAL what you want to improve, where you are now and what feels difficult."],
  ["02", "GUIDE", "Explore practical ideas and choose a next step that fits your situation."],
  ["03", "REFLECT", "Look back at what happened and what you learned."],
  ["04", "GROW", "Use that learning to decide what to do next. You stay in control."],
];
const imageSlots = ["AI MENTOR", "FITNESS", "DAILY GUIDANCE", "YOUR JOURNEY"];

export default function OternalPage() {
  return <main className="oternal-page">
    <div className="oternal-grid" aria-hidden="true" />
    <header className="oternal-nav">
      <Link href="/community.html" className="oternal-oranos-link"><span>ORANOS ↗</span></Link>
      <div className="oternal-nav-center">OTERNAL</div>
      <Link href={OTERNAL_LAUNCH_PATH} className="oternal-nav-cta">ENTER OTERNAL ↗</Link>
    </header>

    <section className="oternal-hero">
      <div className="oternal-hero-copy">
        <p className="oternal-kicker">THE AI MENTOR OF THE ORANOS COMMUNITY</p>
        <h1>YOUR PATH.<br/><em>YOUR GROWTH.</em></h1>
        <p className="oternal-lead">A personal AI mentor designed around Fitness, Mindset, Lifestyle and Discipline.</p>
        <div className="oternal-hero-actions"><a href="#about" className="oternal-button">DISCOVER OTERNAL ↓</a><Link href={OTERNAL_LAUNCH_PATH} className="oternal-button">ENTER OTERNAL ↗</Link><span className="oternal-status"><i className="oternal-status-dot"/> MEMBER ACCESS REQUIRED</span></div>
      </div>
      <div className="oternal-hero-art" aria-label="Official OTERNAL visual will be added when the approved brand asset is ready">
        <span className="oternal-art-index">OTERNAL / OFFICIAL VISUAL</span>
        <div className="oternal-art-placeholder" aria-label="OTERNAL official visual placeholder">OTERNAL</div>
        <span className="oternal-art-caption">AI MENTOR / ORANOS<br/>APP IN DEVELOPMENT</span>
      </div>
    </section>

    <section id="about" className="oternal-section oternal-intro">
      <p className="oternal-section-index">01 / WHAT IS OTERNAL?</p>
      <div className="oternal-intro-grid">
        <h2>A mentor for<br/><em>your journey.</em></h2>
        <div>
          <p className="oternal-large-copy">OTERNAL is the AI Mentor of the ORANOS Community.</p>
          <p className="oternal-body">It is being created to help people understand their goals, find useful next steps and keep learning as they grow. It brings the four ORANOS pillars into one AI-guided experience.</p>
          <p className="oternal-body">OTERNAL is designed to support your decisions, not make them for you.</p>
        </div>
      </div>
    </section>

    <section className="oternal-section oternal-founder">
      <p className="oternal-section-index">02 / THE FOUNDER'S VISION</p>
      <div className="oternal-founder-panel">
        <span className="oternal-founder-label">CREATED BY NITHIN KUMAR</span>
        <h2>Built with<br/><em>a purpose.</em></h2>
        <p className="oternal-large-copy">OTERNAL was created by Nithin Kumar to bring the ideas behind ORANOS closer to everyday life.</p>
        <p className="oternal-body">The goal is to help people who want to grow but may not know where to begin or how to stay consistent. OTERNAL is being built to help them ask questions, think clearly, choose practical actions and reflect on what they learn.</p>
        <p className="oternal-founder-sign">NITHIN KUMAR <span>FOUNDER, ORANOS</span></p>
      </div>
    </section>

    <section className="oternal-section">
      <p className="oternal-section-index">03 / WHY OTERNAL EXISTS</p>
      <div className="oternal-intro-grid">
        <h2>From knowing<br/>to <em>doing.</em></h2>
        <div><p className="oternal-large-copy">Finding good information is easier than turning it into a daily habit.</p><p className="oternal-body">OTERNAL is designed to make guidance easier to reach: understand your goal, choose a next step, take action and learn from the experience.</p></div>
      </div>
    </section>

    <section className="oternal-section oternal-features">
      <p className="oternal-section-index">04 / WHAT YOU CAN EXPLORE</p>
      <div className="oternal-section-heading"><h2>MADE FOR YOUR GROWTH.</h2><p>These are the areas OTERNAL is being designed to support.</p></div>
      <div className="oternal-feature-grid">{features.map(([number,title,copy])=><article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </section>

    <section className="oternal-section oternal-pillars">
      <p className="oternal-section-index">05 / THE ORANOS FOUNDATION</p>
      <div className="oternal-section-heading"><h2>FOUR PILLARS.<br/>ONE JOURNEY.</h2><p>Four connected parts of a more intentional life.</p></div>
      <div className="oternal-pillar-grid">{pillars.map(([number,title,detail])=><article key={number} className="oternal-pillar-card"><span>{number}</span><h3>{title}</h3><p>{detail}</p></article>)}</div>
    </section>

    <section className="oternal-section oternal-flow">
      <p className="oternal-section-index">06 / HOW YOUR AI MENTOR GUIDES YOU</p>
      <div className="oternal-flow-grid"><div><h2>One step<br/>at a time.</h2><p className="oternal-body">You bring your goals and choices. OTERNAL helps you think through what comes next.</p></div>
        <div className="oternal-flow-list">{guidance.map(([number,title,copy])=><article key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
      </div>
    </section>

    <section className="oternal-section oternal-preview">
      <p className="oternal-section-index">07 / THE APP EXPERIENCE</p>
      <div className="oternal-section-heading"><h2>SEE OTERNAL IN ACTION.</h2><p>Only genuine OTERNAL app screenshots will be placed here. No sample or unrelated app images.</p></div>
      <div className="oternal-preview-grid">{imageSlots.map((label,index)=><div className="oternal-preview-slot" key={label}><span>SCREEN {String(index+1).padStart(2,"0")}</span><strong>{label}</strong><small>OFFICIAL APP SCREENSHOTS WILL APPEAR AFTER THE ANDROID BUILD IS READY</small></div>)}</div>
    </section>

    <section id="app" className="oternal-section oternal-cta-section">
      <div className="oternal-cta-box"><p className="oternal-section-index">08 / OTERNAL APP</p>
        <div className="oternal-cta-layout"><div><p className="oternal-cta-kicker">THE NEXT LAYER OF THE ORANOS JOURNEY</p><h2>YOUR NEXT<br/><em>STEP.</em></h2></div>
          <div><p className="oternal-large-copy">OTERNAL is currently in development.</p><p className="oternal-body">The Android APK will be available here when the official release file is ready. Google Play access will be added later.</p><Link href={OTERNAL_LAUNCH_PATH} className="oternal-button">OPEN OTERNAL ↗</Link></div>
        </div>
      </div>
    </section>
    <footer className="oternal-footer"><span>OTERNAL — THE AI MENTOR OF ORANOS</span><Link href="/community.html">BACK TO ORANOS ↗</Link></footer>
  </main>;
}
