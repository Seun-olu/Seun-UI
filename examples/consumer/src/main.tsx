// A separate app that installs Seun UI from the packed tarball (not the source),
// to prove the published entry points, types and stylesheet work.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "seun-ui/styles.css";
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle, Combobox, DataTable, Dialog, Tab, TabList, TabPanel, Tabs, TextField,
  ToastProvider, useToast, type ColumnDef,
} from "seun-ui";

type Row = { name: string; score: number };
const columns: ColumnDef<Row, unknown>[] = [{ accessorKey: "name", header: "Name" }, { accessorKey: "score", header: "Score" }];

function App() {
  const [fruit, setFruit] = useState<string | null>(null);
  const { toast } = useToast();
  return (
    <main style={{ maxWidth: 640, margin: "2rem auto", display: "grid", gap: 16, fontFamily: "system-ui" }}>
      <Card>
        <CardHeader><CardTitle as="h1">Consumer app</CardTitle></CardHeader>
        <CardContent>Installed from the npm tarball <Badge tone="accent">v0.1.0</Badge></CardContent>
      </Card>
      <TextField label="Name" />
      <Combobox label="Fruit" options={[{ value: "a", label: "Apple" }, { value: "b", label: "Banana" }]} value={fruit} onValueChange={setFruit} />
      <Tabs defaultValue="one"><TabList aria-label="Demo"><Tab value="one">One</Tab><Tab value="two">Two</Tab></TabList><TabPanel value="one">First</TabPanel><TabPanel value="two">Second</TabPanel></Tabs>
      <DataTable caption="Scores" data={[{ name: "Ada", score: 9 }, { name: "Linus", score: 7 }]} columns={columns} />
      <Dialog trigger={<Button>Open dialog</Button>} title="Hello" description="From the packed library." />
      <Button variant="secondary" onClick={() => toast({ title: "It works", tone: "success" })}>Toast</Button>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><ToastProvider><App /></ToastProvider></StrictMode>);
