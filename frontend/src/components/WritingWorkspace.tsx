import React, { useState, useEffect, useCallback, useRef } from 'react';
import './WritingWorkspace.css';
import CompactSectionManager from './CompactSectionManager';
import EnhancedEditorPanel from './EnhancedEditorPanel';
import RegenerateDialog from './RegenerateDialog';
import EditSectionDialog from './EditSectionDialog';
import OutlinePromptDialog from './OutlinePromptDialog';
import { Document, Project } from '../types/project';
import { getUserId } from '../utils/userUtils';

type GenerationMode = 'sequential' | 'continuous';

interface WritingWorkspaceProps {
  document: Document;
  project?: Project;
  onSave: (updates: Partial<Document>) => void;
  onClose: () => void;
}

// 提示词接口定义（与 PromptManager 保持一致）
interface Prompt {
  id: number;
  title: string;
  content: string;
  category_id: number;
  category_name?: string;
  keywords: string;
  usage_count: number;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

// 默认提示词
const DEFAULT_OUTLINE_PROMPT = `你是一位专业的写作助手。用户在项目"{project}"中创建了文档"{doc-name}"。

请为这个文档生成一个详细的大纲。大纲应该：
1. 结构清晰，层次分明
2. 涵盖主题的关键方面
3. 逻辑流畅，易于理解
4. 使用 Markdown 格式，支持层级结构（使用 ## 和 ### 标记）

只需要返回大纲内容，不要有其他解释。以 Markdown 格式输出。`;

const DEFAULT_SECTION_PROMPT = `#角色
你是一个交通运输与管理局工作过15年，在发展改革委评审委员会工作过10年的公务员。

#写作风格和内容要求
1. 公文风，内容详细、深入、有见地；
2. 与之前的内容保持连贯，避免重复；
3. 如果是第一部分，可以有引言；如果是最后一部分，可以有总结

#格式要求
1. 使用 Markdown 格式
2. 每一个段落的篇幅在500字到1200字；
3. 只返回正文内容，不要包含章节标题（标题已在大纲中）
4. 每一段话内部不要再划分更多的层次和使用项目编号，写成一段话即可；假设有下一层标题的话可以使用加粗字体放在一个段落的开头；

项目：{project}
文档：{doc-name}

这是之前撰写的内容：
{context}

现在需要详细撰写以下部分：
{current_section}`;

const AUTOSAVE_INTERVAL = 3000; // 每3秒自动保存

const WritingWorkspace: React.FC<WritingWorkspaceProps> = ({
  document,
  project,
  onSave,
  onClose,
}) => {
  // 项目名称和文档名称
  const projectName = project?.title || '未命名项目';
  const docName = document.title || '未命名文档';
  const topic = `${projectName} - ${docName}`;
  
  const [outline, setOutline] = useState(document.outline || '');
  const [generatedContent, setGeneratedContent] = useState(document.content || '');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sections, setSections] = useState<string[]>(document.sections || []);
  const [sectionPrompts, setSectionPrompts] = useState<Record<string, string>>(document.sectionPrompts || {});
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  
  // 生成模式：默认为一次性生成（continuous）
  const [generationMode, setGenerationMode] = useState<GenerationMode>('continuous');
  
  // 提示词状态
  const [outlinePrompt, setOutlinePrompt] = useState(document.outlinePrompt || DEFAULT_OUTLINE_PROMPT);
  const [sectionPrompt] = useState(document.sectionPrompt || DEFAULT_SECTION_PROMPT);
  
  // 提示词对话框
  const [showOutlinePromptDialog, setShowOutlinePromptDialog] = useState(false);
  
  // 用于避免循环更新的标记
  const isUpdatingFromContent = useRef(false);
  const isUpdatingFromOutline = useRef(false);
  
  // 保存 onSave 的最新引用，避免循环依赖
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);
  
  // 内容生成控制状态
  const contentGenerationControl = useRef({
    isPaused: false,
    isCancelled: false
  });
  
  // 左侧栏宽度（大纲+章节管理）
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('leftPanelWidth');
    return saved ? parseInt(saved) : 380;
  });
  const isResizing = useRef(false);
  
  // 重新生成对话框状态
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenerateSectionIndex, setRegenerateSectionIndex] = useState<number | null>(null);
  
  // 编辑章节对话框状态
  const [showEditSectionDialog, setShowEditSectionDialog] = useState(false);
  const [editSectionIndex, setEditSectionIndex] = useState<number | null>(null);
  
  // 批量生成提示词状态
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchGenerationPaused, setBatchGenerationPaused] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, matched: 0, generated: 0, failed: 0 });
  const [hasUnfinishedBatchGeneration, setHasUnfinishedBatchGeneration] = useState(false);
  const batchGenerationControl = useRef({
    isPaused: false,
    isCancelled: false
  });

  // 从环境变量读取 API URL
  const API_BASE_URL = process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/api`
    : '/api';

  // 保存文档
  const handleSave = useCallback(() => {
    onSaveRef.current({
      title: document.title,
      topic,
      outline,
      content: generatedContent,
      sections,
      sectionPrompts,
      outlinePrompt,
      sectionPrompt,
      wordCount: generatedContent.length,
      updatedAt: new Date().toISOString(),
    });
  }, [topic, outline, generatedContent, sections, sectionPrompts, outlinePrompt, sectionPrompt, document.title]);

  // 自动保存
  useEffect(() => {
    const interval = setInterval(() => {
      if (topic || outline || generatedContent) {
        handleSave();
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [handleSave, topic, outline, generatedContent]);

  // 页面卸载前保存
  useEffect(() => {
    return () => {
      handleSave();
    };
  }, [handleSave]);

  // 解析大纲中的章节和提示词
  const parseOutlineSections = useCallback((outlineText: string): { sections: string[], prompts: Record<string, string> } => {
    const lines = outlineText.split('\n');
    const sections: string[] = [];
    const prompts: Record<string, string> = {};
    
    let currentSection: string | null = null;
    let currentPromptLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // 匹配章节标题（## 或更多的#开头）
      if (trimmedLine.match(/^#{2,}\s+/)) {
        // 保存上一个章节的提示词
        if (currentSection && currentPromptLines.length > 0) {
          prompts[currentSection] = currentPromptLines.join('\n').trim();
        }
        
        // 开始新章节
        sections.push(trimmedLine);
        currentSection = trimmedLine;
        currentPromptLines = [];
      } else if (currentSection) {
        // 检查是否是提示词标识符（显式标记）
        if (trimmedLine === '<!-- PROMPT_START -->') {
          i++;
          const promptContent: string[] = [];
          while (i < lines.length && lines[i].trim() !== '<!-- PROMPT_END -->') {
            promptContent.push(lines[i]);
            i++;
          }
          // 保存提示词内容
          if (promptContent.length > 0) {
            currentPromptLines = promptContent;
          }
        }
        // 🔥 新逻辑：章节标题后的所有内容默认都是提示词
        else if (trimmedLine) {
          // 任何非空行都视为提示词内容
          currentPromptLines.push(line);
        } else {
          // 空行也保留（提示词中可能有空行）
          if (currentPromptLines.length > 0) {
            currentPromptLines.push(line);
          }
        }
      }
    }
    
    // 保存最后一个章节的提示词
    if (currentSection && currentPromptLines.length > 0) {
      prompts[currentSection] = currentPromptLines.join('\n').trim();
    }
    
    return { sections, prompts };
  }, []);

  // 当大纲变化时，自动重新解析章节和提示词
  useEffect(() => {
    if (outline && !isGeneratingContent && !isUpdatingFromContent.current) {
      isUpdatingFromOutline.current = true;
      const { sections: parsedSections, prompts } = parseOutlineSections(outline);
      
      // 更新章节列表
      setSections(parsedSections);
      
      // 更新章节提示词
      setSectionPrompts(prompts);
      
      setTimeout(() => {
        isUpdatingFromOutline.current = false;
      }, 100);
    }
  }, [outline, isGeneratingContent, parseOutlineSections]);

  // 点击生成大纲按钮 - 先显示提示词编辑对话框
  const handleGenerateOutlineClick = () => {
    setShowOutlinePromptDialog(true);
  };

  // 确认提示词后开始生成大纲
  const handleGenerateOutlineConfirm = async (prompt: string) => {
    setShowOutlinePromptDialog(false);
    setOutlinePrompt(prompt);
    
    if (!topic.trim()) {
      alert('无法获取主题信息');
      return;
    }

    setIsGeneratingOutline(true);
    setOutline('');
    
    try {
      // 替换占位符
      const finalPrompt = prompt
        .replace(/\{project\}/g, projectName)
        .replace(/\{doc-name\}/g, docName);
      
      const response = await fetch(`${API_BASE_URL}/generate-outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic,
          custom_prompt: finalPrompt !== DEFAULT_OUTLINE_PROMPT ? finalPrompt : ''
        }),
      });

      if (!response.ok) throw new Error('生成大纲失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('无法读取响应流');

      let accumulatedOutline = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedOutline += data.content;
                setOutline(accumulatedOutline);
              }
              if (data.done) {
                const { sections: parsedSections, prompts } = parseOutlineSections(accumulatedOutline);
                setSections(parsedSections);
                setSectionPrompts(prompts);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      alert(`生成大纲失败：${error}`);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // 生成单个章节
  const generateSectionInternal = async (
    sectionIndex: number,
    currentSections: string[],
    currentTopic: string,
    currentOutline: string,
    currentContent: string
  ) => {
    if (sectionIndex >= currentSections.length) {
      setIsGeneratingContent(false);
      setWaitingForConfirmation(false);
      return;
    }
    
    if (contentGenerationControl.current.isCancelled) {
      setIsGeneratingContent(false);
      setWaitingForConfirmation(false);
      alert('内容生成已取消');
      return;
    }

    const currentSection = currentSections[sectionIndex];
    
    if (!currentTopic || !currentSection) {
      alert('生成失败：缺少必需参数');
      setIsGeneratingContent(false);
      return;
    }
    
    setCurrentSectionIndex(sectionIndex);
    setIsGeneratingContent(true);
    
    try {
      const sectionHint = sectionPrompts[currentSection] || '';
      
      const response = await fetch(`${API_BASE_URL}/generate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentTopic,
          outline: currentOutline,
          current_section: currentSection,
          previous_content: currentContent,
          custom_prompt: sectionPrompt !== DEFAULT_SECTION_PROMPT ? sectionPrompt : '',
          section_hint: sectionHint,
        }),
      });

      if (!response.ok) throw new Error('生成失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('无法读取响应流');

      let newContent = currentContent + `\n\n${currentSection}\n\n`;
      setGeneratedContent(newContent);

      while (true) {
        while (contentGenerationControl.current.isPaused && !contentGenerationControl.current.isCancelled) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (contentGenerationControl.current.isCancelled) {
          reader.cancel();
          break;
        }
        
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                newContent += data.content;
                setGeneratedContent(newContent);
              }
              if (data.done) {
                setWaitingForConfirmation(true);
                setIsGeneratingContent(false);
              }
            } catch (e) {
              // 忽略
            }
          }
        }
      }
    } catch (error) {
      alert(`生成内容失败：${error}`);
      setIsGeneratingContent(false);
    }
  };

  // 开始生成内容
  const handleStartGeneration = async () => {
    if (!outline.trim()) {
      alert('请先输入或生成大纲');
      return;
    }

    const { sections: parsedSections, prompts } = parseOutlineSections(outline);
    if (parsedSections.length === 0) {
      alert('大纲中没有找到章节标题');
      return;
    }

    setSections(parsedSections);
    setSectionPrompts(prompts);
    setGeneratedContent('');
    setCurrentSectionIndex(0);
    setWaitingForConfirmation(false);
    
    contentGenerationControl.current.isPaused = false;
    contentGenerationControl.current.isCancelled = false;
    
    // 根据生成模式决定行为
    if (generationMode === 'continuous') {
      // 一次性生成所有章节
      await generateAllSections(parsedSections, `${projectName} - ${docName}`, outline);
    } else {
      // 逐章节生成
      await generateSectionInternal(0, parsedSections, `${projectName} - ${docName}`, outline, '');
    }
  };

  // 一次性生成所有章节
  const generateAllSections = async (
    currentSections: string[],
    currentTopic: string,
    currentOutline: string
  ) => {
    setIsGeneratingContent(true);
    
    let accumulatedContent = '';
    
    for (let i = 0; i < currentSections.length; i++) {
      if (contentGenerationControl.current.isCancelled) {
        setIsGeneratingContent(false);
        alert('内容生成已取消');
        return;
      }
      
      setCurrentSectionIndex(i);
      const currentSection = currentSections[i];
      const sectionHint = sectionPrompts[currentSection] || '';
      
      try {
        const response = await fetch(`${API_BASE_URL}/generate-section`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: `${projectName} - ${docName}`,
            outline: currentOutline,
            current_section: currentSection,
            previous_content: accumulatedContent,
            custom_prompt: sectionPrompt !== DEFAULT_SECTION_PROMPT ? sectionPrompt : '',
            section_hint: sectionHint,
          }),
        });

        if (!response.ok) throw new Error('生成失败');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error('无法读取响应流');

        let sectionContent = `\n\n${currentSection}\n\n`;
        accumulatedContent += sectionContent;
        setGeneratedContent(accumulatedContent);

        while (true) {
          if (contentGenerationControl.current.isCancelled) {
            reader.cancel();
            break;
          }
          
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedContent += data.content;
                  setGeneratedContent(accumulatedContent);
                }
              } catch (e) {
                // 忽略
              }
            }
          }
        }
      } catch (error) {
        alert(`生成章节 ${i + 1} 失败：${error}`);
        break;
      }
    }
    
    setIsGeneratingContent(false);
    setWaitingForConfirmation(false);
  };

  // 继续生成下一章节
  const handleContinueGeneration = () => {
    setWaitingForConfirmation(false);
    generateSectionInternal(
      currentSectionIndex + 1,
      sections,
      `${projectName} - ${docName}`,
      outline,
      generatedContent
    );
  };

  // 其他辅助函数...
  const handleRegenerateSection = (sectionIndex: number) => {
    setRegenerateSectionIndex(sectionIndex);
    setShowRegenerateDialog(true);
  };

  const handleJumpToSection = (sectionIndex: number) => {
    setCurrentSectionIndex(sectionIndex);
  };

  const handleEditSection = (sectionIndex: number) => {
    setEditSectionIndex(sectionIndex);
    setShowEditSectionDialog(true);
  };

  // 新增章节
  const handleAddSection = (afterIndex: number, level: number) => {
    const newSectionTitle = prompt('请输入新章节标题（无需添加 ## 前缀）：');
    if (!newSectionTitle || !newSectionTitle.trim()) {
      return;
    }
    
    // 创建新章节标题
    const newSection = '#'.repeat(level) + ' ' + newSectionTitle.trim();
    
    // 插入新章节
    const newSections = [...sections];
    newSections.splice(afterIndex + 1, 0, newSection);
    setSections(newSections);
    
    // 同时更新大纲文本
    setOutline(prev => {
      const lines = prev.split('\n');
      const sectionTitleToFind = sections[afterIndex];
      
      // 找到插入位置
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed === sectionTitleToFind) {
          // 跳过该章节的提示词
          let j = i + 1;
          if (j < lines.length && lines[j].trim() === '<!-- PROMPT_START -->') {
            j++;
            while (j < lines.length && lines[j].trim() !== '<!-- PROMPT_END -->') {
              j++;
            }
            if (j < lines.length) j++; // 跳过 <!-- PROMPT_END -->
          }
          // 跳过空行
          while (j < lines.length && lines[j].trim() === '') {
            j++;
          }
          
          // 在此处插入新章节
          const before = lines.slice(0, j);
          const after = lines.slice(j);
          return [...before, '', newSection, '', ...after].join('\n');
        }
      }
      
      // 如果没找到，添加到末尾
      return prev + '\n\n' + newSection;
    });
  };

  // 删除章节
  const handleDeleteSection = (index: number) => {
    if (!window.confirm(`确定要删除章节"${sections[index]}"吗？`)) {
      return;
    }
    
    const sectionToDelete = sections[index];
    
    // 从sections数组中删除
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
    
    // 从大纲文本中删除
    setOutline(prev => {
      const lines = prev.split('\n');
      const newLines: string[] = [];
      let i = 0;
      
      while (i < lines.length) {
        const trimmed = lines[i].trim();
        
        // 找到要删除的章节
        if (trimmed === sectionToDelete) {
          // 跳过标题
          i++;
          // 跳过提示词块
          if (i < lines.length && lines[i].trim() === '<!-- PROMPT_START -->') {
            i++;
            while (i < lines.length && lines[i].trim() !== '<!-- PROMPT_END -->') {
              i++;
            }
            if (i < lines.length) i++; // 跳过 <!-- PROMPT_END -->
          }
          // 跳过后面的空行
          while (i < lines.length && lines[i].trim() === '') {
            i++;
          }
          continue;
        }
        
        newLines.push(lines[i]);
        i++;
      }
      
      return newLines.join('\n');
    });
    
    // 删除该章节的提示词
    setSectionPrompts(prev => {
      const newPrompts = { ...prev };
      delete newPrompts[sectionToDelete];
      return newPrompts;
    });
  };

  // 更新章节标题
  const handleUpdateSectionTitle = (index: number, newTitle: string) => {
    const oldSection = sections[index];
    const level = oldSection.match(/^(#{2,})\s+/)?.[1].length || 2;
    const newSection = '#'.repeat(level) + ' ' + newTitle;
    
    // 更新sections数组
    const newSections = [...sections];
    newSections[index] = newSection;
    setSections(newSections);
    
    // 更新大纲文本
    setOutline(prev => {
      return prev.replace(oldSection, newSection);
    });
    
    // 更新提示词映射（如果有）
    if (sectionPrompts[oldSection]) {
      setSectionPrompts(prev => {
        const newPrompts = { ...prev };
        newPrompts[newSection] = newPrompts[oldSection];
        delete newPrompts[oldSection];
        return newPrompts;
      });
    }
  };

  // ==================== 提示词匹配和生成功能 ====================
  
  /**
   * 更新大纲中的提示词 - 将提示词插入到对应章节标题下方
   * 使用 HTML 注释标识符包裹，避免提示词中的 # 被识别为标题
   */
  const updateOutlineWithPrompt = useCallback((sectionTitle: string, promptContent: string) => {
    setOutline(prev => {
      const lines = prev.split('\n');
      const newLines: string[] = [];
      let i = 0;
      
      while (i < lines.length) {
        const line = lines[i];
        newLines.push(line);
        
        // 找到匹配的章节标题
        if (line.trim() === sectionTitle.trim()) {
          // 跳过已存在的提示词内容（从 <!-- PROMPT_START --> 到 <!-- PROMPT_END -->）
          i++;
          if (i < lines.length && lines[i].trim() === '<!-- PROMPT_START -->') {
            // 跳过旧的提示词块
            i++;
            while (i < lines.length && lines[i].trim() !== '<!-- PROMPT_END -->') {
              i++;
            }
            if (i < lines.length && lines[i].trim() === '<!-- PROMPT_END -->') {
              i++; // 跳过结束标识符
            }
            // 跳过空行
            while (i < lines.length && lines[i].trim() === '') {
              i++;
            }
          }
          
          // 插入新的提示词块
          newLines.push('<!-- PROMPT_START -->');
          newLines.push(promptContent);
          newLines.push('<!-- PROMPT_END -->');
          newLines.push(''); // 添加空行分隔
          continue;
        }
        
        i++;
      }
      
      return newLines.join('\n');
    });
  }, []);

  /**
   * 匹配提示词 - 从本地提示词库查找最佳匹配
   * 支持标题优先匹配 + 关键词辅助匹配
   */
  const handleMatchPromptForSection = async (sectionTitle: string) => {
    try {
      const userId = getUserId();
      const storageKey = `${userId}_prompts`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        alert('提示词库为空，请先在提示词管理中添加提示词');
        return;
      }
      
      const allPrompts = JSON.parse(stored);
      
      if (!Array.isArray(allPrompts) || allPrompts.length === 0) {
        alert('提示词库为空，请先添加提示词');
        return;
      }
      
      // 移除章节标题中的 Markdown 标记（## ### 等）
      const cleanTitle = sectionTitle.replace(/^#{2,}\s+/, '').trim();
      
      // 严格匹配规则：只有标题完全一致才匹配
      let matchedPrompt: Prompt | null = null;
      
      for (const prompt of allPrompts) {
        // 标准化标题：转小写、去除前后空格
        const promptTitleLower = prompt.title.toLowerCase().trim();
        const cleanTitleLower = cleanTitle.toLowerCase().trim();
        
        // 只有完全匹配才成功
        if (promptTitleLower === cleanTitleLower) {
          matchedPrompt = prompt;
          break; // 找到匹配，立即退出
        }
      }
      
      // 应用匹配结果
      if (matchedPrompt) {
        setSectionPrompts(prev => ({
          ...prev,
          [sectionTitle]: matchedPrompt!.content
        }));
        // 🔥 实时更新右侧大纲
        updateOutlineWithPrompt(sectionTitle, matchedPrompt!.content);
        alert(`✓ 已匹配提示词：${matchedPrompt!.title}`);
        console.log('匹配成功:', { sectionTitle: cleanTitle, prompt: matchedPrompt!.title });
      } else {
        const confirmed = window.confirm(
          `❌ 未找到匹配的提示词\n\n` +
          `章节名称："${cleanTitle}"\n` +
          `需要提示词库中存在完全相同的标题才能匹配。\n\n` +
          `是否使用 AI 生成提示词？`
        );
        if (confirmed) {
          await handleGeneratePromptForSection(sectionTitle);
        }
      }
    } catch (error) {
      console.error('匹配提示词失败:', error);
      alert(`匹配失败：${error}`);
    }
  };
  
  /**
   * AI 生成章节提示词
   */
  const handleGeneratePromptForSection = async (sectionTitle: string) => {
    try {
      // 移除 Markdown 标记
      const cleanTitle = sectionTitle.replace(/^#{2,}\s+/, '').trim();
      
      const response = await fetch(`${API_BASE_URL}/generate-section-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${projectName} - ${docName}`,
          outline: outline,
          section_title: cleanTitle,
          project_name: projectName,
          doc_name: docName,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '生成失败');
      }
      
      const data = await response.json();
      
      if (!data.prompt) {
        throw new Error('返回的提示词为空');
      }
      
      // 更新章节提示词
      setSectionPrompts(prev => ({
        ...prev,
        [sectionTitle]: data.prompt
      }));
      
      // 🔥 实时更新右侧大纲
      updateOutlineWithPrompt(sectionTitle, data.prompt);
      
      alert('✨ AI 生成提示词成功');
      console.log('AI生成成功:', { sectionTitle: cleanTitle, prompt: data.prompt.substring(0, 100) + '...' });
    } catch (error) {
      console.error('AI生成提示词失败:', error);
      alert(`生成失败：${error}`);
    }
  };
  
  /**
   * 批量生成提示词 - 分两个阶段：
   * 1. 先遍历所有章节，匹配提示词库
   * 2. 显示匹配结果，用户确认后再对未匹配的章节进行AI生成
   */
  const handleBatchGeneratePrompts = async () => {
    if (!sections || sections.length === 0) {
      alert('请先生成大纲');
      return;
    }
    
    const confirmed = window.confirm(
      `将为 ${sections.length} 个章节批量匹配提示词\n\n` +
      `处理流程：\n` +
      `1. 先遍历所有章节，从提示词库匹配\n` +
      `2. 显示匹配结果，确认后再对未匹配的章节使用 AI 生成\n\n` +
      `是否继续？`
    );
    
    if (!confirmed) return;
    
    setIsBatchGenerating(true);
    setBatchProgress({ 
      current: 0, 
      total: sections.length, 
      matched: 0, 
      generated: 0, 
      failed: 0 
    });
    
    // 重置控制标记
    batchGenerationControl.current.isPaused = false;
    batchGenerationControl.current.isCancelled = false;
    
    const matchedPrompts: Record<string, string> = {};
    const unmatchedSections: Array<{ index: number; title: string; cleanTitle: string }> = [];
    let matched = 0;
    
    // 加载提示词库
    const userId = getUserId();
    const storageKey = `${userId}_prompts`;
    const stored = localStorage.getItem(storageKey);
    const allPrompts = stored ? JSON.parse(stored) : [];
    
    try {
      // ========== 第一阶段：遍历所有章节，只进行匹配 ==========
      for (let i = 0; i < sections.length; i++) {
        // 检查取消标记
        if (batchGenerationControl.current.isCancelled) {
          console.log('批量匹配已取消');
          break;
        }
        
        // 检查暂停标记
        while (batchGenerationControl.current.isPaused && !batchGenerationControl.current.isCancelled) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const sectionTitle = sections[i];
        const cleanTitle = sectionTitle.replace(/^#{2,}\s+/, '').trim();
        
        console.log(`匹配章节 ${i + 1}/${sections.length}: ${cleanTitle}`);
        
        // 尝试匹配提示词库（严格完全匹配）
        let matchedPrompt: Prompt | null = null;
        
        for (const prompt of allPrompts) {
          // 标准化标题：转小写、去除前后空格
          const promptTitleLower = prompt.title.toLowerCase().trim();
          const cleanTitleLower = cleanTitle.toLowerCase().trim();
          
          // 只有完全匹配才成功
          if (promptTitleLower === cleanTitleLower) {
            matchedPrompt = prompt;
            break; // 找到匹配，立即退出
          }
        }
        
        // 如果匹配成功
        if (matchedPrompt) {
          matchedPrompts[sectionTitle] = matchedPrompt.content;
          matched++;
          console.log(`  ✓ 匹配成功: ${matchedPrompt.title}`);
        } else {
          // 记录未匹配的章节
          unmatchedSections.push({
            index: i,
            title: sectionTitle,
            cleanTitle: cleanTitle
          });
          console.log(`  ✗ 未匹配: ${cleanTitle}`);
        }
        
        // 更新进度
        setBatchProgress({
          current: i + 1,
          total: sections.length,
          matched,
          generated: 0,
          failed: 0
        });
      }
      
      // 应用已匹配的提示词
      setSectionPrompts(prev => ({ ...prev, ...matchedPrompts }));
      
      // 实时更新右侧大纲显示（已匹配的）
      for (const [sectionTitle, promptContent] of Object.entries(matchedPrompts)) {
        updateOutlineWithPrompt(sectionTitle, promptContent);
      }
      
      // ========== 第二阶段：显示匹配结果，让用户确认是否AI生成 ==========
      const unmatchedCount = unmatchedSections.length;
      const matchedCount = matched;
      
      let shouldGenerate = false;
      
      if (unmatchedCount > 0) {
        const unmatchedList = unmatchedSections
          .slice(0, 10) // 最多显示10个
          .map((s, idx) => `${idx + 1}. ${s.cleanTitle}`)
          .join('\n');
        
        const moreText = unmatchedCount > 10 ? `\n... 还有 ${unmatchedCount - 10} 个章节` : '';
        
        shouldGenerate = window.confirm(
          `匹配完成！\n\n` +
          `✓ 已匹配: ${matchedCount} 个章节\n` +
          `✗ 未匹配: ${unmatchedCount} 个章节\n\n` +
          `未匹配的章节：\n${unmatchedList}${moreText}\n\n` +
          `是否使用 AI 为未匹配的章节生成提示词？`
        );
      } else {
        alert(
          `匹配完成！\n\n` +
          `✓ 已匹配: ${matchedCount} 个章节\n` +
          `✓ 所有章节都已匹配成功！`
        );
      }
      
      // ========== 第三阶段：对未匹配的章节进行AI生成 ==========
      if (shouldGenerate && unmatchedSections.length > 0) {
        let generated = 0;
        let failed = 0;
        const generatedPrompts: Record<string, string> = {};
        
        for (let i = 0; i < unmatchedSections.length; i++) {
          // 检查取消标记
          if (batchGenerationControl.current.isCancelled) {
            console.log('AI生成已取消');
            break;
          }
          
          // 检查暂停标记
          while (batchGenerationControl.current.isPaused && !batchGenerationControl.current.isCancelled) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          const { title: sectionTitle, cleanTitle } = unmatchedSections[i];
          
          console.log(`AI生成 ${i + 1}/${unmatchedSections.length}: ${cleanTitle}`);
          
          try {
            const response = await fetch(`${API_BASE_URL}/generate-section-prompt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topic: `${projectName} - ${docName}`,
                outline: outline,
                section_title: cleanTitle,
                project_name: projectName,
                doc_name: docName,
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.prompt) {
                generatedPrompts[sectionTitle] = data.prompt;
                generated++;
                console.log(`  ✨ AI生成成功`);
              } else {
                failed++;
                console.log(`  ✗ 生成失败: 返回为空`);
              }
            } else {
              failed++;
              console.log(`  ✗ 生成失败: HTTP ${response.status}`);
            }
          } catch (error) {
            failed++;
            console.error(`  ✗ 生成失败:`, error);
          }
          
          // 更新进度
          setBatchProgress({
            current: sections.length,
            total: sections.length,
            matched,
            generated,
            failed
          });
          
          // 实时更新已生成的提示词
          setSectionPrompts(prev => ({ ...prev, ...generatedPrompts }));
          
          // 实时更新右侧大纲显示
          if (generatedPrompts[sectionTitle]) {
            updateOutlineWithPrompt(sectionTitle, generatedPrompts[sectionTitle]);
          }
        }
        
        // 显示最终统计
        const total = matched + generated;
        const message = 
          `批量生成完成！\n\n` +
          `✓ 数据库匹配: ${matched}\n` +
          `✨ AI生成: ${generated}\n` +
          `✗ 失败: ${failed}\n\n` +
          `总计: ${total}/${sections.length}`;
        
        alert(message);
        console.log('批量生成完成:', { matched, generated, failed, total: sections.length });
      }
      
    } catch (error) {
      console.error('批量生成过程出错:', error);
      alert(`批量生成出错：${error}`);
    } finally {
      setIsBatchGenerating(false);
      setBatchGenerationPaused(false);
    }
  };
  
  /**
   * 暂停批量生成
   */
  const handlePauseBatchGeneration = () => {
    batchGenerationControl.current.isPaused = !batchGenerationControl.current.isPaused;
    setBatchGenerationPaused(batchGenerationControl.current.isPaused);
    console.log(batchGenerationControl.current.isPaused ? '批量生成已暂停' : '批量生成已继续');
  };
  
  /**
   * 取消批量生成
   */
  const handleCancelBatchGeneration = () => {
    const confirmed = window.confirm('确定要取消批量生成吗？\n\n已生成的提示词将被保留。');
    if (confirmed) {
      batchGenerationControl.current.isCancelled = true;
      setIsBatchGenerating(false);
      setBatchGenerationPaused(false);
      console.log('批量生成已取消');
    }
  };
  
  /**
   * 继续未完成的批量生成
   */
  const handleContinueBatchGeneration = () => {
    // 重新开始批量生成
    handleBatchGeneratePrompts();
  };

  return (
    <div className="writing-workspace">
      <div className="workspace-header">
        <button className="back-button" onClick={onClose}>
          ← 返回项目
        </button>
        <div className="document-info">
          <h2 className="document-title-header">{document.title || '未命名文档'}</h2>
          <div className="topic-display">
            <span className="topic-label">所属项目：</span>
            <span className="topic-text">{projectName}</span>
          </div>
        </div>
        <div className="header-actions">
          {/* 生成模式切换 - 仅在有大纲时显示 */}
          {sections.length > 0 && (
            <div className="generation-mode-toggle">
              <span className="mode-label">生成模式：</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={generationMode === 'continuous'}
                  onChange={(e) => setGenerationMode(e.target.checked ? 'continuous' : 'sequential')}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="mode-text">{generationMode === 'continuous' ? '一次性生成' : '逐章节生成'}</span>
            </div>
          )}
          
          {sections.length > 0 && !isGeneratingContent && !waitingForConfirmation && (
            <button 
              className="generate-content-btn"
              onClick={handleStartGeneration}
            >
              开始生成内容
            </button>
          )}
          
          {waitingForConfirmation && generationMode === 'sequential' && (
            <button 
              className="continue-btn"
              onClick={handleContinueGeneration}
            >
              继续下一章节
            </button>
          )}
          
          <button className="save-button" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
      
      <div className="workspace-content">
        {/* 左侧：章节管理 */}
        <div 
          className="section-panel" 
          style={{ width: `${leftPanelWidth}px` }}
        >
          {sections.length === 0 ? (
            <div className="empty-section-placeholder">
              <button 
                className="generate-outline-btn-large"
                onClick={handleGenerateOutlineClick}
                disabled={isGeneratingOutline}
              >
                {isGeneratingOutline ? '生成中...' : '生成大纲'}
              </button>
              <p className="empty-hint">暂无大纲</p>
            </div>
          ) : (
            <CompactSectionManager
              sections={sections}
              generatedContent={generatedContent}
              isGeneratingContent={isGeneratingContent}
              currentSectionIndex={currentSectionIndex}
              sectionPrompts={sectionPrompts}
              onRegenerateSection={handleRegenerateSection}
              onJumpToSection={handleJumpToSection}
              onEditSection={handleEditSection}
              onReorderSections={(newOrder) => setSections(newOrder)}
              onUpdateSectionPrompt={(title, prompt) => {
                setSectionPrompts(prev => ({ ...prev, [title]: prompt }));
              }}
              onGeneratePromptForSection={handleGeneratePromptForSection}
              onMatchPromptForSection={handleMatchPromptForSection}
              onBatchGeneratePrompts={handleBatchGeneratePrompts}
              isBatchGenerating={isBatchGenerating}
              batchProgress={batchProgress}
              onPauseBatchGeneration={handlePauseBatchGeneration}
              onCancelBatchGeneration={handleCancelBatchGeneration}
              batchGenerationPaused={batchGenerationPaused}
              hasUnfinishedBatchGeneration={hasUnfinishedBatchGeneration}
              onContinueBatchGeneration={handleContinueBatchGeneration}
              onAddSection={handleAddSection}
              onDeleteSection={handleDeleteSection}
              onUpdateSectionTitle={handleUpdateSectionTitle}
            />
          )}
        </div>
        
        {/* 分隔条 */}
        <div className="resizer" />
        
        {/* 右侧：编辑器（可切换大纲/内容） */}
        <div className="editor-panel">
          <EnhancedEditorPanel
            outline={outline}
            setOutline={setOutline}
            generatedContent={generatedContent}
            setGeneratedContent={setGeneratedContent}
            sections={sections}
            currentSectionIndex={currentSectionIndex}
          />
        </div>
      </div>
      
      {showRegenerateDialog && regenerateSectionIndex !== null && (
        <RegenerateDialog
          sectionTitle={sections[regenerateSectionIndex]}
          onConfirm={() => {}}
          onCancel={() => {
            setShowRegenerateDialog(false);
            setRegenerateSectionIndex(null);
          }}
        />
      )}
      
      {showEditSectionDialog && editSectionIndex !== null && (
        <EditSectionDialog
          sectionTitle={sections[editSectionIndex]}
          onConfirm={() => {}}
          onCancel={() => {
            setShowEditSectionDialog(false);
            setEditSectionIndex(null);
          }}
        />
      )}
      
      {showOutlinePromptDialog && (
        <OutlinePromptDialog
          defaultPrompt={outlinePrompt}
          onConfirm={handleGenerateOutlineConfirm}
          onCancel={() => setShowOutlinePromptDialog(false)}
        />
      )}
    </div>
  );
};

export default WritingWorkspace;

