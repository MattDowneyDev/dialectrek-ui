import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import GoalBar from "../GoalBar";

const label = () => document.querySelector(".goal-bar-label")?.textContent;

const baseProps = {
  caption: "Today's goal",
  editLabel: "Change the goal",
  subjectLabel: "goal",
  completeLabel: "Goal reached!",
  ctaLabel: "Set a goal",
};

describe("unset target", () => {
  test("shows the CTA label instead of a time", () => {
    render(<GoalBar {...baseProps} elapsedSeconds={0} targetSeconds={undefined} onChangeTarget={vi.fn()} />);
    expect(label()).toBe("Set a goal");
  });

  test("renders no fill, and the label falls back to a plain (non-white) style", () => {
    render(<GoalBar {...baseProps} elapsedSeconds={0} targetSeconds={undefined} onChangeTarget={vi.fn()} />);
    expect(document.querySelector(".goal-bar-fill")).not.toBeInTheDocument();
    expect(document.querySelector(".goal-bar-label--plain")).toBeInTheDocument();
  });
});

describe("real target", () => {
  test("shows elapsed / target", () => {
    render(<GoalBar {...baseProps} elapsedSeconds={90} targetSeconds={600} onChangeTarget={vi.fn()} />);
    expect(label()).toBe("1:30 / 10:00");
  });

  test("renders a fill sized to the percentage complete", () => {
    render(<GoalBar {...baseProps} elapsedSeconds={300} targetSeconds={600} onChangeTarget={vi.fn()} />);
    expect(document.querySelector(".goal-bar-fill")).toHaveStyle({ width: "50%" });
  });

  test("switches to the complete label and style once elapsed reaches the target", () => {
    render(<GoalBar {...baseProps} elapsedSeconds={600} targetSeconds={600} onChangeTarget={vi.fn()} />);
    expect(label()).toBe("Goal reached! 10:00");
    expect(document.querySelector(".goal-bar-fill--complete")).toBeInTheDocument();
  });

  test("caps the fill at 100% past the target", () => {
    render(<GoalBar {...baseProps} elapsedSeconds={900} targetSeconds={600} onChangeTarget={vi.fn()} />);
    expect(document.querySelector(".goal-bar-fill")).toHaveStyle({ width: "100%" });
  });
});

describe("no limit", () => {
  test("shows a plain elapsed count with no fill", () => {
    render(<GoalBar {...baseProps} elapsedSeconds={45} targetSeconds={null} onChangeTarget={vi.fn()} />);
    expect(label()).toBe("0:45");
    expect(document.querySelector(".goal-bar-fill")).not.toBeInTheDocument();
    expect(document.querySelector(".goal-bar-label--plain")).toBeInTheDocument();
  });
});

describe("editable", () => {
  test("renders as a clickable button by default", () => {
    render(<GoalBar {...baseProps} elapsedSeconds={0} targetSeconds={600} onChangeTarget={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Change the goal" })).toBeInTheDocument();
  });

  test("renders as a plain non-interactive display when editable is false", () => {
    render(
      <GoalBar
        {...baseProps}
        elapsedSeconds={0}
        targetSeconds={600}
        onChangeTarget={vi.fn()}
        editable={false}
      />,
    );
    expect(screen.queryByRole("button", { name: "Change the goal" })).not.toBeInTheDocument();
    expect(label()).toBe("0:00 / 10:00");
  });
});

describe("the stepper", () => {
  test("+/- adjust by stepMinutes and call onChangeTarget immediately", () => {
    const onChangeTarget = vi.fn();
    render(
      <GoalBar {...baseProps} elapsedSeconds={0} targetSeconds={600} onChangeTarget={onChangeTarget} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change the goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase goal by 5 minutes" }));
    expect(onChangeTarget).toHaveBeenCalledWith(15);
  });

  test("does not go below minMinutes", () => {
    const onChangeTarget = vi.fn();
    render(
      <GoalBar
        {...baseProps}
        elapsedSeconds={0}
        targetSeconds={300}
        onChangeTarget={onChangeTarget}
        minMinutes={5}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change the goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Decrease goal by 5 minutes" }));
    expect(onChangeTarget).toHaveBeenCalledWith(5);
  });

  test("respects a custom stepMinutes", () => {
    const onChangeTarget = vi.fn();
    render(
      <GoalBar
        {...baseProps}
        elapsedSeconds={0}
        targetSeconds={600}
        onChangeTarget={onChangeTarget}
        stepMinutes={1}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change the goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase goal by 1 minutes" }));
    expect(onChangeTarget).toHaveBeenCalledWith(11);
  });

  test("typing a value and blurring commits it", () => {
    const onChangeTarget = vi.fn();
    render(
      <GoalBar {...baseProps} elapsedSeconds={0} targetSeconds={600} onChangeTarget={onChangeTarget} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change the goal" }));
    fireEvent.change(screen.getByLabelText("goal in minutes"), { target: { value: "25" } });
    fireEvent.blur(screen.getByLabelText("goal in minutes"));
    expect(onChangeTarget).toHaveBeenCalledWith(25);
  });

  test("clearing the input and blurring reverts instead of applying nothing", () => {
    const onChangeTarget = vi.fn();
    render(
      <GoalBar {...baseProps} elapsedSeconds={0} targetSeconds={600} onChangeTarget={onChangeTarget} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change the goal" }));
    fireEvent.change(screen.getByLabelText("goal in minutes"), { target: { value: "" } });
    fireEvent.blur(screen.getByLabelText("goal in minutes"));
    expect(onChangeTarget).not.toHaveBeenCalled();
    expect(screen.getByLabelText("goal in minutes")).toHaveValue(10);
  });

  test("seeds the input from minMinutes when nothing is set yet", () => {
    render(
      <GoalBar
        {...baseProps}
        elapsedSeconds={0}
        targetSeconds={undefined}
        onChangeTarget={vi.fn()}
        minMinutes={5}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change the goal" }));
    expect(screen.getByLabelText("goal in minutes")).toHaveValue(5);
  });

  test("clicking outside the picker closes it", () => {
    render(<GoalBar {...baseProps} elapsedSeconds={0} targetSeconds={600} onChangeTarget={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Change the goal" }));
    expect(screen.getByLabelText("goal in minutes")).toBeInTheDocument();
    fireEvent.click(document.querySelector(".timer-dropdown-backdrop") as Element);
    expect(screen.queryByLabelText("goal in minutes")).not.toBeInTheDocument();
  });
});

describe("allowNoLimit", () => {
  test("is not offered by default", () => {
    render(<GoalBar {...baseProps} elapsedSeconds={0} targetSeconds={600} onChangeTarget={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Change the goal" }));
    expect(screen.queryByRole("button", { name: "No limit" })).not.toBeInTheDocument();
  });

  test("when enabled, choosing it calls onChangeTarget(null) and closes the picker", () => {
    const onChangeTarget = vi.fn();
    render(
      <GoalBar
        {...baseProps}
        elapsedSeconds={0}
        targetSeconds={600}
        onChangeTarget={onChangeTarget}
        allowNoLimit
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change the goal" }));
    fireEvent.click(screen.getByRole("button", { name: "No limit" }));
    expect(onChangeTarget).toHaveBeenCalledWith(null);
    expect(screen.queryByLabelText("goal in minutes")).not.toBeInTheDocument();
  });
});
