"use client";

import { useState } from "react";
import Link from "next/link";

const navItems = [
  { href: "/about", label: "About" },
  { href: "/pillars", label: "Pillars" },
  { href: "/oternal", label: "OTERNAL" },
  { href: "/titan-challenge", label: "Titan" },
  { href: "/journey", label: "Journey" },
  { href: "/community", label: "Community" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="oranos-site-header">
      <Link className="oranos-site-brand" href="/" aria-label="ORANOS home" onClick={() => setOpen(false)}>
        <img src="/oranos-crest.png" alt="ORANOS crest" />
        <span>ORANOS</span>
      </Link>
      <nav className={open ? "oranos-site-nav is-open" : "oranos-site-nav"} aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
        ))}
        <Link className="oranos-nav-member" href="/sign-in" onClick={() => setOpen(false)}>Member Access</Link>
      </nav>
      <button className={open ? "oranos-menu-button is-open" : "oranos-menu-button"} type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span />
        <span />
      </button>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="oranos-site-footer">
      <div className="oranos-footer-brand">
        <img src="/oranos-crest.png" alt="" aria-hidden="true" />
        <strong>ORANOS</strong>
        <p>Fitness. Mindset. Lifestyle. Discipline.</p>
      </div>
      <div className="oranos-footer-links">
        <Link href="/oternal">OTERNAL</Link>
        <Link href="/titan-challenge">Titan</Link>
        <Link href="/community">Community</Link>
        <Link href="/sign-in">Member Access</Link>
      </div>
    </footer>
  );
}

export function PublicShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`oranos-public-shell ${className}`.trim()}><SiteHeader />{children}<SiteFooter /></div>;
}