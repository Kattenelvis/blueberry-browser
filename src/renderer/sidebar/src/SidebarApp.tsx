import React, { useEffect, useState } from "react";
import { ChatProvider } from "./contexts/ChatContext";
import { Chat } from "./components/Chat";
import { CreateAgent } from "./components/CreateAgent";
import { useDarkMode } from "@common/hooks/useDarkMode";
import { Plus } from "lucide-react";
import { Button } from "@common/components/Button";

type View = "chat" | "create-agent";

const SidebarContent: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const [view, setView] = useState<View>("chat");
  const [chatKey, setChatKey] = useState(0);

  // Apply dark mode class to the document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div className="h-screen flex flex-col bg-background border-l border-border relative">
      {view === "chat" && (
        <>
          <Chat key={chatKey} />
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setView("create-agent")}
              title="Create agent"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </>
      )}
      {view === "create-agent" && (
        <CreateAgent
          onBack={() => {
            setView("chat");
            setChatKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};

export const SidebarApp: React.FC = () => {
  return (
    <ChatProvider>
      <SidebarContent />
    </ChatProvider>
  );
};
