"use client";

import { useState, type FormEvent } from "react";
import { formatDuration } from "../lib/duration";

export type GoalBarProps = {
  // Seconds elapsed toward the current target (or just counted up, if
  // there's no target/limit set at all).
  elapsedSeconds: number;
  // A number is a real target -- the bar fills toward it and celebrates at
  // 100%. null is an explicit "no limit" -- shows a plain elapsed count
  // with no fill/percentage. undefined means nothing's been chosen yet --
  // shows ctaLabel as a prompt to pick one.
  targetSeconds: number | null | undefined;
  // Called with the chosen target in minutes (or null for "no limit") when
  // the viewer picks or adjusts one via the stepper.
  onChangeTarget: (minutes: number | null) => void;
  caption: string;
  // Accessible name for the clickable bar, e.g. "Change today's watch goal".
  editLabel: string;
  // What the stepper's own controls call the thing they adjust, e.g.
  // "goal" or "time limit" -- built into their aria-labels ("Increase
  // {subjectLabel} by 5 minutes") so a screen reader user gets useful
  // context without this component needing to know the exact wording of
  // every feature that embeds it.
  subjectLabel: string;
  // Shown once elapsedSeconds reaches targetSeconds, e.g. "Goal reached!".
  completeLabel: string;
  // Shown on the bar before any target has been chosen.
  ctaLabel: string;
  // False once nothing should be editable anymore (e.g. a practice
  // session's time is already up) -- the bar becomes a plain, non-clickable
  // display, matching how a real target is never un-set once reached.
  editable?: boolean;
  // Offers an explicit "No limit" choice in the picker alongside the
  // stepper -- a practice session's time limit wants this, a standing daily
  // goal (which wouldn't mean much with no limit at all) doesn't.
  allowNoLimit?: boolean;
  minMinutes?: number;
  stepMinutes?: number;
};

const DEFAULT_MIN_MINUTES = 5;
const DEFAULT_STEP_MINUTES = 5;

const GoalBar = ({
  elapsedSeconds,
  targetSeconds,
  onChangeTarget,
  caption,
  editLabel,
  subjectLabel,
  completeLabel,
  ctaLabel,
  editable = true,
  allowNoLimit = false,
  minMinutes = DEFAULT_MIN_MINUTES,
  stepMinutes = DEFAULT_STEP_MINUTES,
}: GoalBarProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [inputMinutes, setInputMinutes] = useState("");

  const hasTarget = typeof targetSeconds === "number";
  const isUnset = targetSeconds === undefined;
  const goalReached = hasTarget && elapsedSeconds >= targetSeconds;
  const progressPercent = hasTarget
    ? Math.min(100, (elapsedSeconds / targetSeconds) * 100)
    : 0;

  const togglePicker = () => {
    setIsPickerOpen((open) => {
      // Resyncs the input to the real target each time the picker opens, so
      // it never shows a stale value left over from a previous open/close.
      setInputMinutes(String(hasTarget ? Math.round(targetSeconds / 60) : minMinutes));
      return !open;
    });
  };

  // Applies immediately (both +/- and a typed value use this) rather than
  // waiting for an explicit "Set" button -- one fewer control to press, and
  // the picker stays open afterward so several adjustments can be made in a
  // row without reopening it each time.
  const applyTarget = (minutes: number) => {
    onChangeTarget(minutes);
    setInputMinutes(String(minutes));
  };

  const adjustTarget = (deltaMinutes: number) => {
    const currentMinutes = hasTarget ? Math.round(targetSeconds / 60) : minMinutes;
    applyTarget(Math.max(minMinutes, currentMinutes + deltaMinutes));
  };

  const commitInput = () => {
    const minutes = Number(inputMinutes);
    if (Number.isFinite(minutes) && minutes > 0) {
      applyTarget(Math.round(minutes));
    } else {
      // An empty or invalid edit-in-progress reverts to the real target
      // instead of silently keeping whatever partial text was typed.
      setInputMinutes(String(hasTarget ? Math.round(targetSeconds / 60) : minMinutes));
    }
  };

  const submitInput = (event: FormEvent) => {
    event.preventDefault();
    commitInput();
  };

  const chooseNoLimit = () => {
    onChangeTarget(null);
    setIsPickerOpen(false);
  };

  let label: string;
  if (isUnset) {
    label = ctaLabel;
  } else if (goalReached) {
    label = `${completeLabel} ${formatDuration(elapsedSeconds)}`;
  } else if (hasTarget) {
    label = `${formatDuration(elapsedSeconds)} / ${formatDuration(targetSeconds)}`;
  } else {
    label = formatDuration(elapsedSeconds);
  }

  const trackContent = (
    <>
      {hasTarget && (
        <span
          className={`goal-bar-fill${goalReached ? " goal-bar-fill--complete" : ""}`}
          style={{ width: `${progressPercent}%` }}
        />
      )}
      {/* Without a fill behind it (nothing chosen yet, or "no limit"), the
          label's white text needs a dark color instead -- it'd otherwise
          sit directly on the plain track background with poor contrast. */}
      <span className={`goal-bar-label${hasTarget ? "" : " goal-bar-label--plain"}`}>
        <span className="goal-bar-caption">{caption}</span>
        <span className="goal-bar-value">{label}</span>
      </span>
    </>
  );

  return (
    <div className="goal-bar">
      {editable ? (
        <button
          type="button"
          className="goal-bar-track"
          onClick={togglePicker}
          aria-expanded={isPickerOpen}
          aria-label={editLabel}
        >
          {trackContent}
        </button>
      ) : (
        <div className="goal-bar-track">{trackContent}</div>
      )}
      {editable && isPickerOpen && (
        <>
          <div className="timer-dropdown-backdrop" onClick={() => setIsPickerOpen(false)} />
          <div className="timer-dropdown goal-bar-dropdown">
            <form className="goal-bar-stepper" onSubmit={submitInput}>
              <button
                type="button"
                className="goal-bar-stepper-button"
                onClick={() => adjustTarget(-stepMinutes)}
                aria-label={`Decrease ${subjectLabel} by ${stepMinutes} minutes`}
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                className="goal-bar-stepper-input"
                value={inputMinutes}
                onChange={(event) => setInputMinutes(event.target.value)}
                onBlur={commitInput}
                aria-label={`${subjectLabel} in minutes`}
              />
              <span className="goal-bar-stepper-unit">min</span>
              <button
                type="button"
                className="goal-bar-stepper-button"
                onClick={() => adjustTarget(stepMinutes)}
                aria-label={`Increase ${subjectLabel} by ${stepMinutes} minutes`}
              >
                +
              </button>
            </form>
            {allowNoLimit && (
              <button type="button" className="goal-bar-nolimit-button" onClick={chooseNoLimit}>
                No limit
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GoalBar;
