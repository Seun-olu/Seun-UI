import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { expectAccessible } from "../test/a11y";
import { Combobox } from "./combobox";
import { Badge, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./display";
import { Tab, TabList, TabPanel, Tabs } from "./tabs";

describe("Tabs", () => {
  test("roving focus with arrows, Home and End; panels are linked to tabs", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Tabs defaultValue="overview" onValueChange={onChange}>
        <TabList aria-label="Project">
          <Tab value="overview">Overview</Tab>
          <Tab value="activity">Activity</Tab>
          <Tab value="settings" disabled>Settings</Tab>
          <Tab value="members">Members</Tab>
        </TabList>
        <TabPanel value="overview">Overview body</TabPanel>
        <TabPanel value="activity">Activity body</TabPanel>
        <TabPanel value="members">Members body</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole("tablist", { name: "Project" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "Overview" })).toHaveTextContent("Overview body");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute("tabindex", "-1");
    await expectAccessible(container);
    await userEvent.tab();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Members" })).toHaveFocus(); // skips disabled
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus(); // wraps
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tabpanel", { name: "Members" })).toHaveTextContent("Members body");
    await userEvent.tab();
    expect(screen.getByRole("tabpanel")).toHaveFocus();
    expect(onChange.mock.calls.map((c) => c[0])).toEqual(["activity", "members", "overview", "members"]);
  });
});

describe("Badge and Card", () => {
  test("render accessible static content", async () => {
    const { container } = render(
      <Card>
        <CardHeader><CardTitle>Billing</CardTitle><CardDescription>Your plan</CardDescription></CardHeader>
        <CardContent>Pro <Badge tone="success">Active</Badge></CardContent>
        <CardFooter>Renews monthly</CardFooter>
      </Card>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Billing" })).toBeInTheDocument();
    await expectAccessible(container);
  });
});

describe("Combobox", () => {
  const fruits = [
    { value: "apple", label: "Apple" }, { value: "apricot", label: "Apricot" }, { value: "banana", label: "Banana" },
    { value: "blueberry", label: "Blueberry", disabled: true }, { value: "cherry", label: "Cherry" },
  ];
  function Demo() {
    const [v, setV] = useState<string | null>(null);
    return <form aria-label="f"><Combobox label="Fruit" options={fruits} value={v} onValueChange={setV} name="fruit" description="Type to filter." /><output>{v ?? "none"}</output></form>;
  }

  test("filters as you type, moves with arrows via aria-activedescendant, Enter selects", async () => {
    const { container } = render(<Demo />);
    const input = screen.getByRole("combobox", { name: "Fruit" });
    expect(input).toHaveAccessibleDescription("Type to filter.");
    await userEvent.type(input, "ap");
    expect(input).toHaveAttribute("aria-expanded", "true");
    const listbox = screen.getByRole("listbox", { name: "Fruit" });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Apple", "Apricot"]);
    await expectAccessible(container);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Apricot" }).id);
    expect(input).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(listbox).not.toBeVisible();
    expect(input).toHaveValue("Apricot");
    expect(screen.getByRole("status")).toHaveTextContent("apricot");
    expect(new FormData(screen.getByRole("form") as HTMLFormElement).get("fruit")).toBe("apricot");
  });

  test("skips disabled options, shows an empty state, Escape restores then clears", async () => {
    render(<Demo />);
    const input = screen.getByRole("combobox", { name: "Fruit" });
    await userEvent.type(input, "b");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Banana" }).id); // wrapped past Blueberry
    await userEvent.click(screen.getByRole("option", { name: "Blueberry" }));
    expect(screen.getByText("none")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("option", { name: "Banana" }));
    expect(input).toHaveValue("Banana");
    await userEvent.clear(input);
    await userEvent.type(input, "zzz");
    expect(screen.getByText("No results")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("leaving the field restores the selected label", async () => {
    render(<><Demo /><button type="button">next</button></>);
    const input = screen.getByRole("combobox", { name: "Fruit" });
    await userEvent.click(input);
    await userEvent.click(screen.getByRole("option", { name: "Cherry" }));
    await userEvent.type(input, "xx");
    await userEvent.tab();
    expect(input).toHaveValue("Cherry");
  });
});
