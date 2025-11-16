/**
 * 写作相关的TypeScript类型定义
 */

export type GenerationMode = 'sequential' | 'continuous';

export interface WritingState {
  topic: string;
  outline: string;
  generatedContent: string;
  isGeneratingOutline: boolean;
  isGeneratingContent: boolean;
  currentSectionIndex: number;
  generationMode: GenerationMode;
}

