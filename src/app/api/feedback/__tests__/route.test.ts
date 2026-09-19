import { test, expect, vi, beforeEach, afterEach } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({ emails: { send: sendMock } })),
}));

const { POST } = await import("../route");

let ipCounter = 0;
const nextIp = () => `10.0.0.${++ipCounter}`;

const makeRequest = (body: unknown, ip: string) =>
  new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ error: null });
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.stubEnv("CONTACT_EMAIL", "owner@example.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("silently succeeds without sending an email when the honeypot field is filled", async () => {
  const response = await POST(makeRequest({ message: "hi", company: "Acme" }, nextIp()));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(sendMock).not.toHaveBeenCalled();
});

test("rejects a request with no message", async () => {
  const response = await POST(makeRequest({}, nextIp()));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Please include a message." });
});

test("rejects a whitespace-only message", async () => {
  const response = await POST(makeRequest({ message: "   " }, nextIp()));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Please include a message." });
});

test("rejects a message over the max length", async () => {
  const response = await POST(
    makeRequest({ message: "a".repeat(5001) }, nextIp()),
  );
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Message is too long." });
});

test("rejects an invalid email address", async () => {
  const response = await POST(
    makeRequest({ message: "hello", email: "not-an-email" }, nextIp()),
  );
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Please enter a valid email." });
});

test("rejects a body that isn't valid JSON", async () => {
  const request = new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: { "x-forwarded-for": nextIp() },
    body: "not json",
  });
  const response = await POST(request);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Invalid request body." });
});

test("returns 503 when the feedback backend isn't configured", async () => {
  vi.stubEnv("RESEND_API_KEY", "");
  const response = await POST(makeRequest({ message: "hello" }, nextIp()));
  expect(response.status).toBe(503);
  expect(sendMock).not.toHaveBeenCalled();
});

test("sends a labeled email for a recognized feedback type and a valid email", async () => {
  const ip = nextIp();
  const response = await POST(
    makeRequest({ type: "bug", message: "it broke", email: "user@example.com" }, ip),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(sendMock).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "owner@example.com",
      replyTo: "user@example.com",
      subject: "DialecTrek feedback: Bug report",
    }),
  );
});

test("falls back to the 'comment' type label for an unrecognized type", async () => {
  const response = await POST(
    makeRequest({ type: "nonsense", message: "hello" }, nextIp()),
  );
  expect(response.status).toBe(200);
  expect(sendMock).toHaveBeenCalledWith(
    expect.objectContaining({ subject: "DialecTrek feedback: Comment" }),
  );
});

test("returns 502 when Resend reports an error", async () => {
  sendMock.mockResolvedValue({ error: { message: "boom" } });
  const response = await POST(makeRequest({ message: "hello" }, nextIp()));
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({
    error: "Couldn't send your message. Please try again.",
  });
});

test("rate limits after the fixed number of requests per IP within the window", async () => {
  const ip = nextIp();
  for (let i = 0; i < 5; i++) {
    const response = await POST(makeRequest({ message: `msg ${i}` }, ip));
    expect(response.status).toBe(200);
  }
  const limited = await POST(makeRequest({ message: "one too many" }, ip));
  expect(limited.status).toBe(429);
  expect(await limited.json()).toEqual({
    error: "Too many submissions. Please try again later.",
  });
});

test("tracks rate limits per IP independently", async () => {
  const ip = nextIp();
  for (let i = 0; i < 5; i++) {
    await POST(makeRequest({ message: `msg ${i}` }, ip));
  }
  const otherIp = nextIp();
  const response = await POST(makeRequest({ message: "hello from elsewhere" }, otherIp));
  expect(response.status).toBe(200);
});

test("falls back to 'unknown' when there's no x-forwarded-for header", async () => {
  const request = new Request("http://localhost/api/feedback", {
    method: "POST",
    body: JSON.stringify({ message: "hello" }),
  });
  const response = await POST(request);
  expect(response.status).toBe(200);
});
