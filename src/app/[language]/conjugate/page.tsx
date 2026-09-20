import type { Metadata } from "next";
import ComingSoon from "../../../components/ComingSoon";
import ConjugateClient from "../../../features/conjugate/ConjugateClient";
import { LANGUAGES } from "../../../languages/registry";
import type { Tense } from "../../../languages/types";
import { pageMetadata } from "../../../lib/seo";

type PageProps = {
  params: Promise<{ language: string }>;
  searchParams: Promise<{ tenses?: string }>;
};

type MetadataProps = { params: PageProps["params"] };

export const generateMetadata = async ({ params }: MetadataProps): Promise<Metadata> => {
  const { language } = await params;
  const definition = LANGUAGES[language];
  if (!definition) return {};
  return pageMetadata({
    title: `Conjugate ${definition.displayName} Verbs`,
    description: definition.hasVerbs
      ? `Quiz yourself on ${definition.displayName} verb conjugations across the tenses and verb types you choose.`
      : `${definition.displayName} verb conjugation practice is coming soon.`,
    path: `/${language}/conjugate`,
  });
};

const ConjugatePage = async ({ params, searchParams }: PageProps) => {
  const { language } = await params;
  const definition = LANGUAGES[language];
  if (!definition) return null;
  if (!definition.hasVerbs) {
    return <ComingSoon title="Conjugate" language={language} definition={definition} />;
  }

  const { tenses } = await searchParams;
  const requestedTenses = (tenses?.split(",") ?? []) as Tense[];
  // Only ever pre-select tenses this language's conjugator actually
  // supports -- an unrecognized or unbuilt tense in the query string
  // (hand-edited URL, stale link) is silently dropped rather than 422ing
  // the practice session.
  const initialTenses = requestedTenses.filter((tense) =>
    definition.availableTenses.includes(tense),
  );

  return (
    <ConjugateClient
      code={definition.code}
      definition={definition}
      initialTenses={initialTenses}
    />
  );
};

export default ConjugatePage;
