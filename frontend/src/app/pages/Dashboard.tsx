import { useState } from "react";
import { AppModal } from "../components/ui/modal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useToast } from "../../context/ToastContext";
import { RadioGroup } from "../components/ui/radio";
import { Tag } from "../components/ui/tag";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("user");
  const { showToast } = useToast();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold flex items-center gap-3">
        Dashboard
        <Badge>New</Badge>
        <Badge variant="secondary">Active</Badge>
        <Badge variant="destructive">Warning</Badge>
        <Badge variant="outline">Beta</Badge>
      </h1>

      <p className="text-gray-600">Welcome to your dashboard</p>
       <RadioGroup
  name="role"
  value={selectedRole}
  onChange={setSelectedRole}
  options={[
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
    { value: "moderator", label: "Moderator" },
  ]}
/>
 <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Tag Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag variant="default">Default Tag</Tag>
                  <Tag variant="blue">Blue Tag</Tag>
                  <Tag variant="green">Green Tag</Tag>
                  <Tag variant="purple">Purple Tag</Tag>
                  <Tag variant="orange">Orange Tag</Tag>
                  <Tag variant="outline">Outline Tag</Tag>
                </div>
              </div>
      {/* Buttons */}
      <section className="bg-card rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Modal Components</h2>

        <div className="flex gap-3">
          <Button onClick={() => setIsModalOpen(true)}>
            Open Modal
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsConfirmOpen(true)}
          >
            Open Confirm Modal
          </Button>
        </div>
      </section>

      {/* Main Modal */}
      <AppModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Example Modal"
        description="This is a reusable modal"
        submitText="Confirm"
        cancelText="Cancel"
        onSubmit={() => {
          showToast({
            type: "success",
            title: "Confirmed!",
            message: "Action completed successfully.",
          });
          setIsModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter your name..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email..." />
          </div>
        </div>
      </AppModal>

      {/* Confirm Modal */}
      <AppModal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Confirm Delete"
        description="Are you sure you want to delete this item?"
        submitText="Delete"
        cancelText="Cancel"
        onSubmit={() => {
          showToast({
            type: "success",
            title: "Deleted!",
            message: "The item has been deleted.",
          });
          setIsConfirmOpen(false);
        }}
      >
        <p className="text-sm text-muted-foreground">
          This action cannot be undone.
        </p>
      </AppModal>
    </div>
  );
}
