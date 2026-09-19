import { test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompareThumb from "../CompareThumb";
import type { Video } from "../types";

const video = (overrides: Partial<Video> = {}): Video => ({
  id: "v1",
  youtubeId: "yt1",
  title: "A Title",
  channel: "A Channel",
  durationSeconds: 90,
  difficultyScore: 900,
  likeCount: 2,
  ...overrides,
});

test("renders a real thumbnail image for a real youtube id", () => {
  const { container } = render(<CompareThumb video={video()} onSelect={vi.fn()} disabled={false} />);
  const img = container.querySelector("img") as HTMLImageElement;
  expect(img.src).toContain("https://i.ytimg.com/vi/yt1/hqdefault.jpg");
});

test("shows the play icon instead of a thumbnail for a placeholder video", () => {
  const { container } = render(
    <CompareThumb video={video({ youtubeId: "placeholder-1" })} onSelect={vi.fn()} disabled={false} />,
  );
  expect(container.querySelector("img")).not.toBeInTheDocument();
  expect(container.querySelector("svg")).toBeInTheDocument();
});

test("falls back to the play icon if the thumbnail fails to load", () => {
  const { container } = render(<CompareThumb video={video()} onSelect={vi.fn()} disabled={false} />);
  const img = container.querySelector("img") as HTMLImageElement;
  fireEvent.error(img);
  expect(container.querySelector("img")).not.toBeInTheDocument();
  expect(container.querySelector("svg")).toBeInTheDocument();
});

test("renders the video title", () => {
  render(<CompareThumb video={video({ title: "My Video" })} onSelect={vi.fn()} disabled={false} />);
  expect(screen.getByText("My Video")).toBeInTheDocument();
});

test("calls onSelect when clicked", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<CompareThumb video={video()} onSelect={onSelect} disabled={false} />);
  await user.click(screen.getByRole("button"));
  expect(onSelect).toHaveBeenCalledTimes(1);
});

test("is disabled when disabled is true", () => {
  render(<CompareThumb video={video()} onSelect={vi.fn()} disabled={true} />);
  expect(screen.getByRole("button")).toBeDisabled();
});
