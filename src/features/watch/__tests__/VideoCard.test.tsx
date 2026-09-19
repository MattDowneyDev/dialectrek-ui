import { test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VideoCard from "../VideoCard";
import type { Video } from "../types";

const video = (overrides: Partial<Video> = {}): Video => ({
  id: "v1",
  youtubeId: "yt1",
  title: "A Title",
  channel: "A Channel",
  durationSeconds: 125,
  difficultyScore: 900,
  likeCount: 3,
  ...overrides,
});

test("renders title, channel, duration, difficulty, and like count", () => {
  render(<VideoCard video={video()} onSelect={vi.fn()} />);
  expect(screen.getByText("A Title")).toBeInTheDocument();
  expect(screen.getByText("A Channel")).toBeInTheDocument();
  expect(screen.getByText("2:05")).toBeInTheDocument();
  expect(screen.getByText("B1 · Intermediate")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
});

test("renders a real thumbnail image for a real youtube id", () => {
  const { container } = render(<VideoCard video={video()} onSelect={vi.fn()} />);
  const img = container.querySelector("img") as HTMLImageElement;
  expect(img.src).toContain("https://i.ytimg.com/vi/yt1/hqdefault.jpg");
});

test("skips the thumbnail image for a placeholder video", () => {
  const { container } = render(<VideoCard video={video({ youtubeId: "placeholder-1" })} onSelect={vi.fn()} />);
  expect(container.querySelector("img")).not.toBeInTheDocument();
});

test("falls back away from the thumbnail if it fails to load", () => {
  const { container } = render(<VideoCard video={video()} onSelect={vi.fn()} />);
  fireEvent.error(container.querySelector("img") as HTMLImageElement);
  expect(container.querySelector("img")).not.toBeInTheDocument();
});

test("calls onSelect with the video id when clicked", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<VideoCard video={video({ id: "v42" })} onSelect={onSelect} />);
  await user.click(screen.getByRole("button"));
  expect(onSelect).toHaveBeenCalledWith("v42");
});
