import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../components/button";
import { Checkbox, RadioGroup, Select, Switch, Textarea, TextField } from "../components/field";

const meta = { title: "Forms/Button", component: Button, args: { children: "Save changes" } } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Variants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button>
      <Button variant="danger">Delete</Button><Button size="sm">Small</Button><Button disabled>Disabled</Button><Button loading>Saving</Button>
    </div>
  ),
};

export const FormControls: Story = {
  name: "Form controls",
  render: function Render() {
    const [plan, setPlan] = useState("pro");
    return (
      <form style={{ display: "grid", gap: 16, maxWidth: 420 }} onSubmit={(e) => e.preventDefault()}>
        <TextField label="Email" type="email" required description="We'll send the receipt here." />
        <TextField label="Company" error="Company name is required" />
        <Textarea label="Notes" description="Optional." />
        <Select label="Country" placeholder="Choose a country" options={[{ value: "ng", label: "Nigeria" }, { value: "uk", label: "United Kingdom" }]} />
        <RadioGroup legend="Plan" name="plan" value={plan} onValueChange={setPlan} orientation="horizontal"
          options={[{ value: "free", label: "Free" }, { value: "pro", label: "Pro" }, { value: "team", label: "Team", disabled: true }]} />
        <Checkbox label="Email me product updates" description="About once a month." />
        <Switch label="Two-factor authentication" defaultChecked />
        <Button type="submit">Create account</Button>
      </form>
    );
  },
};
