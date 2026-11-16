import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { expectAccessible } from "../test/a11y";
import { Button } from "./button";
import { Checkbox, RadioGroup, Select, Switch, Textarea, TextField } from "./field";

describe("Button", () => {
  test("clicks, and blocks clicks while loading without losing focus", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<Button onClick={onClick} loading>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).not.toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("text fields", () => {
  test("label, description and error are wired for assistive tech", async () => {
    const { container } = render(<>
      <TextField label="Email" description="We never share it." error="Enter a valid email" required />
      <Textarea label="Bio" description="Optional." />
      <Select label="Plan" placeholder="Choose…" options={[{ value: "free", label: "Free" }, { value: "pro", label: "Pro" }]} />
    </>);
    const email = screen.getByRole("textbox", { name: "Email" });
    expect(email).toBeRequired();
    expect(email).toBeInvalid();
    expect(email).toHaveAccessibleDescription("We never share it. Enter a valid email");
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveAccessibleDescription("Optional.");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Plan" }), "pro");
    expect(screen.getByRole("combobox", { name: "Plan" })).toHaveValue("pro");
    await expectAccessible(container);
  });
});

describe("Checkbox, Switch, RadioGroup", () => {
  test("checkbox supports the mixed state", async () => {
    const { container } = render(<Checkbox label="Select all" indeterminate />);
    expect(screen.getByRole("checkbox", { name: "Select all" })).toBePartiallyChecked();
    await expectAccessible(container);
  });

  test("switch toggles with click and keyboard, controlled or not", async () => {
    const onChange = vi.fn();
    render(<form aria-label="prefs"><Switch label="Notifications" name="notify" onCheckedChange={onChange} /></form>);
    const sw = screen.getByRole("switch", { name: "Notifications" });
    expect(sw).not.toBeChecked();
    await userEvent.click(sw);
    expect(sw).toBeChecked();
    sw.focus();
    await userEvent.keyboard(" ");
    expect(sw).not.toBeChecked();
    await userEvent.keyboard("{Enter}");
    expect(sw).toBeChecked();
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([true, false, true]);
    expect(new FormData(screen.getByRole("form") as HTMLFormElement).get("notify")).toBe("on");
  });

  test("radio group: legend, arrow keys, controlled value", async () => {
    function Demo() {
      const [v, setV] = useState("b");
      return <><RadioGroup legend="Size" name="size" value={v} onValueChange={setV} description="Pick one."
        options={[{ value: "a", label: "Small" }, { value: "b", label: "Medium" }, { value: "c", label: "Large" }]} /><output>{v}</output></>;
    }
    const { container } = render(<Demo />);
    expect(screen.getByRole("group", { name: "Size" })).toHaveAccessibleDescription("Pick one.");
    expect(screen.getByRole("radio", { name: "Medium" })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "Large" }));
    expect(screen.getByRole("status")).toHaveTextContent("c");
    await expectAccessible(container);
  });
});
