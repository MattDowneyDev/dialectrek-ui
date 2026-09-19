import type { Metadata } from "next";
import PageHeader from "../../../components/PageHeader";
import { LANGUAGES } from "../../../languages/registry";
import { pageMetadata } from "../../../lib/seo";

type PageProps = { params: Promise<{ language: string }> };

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { language } = await params;
  const definition = LANGUAGES[language];
  if (!definition) return {};
  return pageMetadata({
    title: "About DialecTrek",
    description: `Learn ${definition.displayName} through comprehensible input -- real videos from native speakers, sorted to match your level.`,
    path: `/${language}/about`,
  });
};

const AboutPage = async ({ params }: PageProps) => {
  const { language } = await params;
  const definition = LANGUAGES[language];
  if (!definition) return null;

  return (
    <div className="page">
      <PageHeader
        title="About DialecTrek"
        subtitle="A tool for learning a new language through comprehensible input."
      />

      <div className="about-content">
        <h2>Learn through comprehensible input</h2>
        <p>
          The fastest way to actually absorb a language is input you can
          mostly understand — content that's just within reach, not miles
          above your level. That's the idea behind Watch: real videos from
          native speakers, sorted by difficulty so you're always watching
          something you can follow instead of straining to catch one word in
          ten. Rank a video as harder or easier than the last one you watched
          and the sorting gets sharper — for you and for everyone after you.
        </p>

        <h2>Everything you need, in one place</h2>
        <p>
          DialecTrek brings together what you need to learn — comprehensible
          input videos, verb conjugation, grammar, and vocabulary flashcards —
          so you're never bouncing between a dozen tabs just to find
          something to watch, look something up, or practice.
        </p>

        <h2>Learn your way</h2>
        <p>
          Watch videos matched to your level, flip through flashcards, browse
          to look up what you need right now, or practice conjugating
          whatever tenses and verb types you pick. Each round only covers
          what you chose — so practice fits how you actually learn, not a
          one-size-fits-all drill.
        </p>

        <h2>Built for efficiency</h2>
        <p>
          DialecTrek gets straight to the point — one thing at a time, with
          immediate feedback, so there's no wasted motion. Whether you're
          brushing up before a trip or working through a course, it's meant
          to be a quick, no-friction tool you can come back to as often as
          you like.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
