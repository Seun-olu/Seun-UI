import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { expectAccessible } from "../test/a11y";
import { DataTable, type ColumnDef } from "./data-table";

interface Person { id: string; name: string; role: string; age: number }
const people: Person[] = Array.from({ length: 25 }, (_, i) => ({
  id: `p${i}`, name: `Person ${String(i + 1).padStart(2, "0")}`, role: i % 3 === 0 ? "Engineer" : i % 3 === 1 ? "Designer" : "Manager", age: 20 + ((i * 7) % 30),
}));
const columns: ColumnDef<Person, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "age", header: "Age" },
];
const bodyRows = () => within(screen.getAllByRole("rowgroup")[1]!).getAllByRole("row");
const firstCells = () => bodyRows().map((r) => within(r).getAllByRole("cell").at(-3)!.textContent);

describe("DataTable", () => {
  test("captioned table with sortable headers exposed through aria-sort", async () => {
    const { container } = render(<DataTable data={people} columns={columns} caption="Team" getRowId={(r) => r.id} pageSize={5} />);
    expect(screen.getByRole("table", { name: "Team" })).toBeInTheDocument();
    const ageHeader = screen.getByRole("columnheader", { name: /Age/ });
    expect(ageHeader).toHaveAttribute("aria-sort", "none");
    await expectAccessible(container);
    await userEvent.click(within(ageHeader).getByRole("button"));
    expect(ageHeader).toHaveAttribute("aria-sort", "ascending");
    expect(within(bodyRows()[0]!).getAllByRole("cell")[2]).toHaveTextContent("20");
    await userEvent.click(within(ageHeader).getByRole("button"));
    expect(ageHeader).toHaveAttribute("aria-sort", "descending");
    expect(within(bodyRows()[0]!).getAllByRole("cell")[2]).toHaveTextContent("49");
  });

  test("filter, pagination and an empty state", async () => {
    render(<DataTable data={people} columns={columns} caption="Team" enableFilter pageSize={10} />);
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(10);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(firstCells()[0]).toBe("Person 11");
    await userEvent.type(screen.getByRole("searchbox", { name: "Filter" }), "designer");
    expect(screen.getByRole("status")).toHaveTextContent("8 rows");
    expect(screen.queryByRole("navigation")).toBeNull(); // one page left, back on page 1
    await userEvent.type(screen.getByRole("searchbox", { name: "Filter" }), "zzz");
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  test("row selection with a tri-state header box reports selected rows", async () => {
    const onSelectionChange = vi.fn();
    render(<DataTable data={people} columns={columns} caption="Team" getRowId={(r) => r.id} pageSize={5} enableSelection onSelectionChange={onSelectionChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Select row 2" }));
    expect(screen.getByRole("checkbox", { name: "Select all rows on this page" })).toBePartiallyChecked();
    expect(onSelectionChange).toHaveBeenLastCalledWith([people[1]]);
    expect(bodyRows()[1]).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
    expect(onSelectionChange.mock.lastCall![0]).toHaveLength(5);
    expect(screen.getByRole("status")).toHaveTextContent("25 rows, 5 selected");
  });

  test("virtualized mode renders a window of rows with correct aria-rowindex", () => {
    // jsdom has no layout: give the scroll box a 400px height so the virtualizer has a viewport.
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 400, width: 800, height: 400, toJSON() {} });
    const many = Array.from({ length: 5000 }, (_, i) => ({ ...people[0]!, id: `r${i}`, name: `Row ${i}` }));
    render(<DataTable data={many} columns={columns} caption="Big" getRowId={(r) => r.id} virtualize={{ height: 400, rowHeight: 40 }} />);
    const rendered = bodyRows().filter((r) => !r.hasAttribute("aria-hidden"));
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(40);
    expect(rendered[0]).toHaveAttribute("aria-rowindex", "2");
    expect(screen.getByRole("table", { name: "Big" })).toHaveAttribute("aria-rowcount", "5001");
    expect(screen.getByRole("status")).toHaveTextContent("5000 rows");
    vi.restoreAllMocks();
  });
});
