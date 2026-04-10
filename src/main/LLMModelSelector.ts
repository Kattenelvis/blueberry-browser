import type { LanguageModel } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

type LLMProviderName = "openai" | "anthropic";

interface ModelOptions {
  useResponsesApi?: boolean;
}

export interface ILLMProvider {
  readonly provider: LLMProviderName;
  readonly modelName: string;
  getModel(options?: ModelOptions): LanguageModel | null;
  getMissingApiKeyName(): string;
}

abstract class BaseLLMProvider implements ILLMProvider {
  abstract readonly provider: LLMProviderName;
  readonly modelName: string;

  constructor(modelName?: string) {
    this.modelName = modelName || this.getDefaultModelName();
  }

  getModel(options?: ModelOptions): LanguageModel | null {
    if (!this.hasApiKey()) {
      return null;
    }

    return this.createModel(options);
  }

  abstract getMissingApiKeyName(): string;
  protected abstract getDefaultModelName(): string;
  protected abstract hasApiKey(): boolean;
  protected abstract createModel(options?: ModelOptions): LanguageModel;
}

class OpenAIProvider extends BaseLLMProvider {
  readonly provider = "openai" as const;

  getMissingApiKeyName(): string {
    return "OPENAI_API_KEY";
  }

  protected getDefaultModelName(): string {
    return "gpt-4o-mini";
  }

  protected hasApiKey(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  protected createModel(options?: ModelOptions): LanguageModel {
    if (options?.useResponsesApi) {
      return openai.responses(this.modelName);
    }

    return openai(this.modelName);
  }
}

class AnthropicProvider extends BaseLLMProvider {
  readonly provider = "anthropic" as const;

  getMissingApiKeyName(): string {
    return "ANTHROPIC_API_KEY";
  }

  protected getDefaultModelName(): string {
    return "claude-3-5-sonnet-20241022";
  }

  protected hasApiKey(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  protected createModel(): LanguageModel {
    return anthropic(this.modelName);
  }
}

export function createLLMProvider(): ILLMProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();
  const modelName = process.env.LLM_MODEL;

  if (provider === "anthropic") {
    return new AnthropicProvider(modelName);
  }

  return new OpenAIProvider(modelName);
}
