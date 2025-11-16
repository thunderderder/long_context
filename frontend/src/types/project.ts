/**
 * 项目和文档相关的TypeScript类型定义
 */

export interface Project {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  knowledgeBaseKey?: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  topic: string;
  outline: string;
  content: string;
  sections: string[];
  sectionPrompts: Record<string, string>;
  outlinePrompt: string;
  sectionPrompt: string;
  knowledgeBaseKey?: string;  // 文档级知识库（优先级高于项目级）
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string;
  snapshot: Partial<Document>;
  changesSummary: string;
  createdAt: string;
}

export interface User {
  id: string;
  username?: string;
  email?: string;
  apiKey?: string;
  createdAt: string;
}

