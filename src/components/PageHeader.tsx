import BackLink from "./BackLink";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backTo?: { to: string; label: string } | { onClick: () => void; label: string };
  // For titles that come from user/creator content rather than our own copy
  // (e.g. a YouTube video title) and can run much longer than a normal page
  // title -- shrinks the heading and clamps it to a few lines instead of
  // letting it fill the screen.
  compact?: boolean;
};

const PageHeader = ({ title, subtitle, backTo, compact }: PageHeaderProps) => (
  <div className={`page-header${compact ? " page-header--compact" : ""}`}>
    {backTo && <BackLink {...backTo} />}
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
  </div>
);

export default PageHeader;
