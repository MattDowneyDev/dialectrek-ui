import type { Metadata } from "next";
import Image from "next/image";
import ActionCard from "../../components/ActionCard";
import { BookIcon, GridIcon, SearchIcon, StackIcon, WatchIcon } from "../../components/ActionCardIcons";
import { LANGUAGES } from "../../languages/registry";
import { pageMetadata } from "../../lib/seo";

type PageProps = { params: Promise<{ language: string }> };

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { language } = await params;
  const definition = LANGUAGES[language];
  if (!definition) return {};
  return pageMetadata({
    title: `Learn ${definition.displayName}`,
    description: `Watch comprehensible input videos, practice verb conjugations, and learn vocabulary with flashcards to learn ${definition.displayName}.`,
    path: `/${language}`,
  });
};

const HomePage = async ({ params }: PageProps) => {
  const { language } = await params;
  const definition = LANGUAGES[language];
  if (!definition) return null;

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-media">
          <Image
            src="/DialecTrekHeroImage.png"
            alt="A traveler pauses on a mountain trail marked with icons for reading, conversation, and practice, following it toward a flag at the summit"
            fill
            priority
            sizes="100vw"
            className="hero-bg-image"
          />
          <div className="hero-scrim" />
        </div>
        <div className="hero-inner">
          <div className="hero-text">
            <span className="hero-flag-emoji">{definition.flagEmoji}</span>
            <h1>{definition.displayName}</h1>
            <p>
              Watch comprehensible input videos, practice verb conjugations, and
              learn vocabulary with flashcards.
            </p>
            <span
              className={`hero-flag-stripe hero-flag-stripe--${definition.code}`}
            />
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-heading">Where to next?</h2>
        <div className="action-cards">
          <ActionCard
            to={`/${language}/watch`}
            title="Watch videos"
            description="Comprehensible input from real native speakers on YouTube, sorted to match your level."
            icon={<WatchIcon />}
          />
          <ActionCard
            to={`/${language}/verbs`}
            title="Look up verbs"
            description={
              definition.hasVerbs
                ? "Browse the verb list and find a conjugation fast."
                : "Coming soon."
            }
            icon={<SearchIcon />}
          />
          <ActionCard
            to={`/${language}/conjugate`}
            title="Conjugate verbs"
            description={
              definition.hasVerbs
                ? "Quiz yourself on the tenses and verb types you choose."
                : "Coming soon."
            }
            icon={<GridIcon />}
          />
          <ActionCard
            to={`/${language}/flashcards`}
            title="Study flashcards"
            description="Flip through the most common words until they stick."
            icon={<StackIcon />}
          />
          <ActionCard
            to={`/${language}/grammar`}
            title="Learn grammar"
            description={
              definition.grammarTopics.length
                ? "Understand the concepts behind the conjugations."
                : "Coming soon."
            }
            icon={<BookIcon />}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
