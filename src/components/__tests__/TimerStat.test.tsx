import { expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimerStat from "../TimerStat";

test("renders formatted elapsed time and label when not editable", () => {
  const { container } = render(
    <TimerStat seconds={65} label="Elapsed" currentLimitMinutes={5} />,
  );
  expect(screen.getByText("1:05")).toBeInTheDocument();
  expect(screen.getByText("Elapsed")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(container.querySelector(".stat-card")).not.toHaveClass("timer-editable");
});

test("shows a 'Set timer' prompt when no limit has been chosen yet", () => {
  render(<TimerStat seconds={0} label="Elapsed" />);
  expect(screen.getByText("Set timer")).toBeInTheDocument();
});

test("applies the low-time class when lowTime is true", () => {
  const { container } = render(
    <TimerStat seconds={5} label="Elapsed" lowTime currentLimitMinutes={1} />,
  );
  expect(container.querySelector(".stat-card")).toHaveClass("low-time");
});

test("pads single-digit seconds", () => {
  render(<TimerStat seconds={61} label="Elapsed" currentLimitMinutes={5} />);
  expect(screen.getByText("1:01")).toBeInTheDocument();
});

test("editable timer opens a preset dropdown and picks a preset", async () => {
  const onSetLimitMinutes = vi.fn();
  const user = userEvent.setup();
  render(
    <TimerStat
      seconds={0}
      label="Elapsed"
      currentLimitMinutes={5}
      onSetLimitMinutes={onSetLimitMinutes}
    />,
  );

  const mainButton = screen.getByRole("button", { name: /Set timer|1:00|0:00/ });
  await user.click(mainButton);

  const fiveMinChip = screen.getByRole("button", { name: "5 min" });
  expect(fiveMinChip).toHaveClass("selected");

  await user.click(screen.getByRole("button", { name: "10 min" }));
  expect(onSetLimitMinutes).toHaveBeenCalledWith(10);
  expect(screen.queryByRole("button", { name: "10 min" })).not.toBeInTheDocument();
});

test("choosing 'No limit' calls back with null", async () => {
  const onSetLimitMinutes = vi.fn();
  const user = userEvent.setup();
  render(
    <TimerStat
      seconds={0}
      label="Elapsed"
      currentLimitMinutes={5}
      onSetLimitMinutes={onSetLimitMinutes}
    />,
  );

  await user.click(screen.getByRole("button", { name: /0:00/ }));
  await user.click(screen.getByRole("button", { name: "No limit" }));
  expect(onSetLimitMinutes).toHaveBeenCalledWith(null);
});

test("clicking the toggle button again while open closes the dropdown", async () => {
  const onSetLimitMinutes = vi.fn();
  const user = userEvent.setup();
  render(
    <TimerStat
      seconds={0}
      label="Elapsed"
      currentLimitMinutes={5}
      onSetLimitMinutes={onSetLimitMinutes}
    />,
  );

  const mainButton = screen.getByRole("button", { name: /0:00/ });
  await user.click(mainButton);
  expect(screen.getByRole("button", { name: "No limit" })).toBeInTheDocument();

  await user.click(mainButton);
  expect(screen.queryByRole("button", { name: "No limit" })).not.toBeInTheDocument();
});

test("clicking the backdrop closes the dropdown", async () => {
  const onSetLimitMinutes = vi.fn();
  const user = userEvent.setup();
  const { container } = render(
    <TimerStat
      seconds={0}
      label="Elapsed"
      currentLimitMinutes={5}
      onSetLimitMinutes={onSetLimitMinutes}
    />,
  );

  await user.click(screen.getByRole("button", { name: /0:00/ }));
  const backdrop = container.querySelector(".timer-dropdown-backdrop") as HTMLElement;
  await user.click(backdrop);
  expect(screen.queryByRole("button", { name: "No limit" })).not.toBeInTheDocument();
});

test("switching to the custom wheel and committing a value", async () => {
  const onSetLimitMinutes = vi.fn();
  const user = userEvent.setup();
  render(
    <TimerStat
      seconds={0}
      label="Elapsed"
      currentLimitMinutes={5}
      onSetLimitMinutes={onSetLimitMinutes}
    />,
  );

  await user.click(screen.getByRole("button", { name: /0:00/ }));
  await user.click(screen.getByRole("button", { name: "Custom" }));

  expect(screen.getByText("min")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Set" }));

  expect(onSetLimitMinutes).toHaveBeenCalledWith(5);
  expect(screen.queryByText("min")).not.toBeInTheDocument();
});

test("scrolling the wheel updates the highlighted minute, which Set then commits", async () => {
  const onSetLimitMinutes = vi.fn();
  const user = userEvent.setup();
  const { container } = render(
    <TimerStat
      seconds={0}
      label="Elapsed"
      currentLimitMinutes={5}
      onSetLimitMinutes={onSetLimitMinutes}
    />,
  );

  await user.click(screen.getByRole("button", { name: /0:00/ }));
  await user.click(screen.getByRole("button", { name: "Custom" }));

  const wheel = container.querySelector(".timer-wheel") as HTMLElement;
  wheel.scrollTop = 36 * 9; // scrolled to the 10th item (36px per row)
  fireEvent.scroll(wheel);

  await waitFor(() => {
    expect(screen.getByText("10")).toHaveClass("active");
  });

  await user.click(screen.getByRole("button", { name: "Set" }));
  expect(onSetLimitMinutes).toHaveBeenCalledWith(10);
});

test("coalesces a rapid second scroll into the frame already scheduled by the first", async () => {
  const onSetLimitMinutes = vi.fn();
  const user = userEvent.setup();
  const { container } = render(
    <TimerStat
      seconds={0}
      label="Elapsed"
      currentLimitMinutes={5}
      onSetLimitMinutes={onSetLimitMinutes}
    />,
  );

  await user.click(screen.getByRole("button", { name: /0:00/ }));
  await user.click(screen.getByRole("button", { name: "Custom" }));

  const wheel = container.querySelector(".timer-wheel") as HTMLElement;
  // Fired back-to-back, before the first rAF-scheduled update runs -- the
  // second scroll should be swallowed by the in-flight-frame guard, so only
  // the first scroll's position (item 5, not 10) ends up committed.
  wheel.scrollTop = 36 * 4;
  fireEvent.scroll(wheel);
  wheel.scrollTop = 36 * 9;
  fireEvent.scroll(wheel);

  await waitFor(() => {
    expect(screen.getByText("5")).toHaveClass("active");
  });
  expect(screen.getByText("10")).not.toHaveClass("active");
});

test("custom wheel starts from the default when no limit is currently chosen", async () => {
  const onSetLimitMinutes = vi.fn();
  const user = userEvent.setup();
  render(
    <TimerStat
      seconds={0}
      label="Elapsed"
      onSetLimitMinutes={onSetLimitMinutes}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Set timer" }));
  await user.click(screen.getByRole("button", { name: "Custom" }));
  await user.click(screen.getByRole("button", { name: "Set" }));

  expect(onSetLimitMinutes).toHaveBeenCalledWith(5);
});
