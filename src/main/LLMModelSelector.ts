import type { LanguageModel } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export type LLMProvider = "openai" | "anthropic";

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
};

export interface ILLMModelSelector {
  readonly provider: LLMProvider;
  readonly modelName: string;
  getModel(options?: { useResponsesApi?: boolean }): LanguageModel | null;
  getMissingApiKeyName(): string;
}

export class LLMModelSelector implements ILLMModelSelector {
  readonly provider: LLMProvider;
  readonly modelName: string;

  constructor() {
    this.provider = this.resolveProvider();
    this.modelName = process.env.LLM_MODEL || DEFAULT_MODELS[this.provider];
  }

  getModel(options?: { useResponsesApi?: boolean }): LanguageModel | null {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return null;
    }

    if (this.provider === "anthropic") {
      return anthropic(this.modelName);
    }

    if (options?.useResponsesApi) {
      return openai.responses(this.modelName);
    }

    return openai(this.modelName);
  }

  getMissingApiKeyName(): string {
    return this.provider === "anthropic"
      ? "ANTHROPIC_API_KEY"
      : "OPENAI_API_KEY";
  }

  private resolveProvider(): LLMProvider {
    return process.env.LLM_PROVIDER?.toLowerCase() === "anthropic"
      ? "anthropic"
      : "openai";
  }

  private getApiKey(): string | undefined {
    return this.provider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY;
  }
}
