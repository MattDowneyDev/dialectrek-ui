import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";
import { pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How DialecTrek handles cookies and analytics data.",
  path: "/privacy",
});

const PrivacyPage = () => {
  return (
    <div className="page">
      <PageHeader
        title="Privacy Policy"
        subtitle="Last updated September 2026"
      />

      <div className="about-content">
        <h2>What we collect</h2>
        <p>
          DialecTrek doesn&apos;t require an account, and verb lookups,
          conjugation practice, and flashcards don&apos;t send us any
          personal information. If you use the feedback widget, we receive
          whatever you write and, only if you choose to share it, your email
          address so we can reply.
        </p>
        <p>
          Some features remember things only in your own browser&apos;s local
          storage -- your daily practice goals and progress for Watch,
          Flashcards, and Conjugate, which videos you&apos;ve liked or
          disliked, and your theme and cookie preferences. None of that is
          sent to us; it stays on your device and resets if you clear your
          browser&apos;s site data.
        </p>

        <h2>Cookies, analytics, and embedded video</h2>
        <p>
          We use Google Analytics to understand which pages and features get
          used, so we can improve them. Google Analytics is off by default:
          it only sets cookies and starts measuring after you accept cookies
          in the banner shown on your first visit. If you decline, no Google
          Analytics cookies are set and no analytics data is sent for you.
        </p>
        <p>
          The Watch feature plays videos directly from YouTube using
          Google&apos;s official, privacy-enhanced YouTube player
          (youtube-nocookie.com). Like analytics, this only loads
          automatically if you&apos;ve accepted cookies in that same banner.
          If you&apos;ve declined, videos show a thumbnail instead, and
          clicking it to play loads that one video and accepts
          YouTube&apos;s cookies for it -- your choice on the banner isn&apos;t
          changed and no other video is affected. Loading a video lets
          YouTube (Google) set its own cookies and collect data about the
          view, governed by the{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Privacy Policy
          </a>
          . We don&apos;t control what Google collects through the player or
          how long it&apos;s kept; see that policy for your options.
        </p>
        <p>
          We also use Vercel Analytics and Vercel Speed Insights to track
          overall traffic and page performance. These run without cookies or
          any personal identifiers and don&apos;t require consent.
        </p>

        <h2>Your choices</h2>
        <p>
          You can change your cookie choice at any time using the
          &quot;Cookie preferences&quot; link in the footer of any page.
          Declining doesn&apos;t block the Watch feature -- each video can
          still be loaded individually with a click, as described above.
        </p>

        <h2>Third parties</h2>
        <p>
          We share data with Google (Google Analytics and, for the Watch
          feature, the YouTube player) and Vercel (hosting, analytics, and
          speed insights) only as described above. We don&apos;t sell your
          data or use it for advertising.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Reach out through the feedback button
          in the corner of any page.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;
