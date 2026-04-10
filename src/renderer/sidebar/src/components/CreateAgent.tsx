import React, { useState } from "react";
import { ArrowLeft, Bot } from "lucide-react";
import { Button } from "@common/components/Button";
import { cn } from "@common/lib/utils";

interface AgentFeature {
  id: string;
  label: string;
  description: string;
}

const FEATURES: AgentFeature[] = [
  {
    id: "take_screenshot",
    label: "Take Screenshot",
    description: "Capture the current page as an image",
  },
  {
    id: "execute_code",
    label: "Execute Code",
    description: "Run JavaScript in the active tab",
  },
  {
    id: "read_page",
    label: "Read Page Content",
    description: "Access the text content of the current page",
  },
  {
    id: "navigate",
    label: "Navigate",
    description: "Open URLs and follow links",
  },
];

interface ToggleProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange }) => (
  <button
    role="switch"
    aria-checked={enabled}
    onClick={() => onChange(!enabled)}
    className={cn(
      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
      "transition-colors duration-200 focus:outline-none",
      enabled ? "bg-primary" : "bg-muted-foreground/30",
    )}
  >
    <span
      className={cn(
        "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm",
        "transform transition-transform duration-200",
        enabled ? "translate-x-4" : "translate-x-0",
      )}
    />
  </button>
);

interface CreateAgentProps {
  onBack: () => void;
}

export const CreateAgent: React.FC<CreateAgentProps> = ({ onBack }) => {
  const [name, setName] = useState("");
  const [features, setFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURES.map((f) => [f.id, false])),
  );

  const toggleFeature = (id: string, value: boolean) => {
    setFeatures((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreate = async () => {
    await window.sidebarAPI.createAgent({ name: name.trim(), features });
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon-xs" onClick={onBack} title="Back">
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">New Agent</span>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
        {/* Agent icon hint */}
        <div className="flex justify-center">
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
            <Bot className="size-7 text-muted-foreground" />
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Agent"
            className={cn(
              "w-full rounded-xl border border-border bg-background px-4 py-2.5",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:border-primary/40",
              "transition-colors duration-150",
            )}
          />
        </div>

        {/* Features */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Capabilities
          </label>
          <div className="flex flex-col gap-1 rounded-xl border border-border overflow-hidden">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.id}
                className={cn(
                  "flex items-center justify-between px-4 py-3 bg-background",
                  i < FEATURES.length - 1 && "border-b border-border",
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {feature.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {feature.description}
                  </span>
                </div>
                <Toggle
                  enabled={features[feature.id]}
                  onChange={(v) => toggleFeature(feature.id, v)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <Button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full rounded-xl"
        >
          Create Agent
        </Button>
      </div>
    </div>
  );
};
