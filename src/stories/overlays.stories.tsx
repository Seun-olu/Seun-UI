import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../components/button";
import { Dialog } from "../components/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/menu";
import { ToastProvider, useToast } from "../components/toast";
import { Tooltip } from "../components/tooltip";

const meta = { title: "Overlays/Dialog", component: Dialog, args: { title: "Delete project?" } } satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmDialog: Story = {
  name: "Dialog",
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen} trigger={<Button variant="danger">Delete project</Button>}
        title="Delete project?" description="This removes all boards and cards. It can't be undone."
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => setOpen(false)}>Delete</Button></>} />
    );
  },
};

export const OpenDialog: Story = {
  name: "Dialog (open)",
  render: () => (
    <Dialog defaultOpen title="Invite teammates" description="They'll get an email with a link to join."
      footer={<Button>Send invites</Button>}>
      <p style={{ margin: 0 }}>Invites expire after 7 days.</p>
    </Dialog>
  ),
};

export const Menu: Story = {
  name: "Dropdown menu",
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger variant="secondary">Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => {}}>Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => {}}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem disabled>Move (no permission)</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => {}}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const Tooltips: Story = {
  name: "Tooltip",
  render: () => (
    <div style={{ padding: 40 }}>
      <Tooltip content="Copies a link to this board"><Button variant="secondary">Copy link</Button></Tooltip>
    </div>
  ),
};

function ToastButtons() {
  const { toast } = useToast();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button onClick={() => toast({ title: "Saved", description: "Your changes are live.", tone: "success" })}>Success</Button>
      <Button variant="secondary" onClick={() => toast({ title: "Heads up", description: "Sync paused while offline." })}>Info</Button>
      <Button variant="danger" onClick={() => toast({ title: "Upload failed", description: "The file is over 10 MB.", tone: "error" })}>Error</Button>
    </div>
  );
}
export const Toasts: Story = { name: "Toast", render: () => <ToastProvider><ToastButtons /></ToastProvider> };
