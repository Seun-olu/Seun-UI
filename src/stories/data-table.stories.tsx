import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "../components/display";
import { DataTable, type ColumnDef } from "../components/data-table";

interface Invoice { id: string; customer: string; amount: number; status: "paid" | "due" | "overdue" }
const customers = ["Ada Ltd", "Bolt & Co", "Cedar Health", "Delta Freight", "Ember Studio", "Fable Foods"];
const invoices: Invoice[] = Array.from({ length: 48 }, (_, i) => ({
  id: `INV-${String(1000 + i)}`, customer: customers[i % customers.length]!, amount: ((i * 7919) % 50000) / 100 + 20,
  status: (["paid", "due", "overdue"] as const)[i % 3]!,
}));
const tone = { paid: "success", due: "neutral", overdue: "danger" } as const;
const columns: ColumnDef<Invoice, unknown>[] = [
  { accessorKey: "id", header: "Invoice" },
  { accessorKey: "customer", header: "Customer" },
  { accessorKey: "amount", header: "Amount", cell: (c) => `£${(c.getValue() as number).toFixed(2)}` },
  { accessorKey: "status", header: "Status", cell: (c) => <Badge tone={tone[c.getValue() as Invoice["status"]]}>{c.getValue() as string}</Badge> },
];

const meta = {
  title: "Data/DataTable",
  component: DataTable<Invoice>,
  args: { data: invoices, columns, caption: "Invoices", getRowId: (r: Invoice) => r.id, enableFilter: true, enableSelection: true, pageSize: 10 },
} satisfies Meta<typeof DataTable<Invoice>>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Paginated: Story = {};
export const Virtualized: Story = {
  args: {
    data: Array.from({ length: 10000 }, (_, i) => ({ ...invoices[i % invoices.length]!, id: `INV-${100000 + i}` })),
    caption: "10,000 invoices", virtualize: { height: 420 }, enableSelection: false,
  },
};
export const Empty: Story = { args: { data: [], caption: "No invoices", enableSelection: false } };
