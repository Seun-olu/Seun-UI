import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Combobox } from "../components/combobox";
import { Badge, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/display";
import { Tab, TabList, TabPanel, Tabs } from "../components/tabs";

const meta = { title: "Navigation/Tabs", component: Tabs, args: { defaultValue: "overview", children: null } } satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Tabs",
  render: () => (
    <Tabs defaultValue="overview">
      <TabList aria-label="Project">
        <Tab value="overview">Overview</Tab><Tab value="activity">Activity</Tab><Tab value="settings" disabled>Settings</Tab>
      </TabList>
      <TabPanel value="overview">Summary of the project.</TabPanel>
      <TabPanel value="activity">Recent changes.</TabPanel>
    </Tabs>
  ),
};

export const CardsAndBadges: Story = {
  name: "Card and Badge",
  render: () => (
    <Card style={{ maxWidth: 360 }}>
      <CardHeader><CardTitle>Billing</CardTitle><CardDescription>Your current plan</CardDescription></CardHeader>
      <CardContent>Pro plan <Badge tone="success">Active</Badge> <Badge tone="warning">Card expires soon</Badge></CardContent>
      <CardFooter><Badge>Monthly</Badge></CardFooter>
    </Card>
  ),
};

const countries = ["Argentina", "Brazil", "Canada", "Egypt", "France", "Ghana", "India", "Japan", "Kenya", "Mexico", "Nigeria", "Norway", "Portugal", "Rwanda", "South Africa", "Spain", "United Kingdom", "United States"]
  .map((c) => ({ value: c.toLowerCase().replace(/\s/g, "-"), label: c }));

export const ComboboxStory: Story = {
  name: "Combobox",
  render: function Render() {
    const [v, setV] = useState<string | null>("nigeria");
    return <div style={{ maxWidth: 320, minHeight: 320 }}><Combobox label="Country" options={countries} value={v} onValueChange={setV} placeholder="Start typing…" description="Type to filter, arrow keys to move, Enter to pick." /></div>;
  },
};
