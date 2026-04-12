import { tool, type Tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Window } from "./Window";

export interface AgentFeatures {
  take_screenshot: boolean;
  execute_code: boolean;
  read_page: boolean;
  navigate: boolean;
}

export interface AgentConfig {
  name: string;
  features: AgentFeatures;
}

export interface IAgent {
  readonly name: string;
  readonly config: AgentConfig;
  getSystemPrompt(context?: {
    url?: string | null;
    pageText?: string | null;
  }): string;
  getTools(window: Window): Record<string, Tool>;
}

export class BrowserAgent implements IAgent {
  readonly name: string;
  readonly config: AgentConfig;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.config = config;
  }

  getSystemPrompt(context?: {
    url?: string | null;
    pageText?: string | null;
  }): string {
    const { features } = this.config;
    const parts: string[] = [
      `You are ${this.name}, a helpful AI assistant integrated into a web browser.`,
    ];

    if (features.take_screenshot) {
      parts.push(
        "You have a takeScreenshot tool. Use it when visual inspection of the page is required.",
      );
    }
    if (features.execute_code) {
      parts.push(
        "You have a code execution tool. Use it to run JavaScript in the browser.",
      );
    }
    if (features.navigate) {
      parts.push("You can navigate to URLs on the user's behalf.");
    }
    if (features.read_page) {
      parts.push(
        "You can read and analyze the text content of the current page.",
      );
    }

    if (context?.url) {
      parts.push(`\nCurrent page URL: ${context.url}`);
    }
    if (context?.pageText && features.read_page) {
      const truncated = context.pageText.substring(0, 4000);
      parts.push(`\nPage content:\n${truncated}`);
    }

    return parts.join("\n");
  }

  getTools(window: Window): Record<string, Tool> {
    const tools: Record<string, Tool> = {};
    const { features } = this.config;

    if (features.take_screenshot) {
      tools.takeScreenshot = tool({
        description:
          "Capture a screenshot of the current browser tab for visual inspection.",
        inputSchema: z.object({}),
        execute: async () => {
          const activeTab = window.activeTab;
          if (!activeTab) throw new Error("No active tab available.");
          const image = await activeTab.screenshot();
          const resized = image.resize({ width: 1024 });
          return {
            imageBase64: resized.toJPEG(80).toString("base64"),
            mediaType: "image/jpeg" as const,
          };
        },
        toModelOutput: (output) => ({
          type: "content",
          value: [
            {
              type: "media",
              data: output.imageBase64,
              mediaType: output.mediaType,
            },
          ],
        }),
      });
    }

    if (features.execute_code) {
      tools.execute = openai.tools.codeInterpreter();
    }

    return tools;
  }
}
