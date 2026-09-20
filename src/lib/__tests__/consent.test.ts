import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  applyConsent,
  getStoredConsent,
  storeConsent,
} from "../consent";

beforeEach(() => {
  window.localStorage.clear();
  delete window.gtag;
});

describe("getStoredConsent", () => {
  test("returns null when nothing is stored", () => {
    expect(getStoredConsent()).toBeNull();
  });

  test("returns the stored choice when it's a valid value", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    expect(getStoredConsent()).toBe("granted");
  });

  test("returns null for a garbage stored value", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "not-a-real-choice");
    expect(getStoredConsent()).toBeNull();
  });
});

describe("storeConsent", () => {
  test("persists the choice to localStorage", () => {
    storeConsent("denied");
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("denied");
  });

  test("dispatches a CONSENT_CHANGED_EVENT with the choice as detail", () => {
    const listener = vi.fn();
    window.addEventListener(CONSENT_CHANGED_EVENT, listener);
    storeConsent("granted");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toBe("granted");
    window.removeEventListener(CONSENT_CHANGED_EVENT, listener);
  });
});

describe("applyConsent", () => {
  test("calls window.gtag with the consent update payload when gtag exists", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    applyConsent("granted");
    expect(gtag).toHaveBeenCalledWith("consent", "update", { analytics_storage: "granted" });
  });

  test("does nothing (no throw) when window.gtag is undefined", () => {
    expect(() => applyConsent("denied")).not.toThrow();
  });
});
