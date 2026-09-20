import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout, { metadata, viewport } from "../layout";

vi.mock("../../components/Navbar", () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock("../../components/Footer", () => ({ default: () => <div data-testid="footer" /> }));
vi.mock("../../components/FeedbackWidget", () => ({
  default: () => <div data-testid="feedback-widget" />,
}));
vi.mock("../../components/ThemeToggle", () => ({
  default: () => <div data-testid="theme-toggle" />,
}));
vi.mock("../../components/CookieConsentBanner", () => ({
  default: () => <div data-testid="cookie-banner" />,
}));
vi.mock("../../context/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@vercel/analytics/next", () => ({ Analytics: () => <div data-testid="analytics" /> }));
vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />,
}));
vi.mock("next/script", () => ({
  default: ({ children }: { children?: React.ReactNode }) => <script>{children}</script>,
}));

test("renders the shared page chrome around its children", () => {
  render(
    <RootLayout>
      <div data-testid="page-content">hello</div>
    </RootLayout>,
  );
  expect(screen.getByTestId("navbar")).toBeInTheDocument();
  expect(screen.getByTestId("footer")).toBeInTheDocument();
  expect(screen.getByTestId("feedback-widget")).toBeInTheDocument();
  expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  expect(screen.getByTestId("cookie-banner")).toBeInTheDocument();
  expect(screen.getByTestId("analytics")).toBeInTheDocument();
  expect(screen.getByTestId("speed-insights")).toBeInTheDocument();
  expect(screen.getByTestId("page-content")).toBeInTheDocument();
});

test("sets the default site metadata and title template", () => {
  expect(metadata.title).toEqual({ default: "DialecTrek", template: "%s | DialecTrek" });
  expect(metadata.manifest).toBe("/manifest.json");
  expect(metadata.openGraph?.siteName).toBe("DialecTrek");
});

test("sets a mobile-friendly viewport with the brand theme color", () => {
  expect(viewport.themeColor).toBe("#0E7C5A");
  expect(viewport.width).toBe("device-width");
});
