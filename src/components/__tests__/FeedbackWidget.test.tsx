import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FeedbackWidget from "../FeedbackWidget";

const openModal = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<FeedbackWidget />);
  await user.click(screen.getByRole("button", { name: "Feedback" }));
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("renders a closed floating action button initially", () => {
  render(<FeedbackWidget />);
  expect(screen.getByRole("button", { name: "Feedback" })).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("clicking the FAB opens the feedback form", async () => {
  const user = userEvent.setup();
  await openModal(user);

  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Feedback" })).toBeInTheDocument();
  expect(screen.getByLabelText("Type")).toHaveValue("comment");
});

test("closing via the close button hides the form", async () => {
  const user = userEvent.setup();
  await openModal(user);

  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("clicking the overlay closes the form, but clicking inside it does not", async () => {
  const user = userEvent.setup();
  await openModal(user);

  await user.click(screen.getByRole("heading", { name: "Feedback" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  const overlay = screen.getByRole("dialog").parentElement as HTMLElement;
  await user.click(overlay);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("does not submit when the message is blank or only whitespace", async () => {
  const user = userEvent.setup();
  await openModal(user);

  await user.type(screen.getByLabelText(/Message/), "   ");
  await user.click(screen.getByRole("button", { name: "Send" }));

  expect(global.fetch).not.toHaveBeenCalled();
});

test("submits the form contents and shows a success message", async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response);
  const user = userEvent.setup();
  await openModal(user);

  await user.selectOptions(screen.getByLabelText("Type"), "bug");
  await user.type(screen.getByLabelText(/Message/), "It crashed");
  await user.type(screen.getByLabelText(/Email/), "me@example.com");
  await user.click(screen.getByRole("button", { name: "Send" }));

  await screen.findByRole("heading", { name: "Thanks!" });
  expect(fetch).toHaveBeenCalledWith("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "bug",
      message: "It crashed",
      email: "me@example.com",
      company: "",
    }),
  });

  await user.click(screen.getByText("Close", { selector: "button.btn-primary" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("shows the submitting state while the request is in flight", async () => {
  let resolveFetch: (value: Response) => void = () => {};
  vi.mocked(fetch).mockReturnValue(
    new Promise((resolve) => {
      resolveFetch = resolve;
    }),
  );
  const user = userEvent.setup();
  await openModal(user);

  await user.type(screen.getByLabelText(/Message/), "hello");
  await user.click(screen.getByRole("button", { name: "Send" }));

  const sendingButton = await screen.findByRole("button", { name: "Sending…" });
  expect(sendingButton).toBeDisabled();

  resolveFetch({ ok: true, json: async () => ({}) } as Response);
  await screen.findByRole("heading", { name: "Thanks!" });
});

test("shows the server's error message when the request fails with a known error", async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Please slow down." }),
  } as Response);
  const user = userEvent.setup();
  await openModal(user);

  await user.type(screen.getByLabelText(/Message/), "hello");
  await user.click(screen.getByRole("button", { name: "Send" }));

  expect(await screen.findByText("Please slow down.")).toBeInTheDocument();
});

test("falls back to a generic error message when the server doesn't send one", async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: false,
    json: async () => ({}),
  } as Response);
  const user = userEvent.setup();
  await openModal(user);

  await user.type(screen.getByLabelText(/Message/), "hello");
  await user.click(screen.getByRole("button", { name: "Send" }));

  expect(await screen.findByText("Something went wrong.")).toBeInTheDocument();
});

test("shows a generic error message when fetch throws something other than an Error", async () => {
  vi.mocked(fetch).mockRejectedValue("network exploded");
  const user = userEvent.setup();
  await openModal(user);

  await user.type(screen.getByLabelText(/Message/), "hello");
  await user.click(screen.getByRole("button", { name: "Send" }));

  expect(await screen.findByText("Something went wrong.")).toBeInTheDocument();
});

test("submits whatever gets typed into the honeypot field (a bot filling it in shouldn't crash the form)", async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response);
  const user = userEvent.setup();
  await openModal(user);

  fireEvent.change(document.querySelector('input[name="company"]') as HTMLInputElement, {
    target: { value: "Acme Corp" },
  });
  await user.type(screen.getByLabelText(/Message/), "hello");
  await user.click(screen.getByRole("button", { name: "Send" }));

  await screen.findByRole("heading", { name: "Thanks!" });
  expect(fetch).toHaveBeenCalledWith(
    "/api/feedback",
    expect.objectContaining({ body: expect.stringContaining('"company":"Acme Corp"') }),
  );
});

test("resets its fields each time it's reopened", async () => {
  const user = userEvent.setup();
  await openModal(user);

  await user.type(screen.getByLabelText(/Message/), "draft text");
  await user.click(screen.getByRole("button", { name: "Close" }));

  await user.click(screen.getByRole("button", { name: "Feedback" }));
  expect(screen.getByLabelText(/Message/)).toHaveValue("");
});
