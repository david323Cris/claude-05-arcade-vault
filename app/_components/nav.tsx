"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/modules/auth";

type Section = "home" | "biblioteca" | "salon" | "auth";

function sectionOf(pathname: string): Section | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/games")) return "biblioteca";
  if (pathname.startsWith("/hall-of-fame")) return "salon";
  if (pathname.startsWith("/auth")) return "auth";
  return null;
}

export function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);

  const section = sectionOf(pathname);
  const cls = (name: Section) => (section === name ? "active" : undefined);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link className="logo" href="/" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link className={cls("home")} href="/">Inicio</Link>
          <Link className={cls("biblioteca")} href="/games">Biblioteca</Link>
          <Link className={cls("salon")} href="/hall-of-fame">Salón de la Fama</Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={() => void signOut()}>
            {user.name} ▾
          </button>
        ) : (
          <Link className="btn auth-btn" href="/auth">Iniciar Sesión</Link>
        )}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        <Link className={cls("home")} href="/" onClick={close}>Inicio</Link>
        <Link className={cls("biblioteca")} href="/games" onClick={close}>Biblioteca</Link>
        <Link className={cls("salon")} href="/hall-of-fame" onClick={close}>Salón de la Fama</Link>
        <Link className={cls("auth")} href="/auth" onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
