// Illustrates the comparison mechanism explained in WatchHelpButton's
// modal: one video's score rises, the other's falls, like a seesaw tipping
// after a single push. Colors come from the theme's CSS variables so it
// adapts automatically between light and dark mode.
const RankingSeesawGraphic = () => (
  <svg
    viewBox="0 0 280 130"
    width="220"
    height="102"
    fill="none"
    role="img"
    aria-label="A seesaw with one video rising as its difficulty score goes up, and another falling as its score goes down"
  >
    <polygon points="140,72 128,96 152,96" fill="var(--color-border)" />
    <line
      x1="40"
      y1="50"
      x2="240"
      y2="92"
      stroke="var(--color-text-muted)"
      strokeWidth="4"
      strokeLinecap="round"
    />

    <polyline
      points="30,26 40,16 50,26"
      stroke="var(--color-primary)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="40" cy="50" r="14" fill="var(--color-primary)" />
    <polygon points="35,44 35,56 47,50" fill="#fff" />

    <polyline
      points="230,68 240,78 250,68"
      stroke="var(--color-text-muted)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="240"
      cy="92"
      r="14"
      fill="var(--color-surface-alt)"
      stroke="var(--color-border)"
      strokeWidth="2"
    />
    <polygon points="235,86 235,98 247,92" fill="var(--color-text-muted)" />
  </svg>
);

export default RankingSeesawGraphic;
