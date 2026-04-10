import React, { useEffect, useRef, useState } from "react";
import { Chat } from "../components/Chat";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  FileText,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@common/components/Button";
import { cn } from "@common/lib/utils";

interface AgentFeature {
  id: string;
  label: string;
  description: string;
}

interface AgentInfo {
  name: string;
  config: {
    name: string;
    features: Record<string, boolean>;
  };
  isActive: boolean;
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
    description: "Run Python code executed on OpenAI's server",
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

type Tab = "create-agent" | "user-files" | "jobs" | "chat";

interface CreateAgentProps {
  onBack: () => void;
}

export const CreateAgent: React.FC<CreateAgentProps> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>("chat");

  // Create Agent state
  const [name, setName] = useState("");
  const [features, setFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURES.map((f) => [f.id, false])),
  );

  // User Files state
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFeature = (id: string, value: boolean) => {
    setFeatures((prev) => ({ ...prev, [id]: value }));
  };

  const loadAgents = async () => {
    const list = await window.sidebarAPI.getAgents();
    setAgents(list);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleCreate = async () => {
    await window.sidebarAPI.createAgent({ name: name.trim(), features });
    await loadAgents();
    onBack();
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming).filter(
      (f) => !files.some((existing) => existing.name === f.name),
    );
    setFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const jobs = [
    {
      name: "Daily research brief",
      when: "Every day at 08:00",
      status: "Queued",
      tone: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
      details:
        "Collects headlines, summarizes changes, and drafts a morning update.",
      metrics: ["Priority: Medium", "Source set: 6 sites"],
    },
    {
      name: "Website change monitor",
      when: "Running now",
      status: "In Progress",
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
      details:
        "Scanning tracked pages and preparing a diff for anything newly changed.",
      metrics: ["Step: 3 of 5", "ETA: 2 min"],
    },
    {
      name: "Follow up on stale leads",
      when: "Apr 12 at 14:30",
      status: "Scheduled",
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      details:
        "Drafts personalized follow-ups from the CRM export and recent notes.",
      metrics: ["Audience: 18 leads", "Template: Sales nudge"],
    },
  ] as const;

  const getEnabledFeatureLabels = (agent: AgentInfo) =>
    FEATURES.filter((feature) => agent.config.features[feature.id]).map(
      (feature) => feature.label,
    );

  const tabs: { id: Tab; label: string; content: React.ReactNode }[] = [
    {
      id: "chat",
      label: "Chat",
      content: (
        <>
          <Chat />
        </>
      ),
    },
    {
      id: "create-agent",
      label: "Create Permissions",
      content: (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
            <div className="flex justify-center">
              <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
                <Bot className="size-7 text-muted-foreground" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Permissions"
                className={cn(
                  "w-full rounded-xl border border-border bg-background px-4 py-2.5",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:border-primary/40 transition-colors duration-150",
                )}
              />
            </div>

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

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Existing Permissions
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reuse these in chat by switching the active permission set.
                </p>
              </div>

              {agents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No permissions created yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {agents.map((agent) => {
                    const enabledFeatures = getEnabledFeatureLabels(agent);

                    return (
                      <div
                        key={agent.name}
                        className="rounded-xl border border-border bg-background px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-foreground">
                            {agent.name}
                          </p>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {enabledFeatures.length > 0 ? (
                            enabledFeatures.map((feature) => (
                              <span
                                key={feature}
                                className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground"
                              >
                                {feature}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No capabilities enabled
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-4 border-t border-border">
            <Button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full rounded-xl"
            >
              Create Permissions
            </Button>
          </div>
        </>
      ),
    },
    {
      id: "user-files",
      label: "User Files",
      content: (
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed",
              "px-4 py-10 cursor-pointer transition-colors duration-150",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30",
            )}
          >
            <div
              className={cn(
                "size-10 rounded-xl flex items-center justify-center",
                isDragging ? "bg-primary/10" : "bg-muted",
              )}
            >
              <Upload
                className={cn(
                  "size-5 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground",
                )}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drop files here
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                or click to browse
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <div className="flex flex-col gap-1">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 group"
                >
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground flex-1 truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "jobs",
      label: "Jobs",
      content: (
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-start gap-3">
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
              <CalendarClock className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Schedule AI Jobs</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mock UI for queued and recurring automations.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-4 flex flex-col gap-3">
            <input
              placeholder="Prompt"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              />
              <input
                type="time"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="size-4 rounded border-border text-primary focus:ring-primary/30"
              />
              <span>Recurring</span>
            </label>
            {isRecurring && (
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Weekdays</option>
                <option>Monthly</option>
              </select>
            )}
            <Button className="w-full rounded-xl">Schedule Job</Button>
          </div>
          {jobs.map((job) => (
            <div
              key={job.name}
              className="rounded-xl border border-border px-4 py-3 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{job.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {job.when}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${job.tone}`}
                >
                  {job.status === "In Progress" && (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  )}
                  {job.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{job.details}</p>
              <div className="flex flex-wrap gap-2">
                {job.metrics.map((metric) => (
                  <span
                    key={metric}
                    className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const activeTab = tabs.find(({ id }) => id === tab) ?? tabs[0];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with back button + tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-1 px-3 pt-2">
          <Button variant="ghost" size="icon-xs" onClick={onBack} title="Back">
            <ArrowLeft className="size-4" />
          </Button>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 -mb-px transition-colors",
                tab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab.content}
    </div>
  );
};
