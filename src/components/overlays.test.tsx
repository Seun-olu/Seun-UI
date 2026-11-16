import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { expectAccessible } from "../test/a11y";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./menu";
import { ToastProvider, useToast } from "./toast";
import { Tooltip } from "./tooltip";

describe("Dialog", () => {
  test("opens from its trigger, is labelled, closes on Escape and returns focus", async () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Dialog trigger={<Button>Delete project</Button>} title="Delete project?" description="This can't be undone." onOpenChange={onOpenChange}
        footer={<Button variant="danger">Delete</Button>} />,
    );
    const trigger = screen.getByRole("button", { name: "Delete project" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Delete project?" });
    expect(dialog).toHaveAccessibleDescription("This can't be undone.");
    await expectAccessible(container);
    act(() => { dialog.dispatchEvent(new Event("cancel", { cancelable: true })); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  test("close button and backdrop click close it; non-dismissible ignores Escape and backdrop", async () => {
    const { rerender } = render(<Dialog defaultOpen title="Hi" />);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<Dialog open dismissible={false} title="Locked" />);
    const d = screen.getByRole("dialog", { name: "Locked" });
    act(() => { d.dispatchEvent(new Event("cancel", { cancelable: true })); });
    await userEvent.click(d);
    expect(screen.getByRole("dialog", { name: "Locked" })).toBeInTheDocument();
  });
});

describe("DropdownMenu", () => {
  function Menu({ onSelect }: { onSelect: (v: string) => void }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger variant="secondary">Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onSelect("edit")}>Edit</DropdownMenuItem>
          <DropdownMenuItem disabled onSelect={() => onSelect("move")}>Move</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSelect("duplicate")}>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => onSelect("delete")}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  test("keyboard: open with ArrowDown, move skipping disabled, typeahead, Enter selects and returns focus", async () => {
    const onSelect = vi.fn();
    const { container } = render(<Menu onSelect={onSelect} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    const menu = screen.getByRole("menu", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
    await expectAccessible(container);
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
    await userEvent.keyboard("d");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("duplicate");
    expect(menu).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  test("ArrowUp opens on the last item; Escape and outside click close", async () => {
    render(<><Menu onSelect={() => {}} /><p>outside</p></>);
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await userEvent.click(screen.getByText("outside"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  test("disabled items can't be activated", async () => {
    const onSelect = vi.fn();
    render(<Menu onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Move" }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("Tooltip", () => {
  test("describes its trigger, shows on focus, hides on Escape", async () => {
    const { container } = render(<Tooltip content="Copies the link"><button type="button">Copy</button></Tooltip>);
    const btn = screen.getByRole("button", { name: "Copy" });
    expect(btn).toHaveAccessibleDescription("Copies the link");
    expect(screen.getByRole("tooltip", { hidden: true })).not.toBeVisible();
    await userEvent.tab();
    expect(btn).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toBeVisible();
    await expectAccessible(container);
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("tooltip", { hidden: true })).not.toBeVisible();
  });
});

describe("Toast", () => {
  function Demo() {
    const { toast } = useToast();
    return <>
      <Button onClick={() => toast({ title: "Saved", description: "Your changes are live.", tone: "success" })}>Save</Button>
      <Button onClick={() => toast({ title: "Upload failed", tone: "error" })}>Fail</Button>
    </>;
  }

  test("announces through live regions, auto-dismisses, and pauses on hover", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<ToastProvider><Demo /></ToastProvider>);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent("Saved. Your changes are live.");
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region).toHaveTextContent("Saved");
    await expectAccessible(container);
    await user.click(screen.getByRole("button", { name: "Fail" }));
    expect(container.querySelector('[aria-live="assertive"]')).toHaveTextContent("Upload failed");

    await user.hover(region);
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(screen.getByText("Saved")).toBeInTheDocument();
    await user.unhover(region);
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(screen.queryByRole("region", { name: "Notifications" })).toBeNull();
    vi.useRealTimers();
  });

  test("dismiss button removes a toast", async () => {
    render(<ToastProvider><Demo /></ToastProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss: Saved" }));
    expect(screen.queryByText("Saved", { selector: "p" })).toBeNull();
  });
});
