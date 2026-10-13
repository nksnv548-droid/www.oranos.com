import Link from "next/link";
import { PublicShell } from "@/components/oranos/SiteShell";

export default function CommunityPage() {
  return (
    <PublicShell>
      <main className="oranos-internal-page">
        <section className="oranos-page-hero">
          <p className="oranos-kicker">ORANOS / COMMUNITY</p>
          <h1>A stronger body.<br /><em>A steadier mind.</em></h1>
          <p>
            ORANOS Community brings people together to build Fitness, Mindset,
            Lifestyle, and Discipline into a way of life—not a short-lived burst
            of motivation.
          </p>
        </section>

        <section className="oranos-section oranos-section-light">
          <div className="oranos-two-column">
            <div>
              <p className="oranos-kicker">OUR PURPOSE</p>
              <h2>Growth that reaches beyond the gym.</h2>
            </div>
            <div>
              <p>
                A fit body matters. So does a mind that can pause, make clearer
                choices, and keep moving through difficult days. ORANOS exists
                to help people develop both, while shaping healthier routines
                and a stronger sense of responsibility for their own lives.
              </p>
              <p>
                This is not a promise of instant transformation. It is a place
                to practise, learn, ask for support, and keep returning to
                constructive habits—one real step at a time.
              </p>
            </div>
          </div>
        </section>

        <section className="oranos-section">
          <div className="oranos-section-heading">
            <p className="oranos-kicker">WHY ORANOS EXISTS</p>
            <h2>Build yourself without losing yourself.</h2>
          </div>
          <div className="oranos-copy-grid">
            <p>
              People can know what is good for them and still struggle to turn
              that knowledge into action. ORANOS is designed to make the path
              more practical: create a routine, train with intention, reflect
              honestly, and build consistency with others who value progress.
            </p>
            <p>
              We also want people facing harmful substance use or difficult
              personal patterns to be met with dignity rather than shame. A
              supportive community can encourage positive next steps, but
              substance dependence may require qualified medical or mental
              health care. ORANOS is not a treatment, detox, or crisis service
              and never replaces professional support.
            </p>
          </div>
        </section>

        <section className="oranos-section oranos-section-light">
          <div className="oranos-two-column">
            <div>
              <p className="oranos-kicker">RELATIONSHIPS & IDENTITY</p>
              <h2>Care for others. Keep your direction.</h2>
            </div>
            <div>
              <p>
                Healthy relationships should leave room for both people to
                grow. ORANOS encourages members to keep their own values,
                friendships, health, learning, and goals alive while building
                relationships with care and respect.
              </p>
              <p>
                This is about personal identity, mutual respect, communication,
                and healthy boundaries—not controlling a partner or labelling
                relationships as bad. When life feels emotionally difficult,
                asking a trusted person or qualified professional for help is
                a sign of responsibility, not weakness.
              </p>
            </div>
          </div>
        </section>

        <section className="oranos-section">
          <div className="oranos-section-heading">
            <p className="oranos-kicker">THE FOUR PILLARS</p>
            <h2>A shared standard for everyday life.</h2>
          </div>
          <div className="oranos-pillar-grid">
            <article className="oranos-card">
              <span className="oranos-card-number">01</span>
              <h3>Fitness</h3>
              <p>Build strength, movement, and a sustainable relationship with your body.</p>
            </article>
            <article className="oranos-card">
              <span className="oranos-card-number">02</span>
              <h3>Mindset</h3>
              <p>Practise reflection, perspective, and the ability to respond with intention.</p>
            </article>
            <article className="oranos-card">
              <span className="oranos-card-number">03</span>
              <h3>Lifestyle</h3>
              <p>Shape routines, surroundings, and choices that support the person you want to become.</p>
            </article>
            <article className="oranos-card">
              <span className="oranos-card-number">04</span>
              <h3>Discipline</h3>
              <p>Keep promises to yourself through repeatable actions, not perfection.</p>
            </article>
          </div>
        </section>

        <section className="oranos-section oranos-section-light">
          <div className="oranos-two-column">
            <div>
              <p className="oranos-kicker">A NOTE FROM THE FOUNDER</p>
              <h2>Why I created ORANOS.</h2>
              <p className="oranos-kicker">NITHIN KUMAR / FOUNDER</p>
            </div>
            <div>
              <p>
                I created ORANOS around a simple purpose: to help people work
                towards a developed mindset and a fit body, and to give that
                growth a place in everyday life—not only during a workout or
                when motivation is high.
              </p>
              <p>
                I want ORANOS to encourage people who are trying to move away
                from destructive patterns, rebuild their routines, and discover
                what they are capable of. I also want people to care deeply for
                others without abandoning their own identity, direction, and
                long-term goals.
              </p>
              <p>
                ORANOS is being built as a community that values progress over
                appearances, responsibility over excuses, and support over
                judgement. The standard is not to be perfect. The standard is
                to keep choosing the next constructive step.
              </p>
            </div>
          </div>
        </section>

        <section className="oranos-section">
          <div className="oranos-section-heading">
            <p className="oranos-kicker">YOUR NEXT STEP</p>
            <h2>Enter the ecosystem.</h2>
          </div>
          <div className="oranos-choice-grid">
            <Link className="oranos-card" href="/sign-in?next=/account">
              <span className="oranos-card-number">01</span>
              <h3>Member Access</h3>
              <p>Continue into your ORANOS member environment.</p>
            </Link>
            <Link className="oranos-card" href="/oternal">
              <span className="oranos-card-number">02</span>
              <h3>Explore OTERNAL</h3>
              <p>Discover the separate AI Mentor product, currently in development.</p>
            </Link>
            <Link className="oranos-card" href="/titan-challenge">
              <span className="oranos-card-number">03</span>
              <h3>Explore Titan</h3>
              <p>Understand the challenge and its standards before you begin.</p>
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
