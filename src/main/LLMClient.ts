import { WebContents } from "electron";
import {
  streamText,
  type LanguageModel,
  type CoreMessage,
  type ResponseMessage,
  stepCountIs,
} from "ai";
import * as dotenv from "dotenv";
import { join } from "path";
import type { Window } from "./Window";
import { ErrorHandling } from "./ErrorHandling";
import type { IAgent } from "./Agent";
import { createLLMProvider, type ILLMProvider } from "./LLMModelSelector";

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, "../../.env") });

interface ChatRequest {
  message: string;
  messageId: string;
}

interface StreamChunk {
  content: string;
  isComplete: boolean;
}

const DEFAULT_TEMPERATURE = 0.7;

export class LLMClient {
  private readonly webContents: WebContents;
  private window: Window | null = null;
  private readonly provider: ILLMProvider;
  private readonly model: LanguageModel | null;
  private messages: CoreMessage[] = [];
  private activeAgent: IAgent | null = null;
  private readonly errorHandling: ErrorHandling;

  constructor(
    webContents: WebContents,
    provider: ILLMProvider = createLLMProvider(),
  ) {
    this.webContents = webContents;
    this.provider = provider;
    this.model = this.provider.getModel();
    this.errorHandling = new ErrorHandling(webContents);

    this.logInitializationStatus();
  }

  // Set the window reference after construction to avoid circular dependencies
  setWindow(window: Window): void {
    this.window = window;
  }

  setAgent(agent: IAgent | null): void {
    this.activeAgent = agent;
  }

  clearMessages(): void {
    this.messages = [];
  }

  getMessages(): CoreMessage[] {
    return this.messages;
  }

  private logInitializationStatus(): void {
    if (this.model) {
      console.log(
        `✅ LLM Client initialized with ${this.provider.provider} provider using model: ${this.provider.modelName}`,
      );
    } else {
      console.error(
        `❌ LLM Client initialization failed: ${this.provider.getMissingApiKeyName()} not found in environment variables.\n` +
        `Please add your API key to the .env file in the project root.`,
      );
    }
  }

  async sendChatMessage(request: ChatRequest): Promise<void> {
    if (!this.model) {
      this.errorHandling.sendErrorMessage(
        request.messageId,
        "LLM service is not configured. Please add your API key to the .env file.",
      );
      return;
    }

    try {
      const userMessage: CoreMessage = {
        role: "user",
        content: request.message,
      };

      this.messages.push(userMessage);

      // Send updated messages to renderer
      this.webContents.send("chat-messages-updated", this.messages);

      const messages = await this.prepareMessagesWithContext();
      await this.streamResponse(messages, request.messageId);
    } catch (error) {
      console.error("Error in LLM request:", error);
      this.errorHandling.handleStreamError(error, request.messageId);
    }
  }

  private async prepareMessagesWithContext(): Promise<CoreMessage[]> {
    let pageUrl: string | null = null;
    let pageText: string | null = null;

    if (this.window) {
      const activeTab = this.window.activeTab;
      if (activeTab) {
        pageUrl = activeTab.url;
        if (this.activeAgent?.config.features.read_page) {
          try {
            pageText = await activeTab.getTabText();
          } catch (error) {
            console.error("Failed to get page text:", error);
          }
        }
      }
    }

    const systemMessage: CoreMessage = {
      role: "system",
      content:
        this.activeAgent?.getSystemPrompt({ url: pageUrl, pageText }) ?? "",
    };

    return [systemMessage, ...this.messages];
  }

  private getModelForCurrentAgent(): LanguageModel {
    const model = this.provider.getModel({
      useResponsesApi: this.activeAgent?.config.features.execute_code ?? false,
    });
    if (!model) {
      throw new Error("Model not initialized");
    }
    return model;
  }

  private async streamResponse(
    messages: CoreMessage[],
    messageId: string,
  ): Promise<void> {
    const tools =
      this.activeAgent && this.window
        ? this.activeAgent.getTools(this.window)
        : {};

    const result = streamText({
      model: this.getModelForCurrentAgent(),
      messages,
      temperature: DEFAULT_TEMPERATURE,
      maxRetries: 3,
      stopWhen: stepCountIs(1),
      tools,
    });

    await this.processStream(result, messageId);
  }

  private async processStream(
    result: {
      textStream: AsyncIterable<string>;
      response: Promise<{ messages: ResponseMessage[] }>;
    },
    messageId: string,
  ): Promise<void> {
    let accumulatedText = "";
    const textStream = result.textStream;

    // Create a placeholder assistant message
    const assistantMessage: CoreMessage = {
      role: "assistant",
      content: "",
    };

    // Keep track of the index for updates
    const messageIndex = this.messages.length;
    this.messages.push(assistantMessage);

    for await (const chunk of textStream) {
      accumulatedText += chunk;

      // Update assistant message content
      this.messages[messageIndex] = {
        role: "assistant",
        content: accumulatedText,
      };
      this.sendMessagesToRenderer();

      this.sendStreamChunk(messageId, {
        content: chunk,
        isComplete: false,
      });
    }

    const response = await result.response;
    const responseMessages = response.messages as CoreMessage[];

    // Replace the streaming placeholder with the provider-normalized messages
    // so tool calls and tool results are preserved for follow-up turns.
    this.messages.splice(messageIndex, 1, ...responseMessages);
    this.sendMessagesToRenderer();

    // Send the final complete signal
    this.sendStreamChunk(messageId, {
      content: accumulatedText,
      isComplete: true,
    });
  }

  private sendMessagesToRenderer(): void {
    this.webContents.send("chat-messages-updated", this.messages);
  }

  private sendStreamChunk(messageId: string, chunk: StreamChunk): void {
    this.webContents.send("chat-response", {
      messageId,
      content: chunk.content,
      isComplete: chunk.isComplete,
    });
  }
}
