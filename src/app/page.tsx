import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import FeatureItem from "../components/FeatureItem";
import { LANGUAGES } from "../languages/registry";
import { pageMetadata } from "../lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "DialecTrek — Learn a Language",
    ogTitle: "DialecTrek — Learn a Language",
    description:
      "DialecTrek — watch videos from real native speakers, look up verb conjugations, and practice with flashcards to build your vocabulary.",
    path: "/",
  }),
  title: { absolute: "DialecTrek — Learn a Language" },
};

const LanguagePickerPage = () => {
  return (
    <div className="page">
      <div className="hero">
        <div className="hero-media">
          <Image
            src="/DialecTrekHeroImage.jpeg"
            alt="A hiker pauses on a mountain trail, looking out over green valleys and a winding path toward distant peaks"
            fill
            priority
            sizes="100vw"
            className="hero-bg-image"
          />
          <div className="hero-scrim" />
        </div>
        <div className="hero-inner">
          <div className="hero-text">
            <h1>DialecTrek</h1>
            <p>
              Language learning is a journey — we're just here to point out the
              shortcuts.
            </p>
            <div className="hero-lang-label">Choose a language to get started</div>
            <div className="hero-lang-picker">
              {Object.values(LANGUAGES).map((language) => (
                <Link
                  key={language.code}
                  href={`/${language.code}`}
                  className={`language-card language-card--${language.code} hero-lang-card`}
                >
                  <h3>{language.displayName}</h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="feature-grid">
          <FeatureItem
            title="Watch videos"
            description="Learn from real native speakers on YouTube, sorted to match your level."
          />
          <FeatureItem
            title="Look up verbs"
            description="Browse the verb list and find a conjugation fast."
          />
          <FeatureItem
            title="Conjugate verbs"
            description="Quiz yourself on the tenses and verb types you choose."
          />
          <FeatureItem
            title="Study flashcards"
            description="Flip through the most common words until they stick."
          />
          <FeatureItem
            title="Learn grammar"
            description="Understand the concepts behind the conjugations."
          />
        </div>
      </div>
    </div>
  );
};

export default LanguagePickerPage;
