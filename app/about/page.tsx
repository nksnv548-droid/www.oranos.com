import Link from "next/link";
import { PublicShell } from "@/components/oranos/SiteShell";

export default function AboutPage() {
  return (
    <PublicShell>
      <main className="oranos-internal-page">
        <section className="oranos-page-hero">
          <p className="oranos-kicker">ORANOS / ABOUT</p>
          <h1>Built around a <em>standard.</em></h1>
          <p>
            ORANOS is a fitness and lifestyle brotherhood for people who want
            consistency, responsibility, and growth to shape how they live.
          </p>
        </section>
        <section className="oranos-section oranos-section-light">
          <div className="oranos-two-column">
            <div>
              <p className="oranos-kicker">THE VISION</p>
              <h2>More than motivation.</h2>
            </div>
            <div>
              <p>
                Motivation changes. A standard gives you a direction to return
                to. ORANOS connects Fitness, Mindset, Lifestyle, and Discipline
                into one continuous approach to personal growth.
              </p>
              <p>
                It is meant to encourage people to strengthen their bodies,
                develop a healthier mindset, build supportive routines, and
                seek appropriate support when a challenge is bigger than a
                community can safely handle.
              </p>
            </div>
          </div>
        </section>
        <section className="oranos-section">
          <div className="oranos-two-column">
            <div>
              <p className="oranos-kicker">FOUNDER</p>
              <h2>Nithin Kumar</h2>
              <p className="oranos-kicker">FOUNDER, ORANOS</p>
            </div>
            <div>
              <p>
                ORANOS was founded around the belief that physical fitness
                should be developed alongside mindset, lifestyle, and
                discipline. The aim is to make personal growth practical and
                communal, rather than something people are expected to manage
                alone.
              </p>
              <p>
                Its mission is to support members as they build healthier
                habits, work towards their potential, recover direction when
                life feels difficult, and maintain their identity and goals
                within their relationships and responsibilities.
              </p>
              <Link className="oranos-text-link" href="/community">Read the community mission</Link>
            </div>
          </div>
        </section>
        <section className="oranos-section oranos-section-light">
          <div className="oranos-section-heading">
            <p className="oranos-kicker">THE FOUNDATION</p>
            <h2>Four pillars. One direction.</h2>
          </div>
          <div className="oranos-pillar-grid">
            <article className="oranos-card"><span className="oranos-card-number">01</span><h3>Fitness</h3><p>Build a capable body through movement and repeatable practice.</p></article>
            <article className="oranos-card"><span className="oranos-card-number">02</span><h3>Mindset</h3><p>Reflect, learn, and respond to challenges with intention.</p></article>
            <article className="oranos-card"><span className="oranos-card-number">03</span><h3>Lifestyle</h3><p>Create routines and environments that support progress.</p></article>
            <article className="oranos-card"><span className="oranos-card-number">04</span><h3>Discipline</h3><p>Make constructive actions consistent without demanding perfection.</p></article>
          </div>
        </section>
        <section className="oranos-section">
          <div className="oranos-section-heading">
            <p className="oranos-kicker">EXPLORE ORANOS</p>
            <h2>Choose your path.</h2>
          </div>
          <div className="oranos-choice-grid">
            <Link href="/pillars" className="oranos-card"><span className="oranos-card-number">01</span><h3>The Four Pillars</h3><p>Understand the foundation of ORANOS.</p></Link>
            <Link href="/oternal" className="oranos-card"><span className="oranos-card-number">02</span><h3>OTERNAL</h3><p>Meet the separate AI Mentor experience.</p></Link>
            <Link href="/titan-challenge" className="oranos-card"><span className="oranos-card-number">03</span><h3>Titan Challenge</h3><p>Learn about the challenge before you begin.</p></Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
