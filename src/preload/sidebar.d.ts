import { ElectronAPI } from "@electron-toolkit/preload";

interface ChatRequest {
  message: string;
  context: {
    url: string | null;
    content: string | null;
    text: string | null;
  };
  messageId: string;
}

interface ChatResponse {
  messageId: string;
  content: string;
  isComplete: boolean;
}

interface TabInfo {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
}

interface AgentConfig {
  name: string;
  features: Record<string, boolean>;
}

interface CreatedAgent {
  name: string;
  config: AgentConfig;
}

interface AgentInfo {
  name: string;
  config: AgentConfig;
  isActive: boolean;
}

interface SidebarAPI {
  // Chat functionality
  sendChatMessage: (request: Partial<ChatRequest>) => Promise<void>;
  clearChat: () => Promise<void>;
  getMessages: () => Promise<any[]>;
  onChatResponse: (callback: (data: ChatResponse) => void) => void;
  onMessagesUpdated: (callback: (messages: any[]) => void) => void;
  removeChatResponseListener: () => void;
  removeMessagesUpdatedListener: () => void;

  // Agent management
  createAgent: (config: AgentConfig) => Promise<CreatedAgent>;
  getAgents: () => Promise<AgentInfo[]>;
  setActiveAgent: (name: string) => Promise<boolean>;

  // Page content access
  getPageContent: () => Promise<string | null>;
  getPageText: () => Promise<string | null>;
  getCurrentUrl: () => Promise<string | null>;

  // Tab information
  getActiveTabInfo: () => Promise<TabInfo | null>;

  onFocusChatInput: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    sidebarAPI: SidebarAPI;
  }
}

