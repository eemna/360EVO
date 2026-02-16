import { useState } from "react";
import { Modal, ConfirmModal, ModalFooter } from "../components/ui/modal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../../context/ToastContext"; 

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { showToast } = useToast();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600">Welcome to your dashboard</p>

      <section className="bg-card rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Modal Components</h2>

        <div className="flex gap-3">
          <Button onClick={() => setIsModalOpen(true)}>
            Open Modal
          </Button>

          <Button
            onClick={() => setIsConfirmModalOpen(true)}
            variant="outline"
          >
            Open Confirm Modal
          </Button>
        </div>
      </section>

      {/* Main Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        description="This is a fully featured modal with focus trap"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This modal demonstrates all key features.
          </p>

          <div className="space-y-2">
            <Label htmlFor="modal-input">Try focusing inputs</Label>
            <Input id="modal-input" placeholder="Type something..." />
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={() => {
                showToast({
                  type: "success",
                  title: "Confirmed!",
                  message: "Modal action completed.",
                });
                setIsModalOpen(false);
              }}
            >
              Confirm
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          showToast({
            type: "success",
            title: "Deleted!",
            message: "The item has been deleted.",
          });
        }}
        title="Confirm Delete"
        message="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
