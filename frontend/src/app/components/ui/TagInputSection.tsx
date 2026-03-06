import { Input } from "./input";
import { Button } from "./button";
import { Label } from "./label";
import { Tag } from "./tag";
import { X } from "lucide-react";
import { tagVariants } from "./tagVariants";
import type { VariantProps } from "class-variance-authority";

type TagVariant = VariantProps<typeof tagVariants>["variant"];

type Props = {
  label: string;
  items: string[];
  newValue: string;
  setNewValue: (value: string) => void;
  onAdd: () => void;
  onRemove: (item: string) => void;
  emptyMessage?: string;
  variant?: TagVariant; // ✅ Correct way
};

export default function TagInputSection({
  label,
  items,
  newValue,
  setNewValue,
  onAdd,
  onRemove,
  emptyMessage,
  variant = "default",
}: Props) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Input + Add Button */}
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="Type and press Enter"
        />
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="px-4"
        >
          Add
        </Button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && emptyMessage && (
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        )}

        {items.map((item) => (
          <Tag key={item} variant={variant} className="flex items-center gap-1">
            {item}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item)}
              className="h-5 w-5 p-0 ml-1 text-gray-400 hover:text-red-500 hover:bg-transparent"
            >
              <X size={12} />
            </Button>
          </Tag>
        ))}
      </div>
    </div>
  );
}
