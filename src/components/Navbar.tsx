"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANGUAGES } from "../languages/registry";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const language = segments[0];
  const activeLanguage = language && LANGUAGES[language]?.enabled ? language : undefined;
  // Dynamic slugs (verbs/[verb], grammar/[topic]) are language-specific, so
  // switching languages mid-slug lands on the section list instead of a slug
  // that likely doesn't exist for the target language.
  const section = segments[1];

  const links = activeLanguage
    ? [
        { to: `/${activeLanguage}/watch`, label: "Watch" },
        { to: `/${activeLanguage}/verbs`, label: "Verbs" },
        { to: `/${activeLanguage}/conjugate`, label: "Conjugate" },
        { to: `/${activeLanguage}/grammar`, label: "Grammar" },
        { to: `/${activeLanguage}/flashcards`, label: "Flashcards" },
        { to: `/${activeLanguage}/about`, label: "About" },
      ]
    : [];

  const otherLanguages = activeLanguage
    ? Object.entries(LANGUAGES).filter(
        ([code, definition]) => definition.enabled && code !== activeLanguage,
      )
    : [];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isLangOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLangOpen]);

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-inner">
        <Link
          href="/"
          className="navbar-brand"
          onClick={() => setIsOpen(false)}
        >
          DialecTrek
          <span className="brand-dots" aria-hidden="true">
            <span className="brand-dot" />
            <span className="brand-dot" />
            <span className="brand-dot" />
          </span>
        </Link>

        <div className={`navbar-links${isOpen ? " open" : ""}`}>
          {links.map(({ to, label }) => {
            const isActive = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                href={to}
                className={`navbar-link${isActive ? " active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="navbar-actions">
          {activeLanguage && otherLanguages.length > 0 && (
            <div className="lang-switcher" ref={langRef}>
              <button
                className="lang-switcher-trigger"
                type="button"
                aria-label="Switch language"
                aria-expanded={isLangOpen}
                onClick={() => setIsLangOpen((open) => !open)}
              >
                <span aria-hidden="true">
                  {LANGUAGES[activeLanguage].flagEmoji}
                </span>
              </button>

              {isLangOpen && (
                <div className="lang-dropdown">
                  {otherLanguages.map(([code, definition]) => (
                    <Link
                      key={code}
                      href={section ? `/${code}/${section}` : `/${code}`}
                      className="lang-dropdown-item"
                      onClick={() => setIsLangOpen(false)}
                    >
                      <span aria-hidden="true">{definition.flagEmoji}</span>
                      {definition.displayName}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {links.length > 0 && (
            <button
              className="navbar-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((open) => !open)}
            >
              <span />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
