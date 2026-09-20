const iconProps = {
  viewBox: "0 0 24 24",
  width: 26,
  height: 26,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const WatchIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...iconProps}>
    <circle cx="11" cy="11" r="6" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const GridIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </svg>
);

export const StackIcon = () => (
  <svg {...iconProps}>
    <path d="M7 7V5.5A1.5 1.5 0 0 1 8.5 4H18.5A1.5 1.5 0 0 1 20 5.5v10A1.5 1.5 0 0 1 18.5 17H17" />
    <rect x="4" y="7" width="13" height="13" rx="1.5" />
  </svg>
);

export const BookIcon = () => (
  <svg {...iconProps}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11a1 1 0 0 1 1 1v14.5a1 1 0 0 0-1-1H5.5A1.5 1.5 0 0 1 4 17Z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13a1 1 0 0 0-1 1v14.5a1 1 0 0 1 1-1h5.5a1.5 1.5 0 0 0 1.5-1.5Z" />
  </svg>
);
