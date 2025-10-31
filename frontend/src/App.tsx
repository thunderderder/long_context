import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import LeftPanel from './components/LeftPanel';
import CompactSectionManager from './components/CompactSectionManager';
import EditableMarkdownPanel from './components/EditableMarkdownPanel';
import RegenerateDialog from './components/RegenerateDialog';
import EditSectionDialog from './components/EditSectionDialog';

export type GenerationMode = 'sequential' | 'continuous';

export interface AppState {
  topic: string;
  outline: string;
  generatedContent: string;
  isGeneratingOutline: boolean;
  isGeneratingContent: boolean;
  currentSectionIndex: number;
  generationMode: GenerationMode;
}

// LocalStorage 键名
const STORAGE_KEY = 'ai-writing-assistant-state';
const AUTOSAVE_INTERVAL = 3000; // 每3秒自动保存一次

// 默认提示词
const DEFAULT_OUTLINE_PROMPT = `你是一位专业的公文写作助手。用户想要写一篇关于"{topic}"的文章。

请为这个主题生成一个详细的大纲。大纲应该：
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

文档主题：
{topic}

这是之前撰写的内容：
{context}

现在需要详细撰写以下部分：
{current_section}`;

function App() {
  // 从 localStorage 恢复状态
  const loadSavedState = () => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        return {
          topic: parsed.topic || '',
          outline: parsed.outline || '',
          generatedContent: parsed.generatedContent || '',
          currentSectionIndex: parsed.currentSectionIndex || 0,
          generationMode: parsed.generationMode || 'sequential',
          sections: parsed.sections || [],
          sectionPrompts: parsed.sectionPrompts || {},
          outlinePrompt: parsed.outlinePrompt || DEFAULT_OUTLINE_PROMPT,
          sectionPrompt: parsed.sectionPrompt || DEFAULT_SECTION_PROMPT,
        };
      }
    } catch (e) {
      console.error('恢复保存状态失败:', e);
    }
    return null;
  };

  const savedState = loadSavedState();

  const [topic, setTopic] = useState(savedState?.topic || '');
  const [outline, setOutline] = useState(savedState?.outline || '');
  const [generatedContent, setGeneratedContent] = useState(savedState?.generatedContent || '');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(savedState?.currentSectionIndex || 0);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(savedState?.generationMode || 'sequential');
  const [sections, setSections] = useState<string[]>(savedState?.sections || []);
  const [sectionPrompts, setSectionPrompts] = useState<Record<string, string>>(savedState?.sectionPrompts || {}); // 存储每个章节的提示词
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnfinishedTask, setHasUnfinishedTask] = useState(false);
  
  // 提示词状态
  const [outlinePrompt, setOutlinePrompt] = useState(savedState?.outlinePrompt || DEFAULT_OUTLINE_PROMPT);
  const [sectionPrompt, setSectionPrompt] = useState(savedState?.sectionPrompt || DEFAULT_SECTION_PROMPT);
  
  // 用于避免循环更新的标记
  const isUpdatingFromContent = useRef(false);
  const isUpdatingFromOutline = useRef(false);
  const [showOutlinePrompt, setShowOutlinePrompt] = useState(false);
  const [showSectionPrompt, setShowSectionPrompt] = useState(false);
  
  // 章节管理窗格宽度
  const [sectionPanelWidth, setSectionPanelWidth] = useState(() => {
    const saved = localStorage.getItem('sectionPanelWidth');
    return saved ? parseInt(saved) : 240;
  });
  
  // 拖拽调整宽度
  const isResizing = useRef(false);
  const handleMouseDown = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    
    // 计算新宽度（相对于左侧面板之后的位置）
    const leftPanelWidth = 320; // 左侧面板固定宽度
    const newWidth = e.clientX - leftPanelWidth;
    
    // 限制宽度范围：150px - 600px
    const clampedWidth = Math.max(150, Math.min(600, newWidth));
    setSectionPanelWidth(clampedWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  // 编辑窗格的视图模式和滚动位置
  const [editorViewMode, setEditorViewMode] = useState<'outline' | 'content'>('outline');
  const [editorScrollRatio, setEditorScrollRatio] = useState(0);
  
  // 重新生成对话框状态
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenerateSectionIndex, setRegenerateSectionIndex] = useState<number | null>(null);
  
  // 编辑章节对话框状态
  const [showEditSectionDialog, setShowEditSectionDialog] = useState(false);
  const [editSectionIndex, setEditSectionIndex] = useState<number | null>(null);

  // 从环境变量读取 API URL，默认使用本地地址
  const API_BASE_URL = process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/api`
    : 'http://localhost:8000/api';

  // 保存窗格宽度
  useEffect(() => {
    localStorage.setItem('sectionPanelWidth', sectionPanelWidth.toString());
  }, [sectionPanelWidth]);

  // 保存状态到 localStorage
  const saveState = useCallback(() => {
    try {
      const stateToSave = {
        topic,
        outline,
        generatedContent,
        currentSectionIndex,
        generationMode,
        sections,
        sectionPrompts,
        outlinePrompt,
        sectionPrompt,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      setLastSaved(new Date());
    } catch (e) {
      console.error('保存状态失败:', e);
    }
  }, [topic, outline, generatedContent, currentSectionIndex, generationMode, sections, sectionPrompts, outlinePrompt, sectionPrompt]);

  // 清除保存的状态
  const clearSavedState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLastSaved(null);
      setTopic('');
      setOutline('');
      setGeneratedContent('');
      setCurrentSectionIndex(0);
      setSections([]);
      setOutlinePrompt(DEFAULT_OUTLINE_PROMPT);
      setSectionPrompt(DEFAULT_SECTION_PROMPT);
    } catch (e) {
      console.error('清除状态失败:', e);
    }
  }, []);

  // 自动保存 - 每3秒保存一次
  useEffect(() => {
    const interval = setInterval(() => {
      if (topic || outline || generatedContent) {
        saveState();
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [topic, outline, generatedContent, saveState]);

  // 页面卸载前保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  // 解析大纲中的章节（提取 ##、###、#### 等所有级别的标题及其下方的提示词）
  const parseOutlineSections = useCallback((outlineText: string): { sections: string[], prompts: Record<string, string> } => {
    const lines = outlineText.split('\n');
    const sections: string[] = [];
    const prompts: Record<string, string> = {};
    
    let currentSection: string | null = null;
    let currentPromptLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 匹配 2 级及以上的标题（##、###、####、##### 等）
      if (line.match(/^#{2,}\s+/)) {
        // 如果之前有章节，保存其提示词
        if (currentSection && currentPromptLines.length > 0) {
          prompts[currentSection] = currentPromptLines.join('\n').trim();
        }
        
        // 开始新章节
        sections.push(line);
        currentSection = line;
        currentPromptLines = [];
      } else if (currentSection && line) {
        // 如果当前有活动章节，且行不为空，收集作为提示词
        currentPromptLines.push(lines[i]); // 保留原始缩进
      }
    }
    
    // 保存最后一个章节的提示词
    if (currentSection && currentPromptLines.length > 0) {
      prompts[currentSection] = currentPromptLines.join('\n').trim();
    }
    
    return { sections, prompts };
  }, []);

  // 从生成内容中提取章节标题
  const extractSectionsFromContent = useCallback((content: string): string[] => {
    const lines = content.split('\n');
    const extractedSections: string[] = [];
    
    for (const line of lines) {
      // 匹配 2 级及以上的标题（##、###、####、##### 等）
      if (line.trim().match(/^#{2,}\s+/)) {
        extractedSections.push(line.trim());
      }
    }
    
    return extractedSections;
  }, []);

  // 智能合并：从内容中提取的章节 + 大纲中的提示词
  const syncOutlineFromContent = useCallback((content: string) => {
    if (isUpdatingFromOutline.current || !content.trim()) return;
    
    const contentSections = extractSectionsFromContent(content);
    if (contentSections.length === 0) return;
    
    // 检查章节是否有变化
    const currentSections = sections;
    const hasChanges = 
      contentSections.length !== currentSections.length ||
      contentSections.some((sec, idx) => sec !== currentSections[idx]);
    
    if (!hasChanges) return;
    
    console.log('检测到内容中的章节变化，同步到大纲');
    console.log('原章节:', currentSections);
    console.log('新章节:', contentSections);
    
    // 构建新的大纲：保留旧的提示词，使用新的章节标题
    const newOutlineLines: string[] = [];
    const newPrompts: Record<string, string> = {};
    
    contentSections.forEach((newSection) => {
      newOutlineLines.push(newSection);
      
      // 尝试找到对应的旧章节（基于标题文本，忽略 # 数量）
      const newTitle = newSection.replace(/^#+\s*/, '');
      const oldSection = currentSections.find(old => 
        old.replace(/^#+\s*/, '') === newTitle
      );
      
      // 如果找到旧章节且有提示词，保留提示词
      if (oldSection && sectionPrompts[oldSection]) {
        newOutlineLines.push(sectionPrompts[oldSection]);
        newPrompts[newSection] = sectionPrompts[oldSection];
      }
      
      // 添加空行分隔
      newOutlineLines.push('');
    });
    
    const newOutline = newOutlineLines.join('\n').trim();
    
    // 标记为从内容更新，避免触发循环
    isUpdatingFromContent.current = true;
    setOutline(newOutline);
    setSections(contentSections);
    setSectionPrompts(newPrompts);
    
    // 延迟重置标记
    setTimeout(() => {
      isUpdatingFromContent.current = false;
    }, 100);
  }, [sections, sectionPrompts, extractSectionsFromContent]);

  // 当大纲变化时，自动重新解析章节（仅在不生成内容且不是从内容更新时）
  useEffect(() => {
    if (outline && !isGeneratingContent && !isUpdatingFromContent.current) {
      isUpdatingFromOutline.current = true;
      const { sections: parsedSections, prompts } = parseOutlineSections(outline);
      setSections(parsedSections);
      setSectionPrompts(prompts);
      console.log('从大纲解析章节提示词:', prompts);
      
      // 延迟重置标记
      setTimeout(() => {
        isUpdatingFromOutline.current = false;
      }, 100);
    }
  }, [outline, isGeneratingContent, parseOutlineSections]);

  // 当生成内容变化时，同步章节到大纲（仅在手动编辑时）
  useEffect(() => {
    if (generatedContent && !isGeneratingContent && !isUpdatingFromOutline.current) {
      syncOutlineFromContent(generatedContent);
    }
  }, [generatedContent, isGeneratingContent, syncOutlineFromContent]);

  // 检测是否有未完成的生成任务
  useEffect(() => {
    if (savedState && savedState.sections && savedState.sections.length > 0) {
      const completedSections = savedState.currentSectionIndex || 0;
      const totalSections = savedState.sections.length;
      
      // 如果有已生成的内容，但还有未完成的章节
      if (completedSections > 0 && completedSections < totalSections && savedState.generatedContent) {
        setHasUnfinishedTask(true);
      }
    }
  }, []); // 只在组件加载时检查一次

  // 生成大纲
  const handleGenerateOutline = async () => {
    if (!topic.trim()) {
      alert('请输入主题');
      return;
    }

    setIsGeneratingOutline(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic,
          custom_prompt: outlinePrompt !== DEFAULT_OUTLINE_PROMPT ? outlinePrompt : ''
        }),
      });

      const data = await response.json();
      if (data.error) {
        alert(`错误：${data.error}`);
      } else {
        setOutline(data.outline);
        // 解析大纲中的章节
        const { sections: parsedSections, prompts } = parseOutlineSections(data.outline);
        setSections(parsedSections);
        setSectionPrompts(prompts);
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
    currentContent: string,
    currentMode: GenerationMode
  ) => {
    if (sectionIndex >= currentSections.length) {
      setIsGeneratingContent(false);
      setWaitingForConfirmation(false);
      return;
    }

    const currentSection = currentSections[sectionIndex];
    
    // 验证必需参数
    if (!currentTopic || !currentSection) {
      alert(`生成失败：缺少必需参数。主题：${currentTopic || '未设置'}，章节：${currentSection || '未设置'}`);
      setIsGeneratingContent(false);
      setWaitingForConfirmation(false);
      return;
    }
    
    setCurrentSectionIndex(sectionIndex);
    setIsGeneratingContent(true);

    try {
      // 获取该章节的专属提示词
      const sectionHint = sectionPrompts[currentSection] || '';
      
      const requestBody = {
        topic: currentTopic,
        outline: currentOutline,
        current_section: currentSection,
        previous_content: currentContent,
        custom_prompt: sectionPrompt !== DEFAULT_SECTION_PROMPT ? sectionPrompt : '',
        section_hint: sectionHint, // 章节下方的专属提示词
      };
      
      console.log('发送生成请求:', requestBody);
      if (sectionHint) {
        console.log('使用章节专属提示词:', sectionHint);
      }
      
      const response = await fetch(`${API_BASE_URL}/generate-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `服务器返回错误: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let newContent = currentContent + `\n\n${currentSection}\n\n`;
      setGeneratedContent(newContent);

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
                newContent += data.content;
                setGeneratedContent(newContent);
              }
              if (data.done) {
                // 章节完成
                if (currentMode === 'sequential') {
                  // 依次生成模式：等待用户确认
                  setWaitingForConfirmation(true);
                  setIsGeneratingContent(false);
                } else {
                  // 一次性生成模式：继续下一个章节
                  await generateSectionInternal(
                    sectionIndex + 1,
                    currentSections,
                    currentTopic,
                    currentOutline,
                    newContent,
                    currentMode
                  );
                }
              }
              if (data.error) {
                alert(`生成内容失败：${data.error}`);
                setIsGeneratingContent(false);
                setWaitingForConfirmation(false);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      alert(`生成内容失败：${error}`);
      setIsGeneratingContent(false);
      setWaitingForConfirmation(false);
    }
  };

  // 开始生成内容（重新生成）
  const handleStartGeneration = async () => {
    if (!outline.trim()) {
      alert('请先输入或生成大纲');
      return;
    }

    const { sections: parsedSections, prompts } = parseOutlineSections(outline);
    if (parsedSections.length === 0) {
      alert('大纲中没有找到章节标题（需要使用 ## 或 ### 标记）');
      return;
    }

    setSections(parsedSections);
    setSectionPrompts(prompts);
    setGeneratedContent('');
    setCurrentSectionIndex(0);
    setWaitingForConfirmation(false);
    setHasUnfinishedTask(false);
    
    await generateSectionInternal(0, parsedSections, topic, outline, '', generationMode);
  };

  // 继续未完成的生成
  const handleContinueFromSaved = async () => {
    if (!outline.trim()) {
      alert('请先输入或生成大纲');
      return;
    }

    const { sections: parsedSections, prompts } = parseOutlineSections(outline);
    if (parsedSections.length === 0) {
      alert('大纲中没有找到章节标题');
      return;
    }

    // 如果sections为空或大纲被修改，重新解析
    if (sections.length === 0 || sections.length !== parsedSections.length) {
      setSections(parsedSections);
      setSectionPrompts(prompts);
    }

    setHasUnfinishedTask(false);
    setWaitingForConfirmation(false);
    
    // 从保存的位置继续生成
    await generateSectionInternal(
      currentSectionIndex,
      parsedSections,
      topic,
      outline,
      generatedContent,
      generationMode
    );
  };

  // 继续生成下一章节（从未生成的章节开始）
  const handleContinueGeneration = () => {
    setWaitingForConfirmation(false);
    
    // 找到第一个未生成的章节
    const parsedSections = parseGeneratedContentBySections(generatedContent, sections);
    const generatedTitles = parsedSections.map(s => s.title);
    
    let nextUngenerated = currentSectionIndex + 1;
    for (let i = 0; i < sections.length; i++) {
      const sectionTitle = sections[i];
      const isGenerated = generatedContent.includes(sectionTitle);
      if (!isGenerated) {
        nextUngenerated = i;
        break;
      }
    }
    
    generateSectionInternal(
      nextUngenerated,
      sections,
      topic,
      outline,
      generatedContent,
      generationMode
    );
  };

  // 解析已生成内容，按章节分割
  const parseGeneratedContentBySections = useCallback((content: string, sectionList: string[]) => {
    if (!content || sectionList.length === 0) return [];
    
    const sectionContents: Array<{title: string, content: string, startPos: number, endPos: number}> = [];
    
    for (let i = 0; i < sectionList.length; i++) {
      const currentTitle = sectionList[i];
      const nextTitle = i < sectionList.length - 1 ? sectionList[i + 1] : null;
      
      // 查找当前标题在内容中的位置
      const startPos = content.indexOf(currentTitle);
      if (startPos === -1) {
        // 如果找不到标题，说明这个章节还没有生成
        continue;
      }
      
      // 查找下一个标题的位置，确定当前章节的结束位置
      let endPos;
      if (nextTitle) {
        endPos = content.indexOf(nextTitle, startPos + currentTitle.length);
        if (endPos === -1) {
          endPos = content.length;
        }
      } else {
        endPos = content.length;
      }
      
      // 提取章节内容（不包括标题本身）
      const sectionContent = content.substring(startPos + currentTitle.length, endPos).trim();
      
      sectionContents.push({
        title: currentTitle,
        content: sectionContent,
        startPos: startPos,
        endPos: endPos
      });
    }
    
    return sectionContents;
  }, []);

  // 打开重新生成对话框
  const handleRegenerateSection = (sectionIndex: number) => {
    if (sectionIndex < 0 || sectionIndex >= sections.length) {
      alert('无效的章节索引');
      return;
    }

    if (!topic.trim()) {
      alert('请先输入主题');
      return;
    }

    setRegenerateSectionIndex(sectionIndex);
    setShowRegenerateDialog(true);
  };

  // 实际执行重新生成
  const executeRegeneration = async (newPrompt: string) => {
    if (regenerateSectionIndex === null) return;
    
    const sectionIndex = regenerateSectionIndex;
    const targetSection = sections[sectionIndex];
    
    // 关闭对话框
    setShowRegenerateDialog(false);
    
    // 解析当前已生成的内容
    const parsedSections = parseGeneratedContentBySections(generatedContent, sections);
    
    // 获取目标章节之前的所有内容作为上下文
    let previousContent = '';
    for (let i = 0; i < sectionIndex; i++) {
      const section = parsedSections.find(s => s.title === sections[i]);
      if (section) {
        previousContent += `\n\n${section.title}\n\n${section.content}`;
      }
    }

    // 获取目标章节的原有内容
    const targetSectionData = parsedSections.find(s => s.title === targetSection);
    const previewContext = targetSectionData ? targetSectionData.content : '';

    setIsGeneratingContent(true);
    setCurrentSectionIndex(sectionIndex);

    try {
      // 获取该章节的专属提示词
      const sectionHint = sectionPrompts[targetSection] || '';
      
      const requestBody = {
        topic: topic,
        outline: outline,
        current_section: targetSection,
        previous_content: previousContent.trim(),
        preview_context: previewContext,
        new_prompt: newPrompt,
        section_hint: sectionHint, // 章节下方的专属提示词
      };
      
      console.log('重新生成章节:', targetSection);
      console.log('用户新要求:', newPrompt);
      if (sectionHint) {
        console.log('使用章节专属提示词:', sectionHint);
      }
      
      const response = await fetch(`${API_BASE_URL}/regenerate-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `服务器返回错误: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let newSectionContent = '';

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
                newSectionContent += data.content;
                
                // 实时更新内容：替换目标章节
                let updatedContent = generatedContent;
                
                if (targetSectionData) {
                  // 替换已存在的章节内容
                  const beforeSection = updatedContent.substring(0, targetSectionData.startPos + targetSection.length);
                  const afterSection = updatedContent.substring(targetSectionData.endPos);
                  updatedContent = beforeSection + '\n\n' + newSectionContent + '\n\n' + afterSection;
                } else {
                  // 如果章节不存在，追加到末尾
                  if (updatedContent && !updatedContent.endsWith('\n\n')) {
                    updatedContent += '\n\n';
                  }
                  updatedContent += targetSection + '\n\n' + newSectionContent;
                }
                
                setGeneratedContent(updatedContent);
              }
              if (data.done) {
                // 生成完成
                setIsGeneratingContent(false);
                alert('章节重新生成完成！');
              }
              if (data.error) {
                alert(`生成内容失败：${data.error}`);
                setIsGeneratingContent(false);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      alert(`重新生成失败：${error}`);
      setIsGeneratingContent(false);
    }
  };

  // 跳转到指定章节
  const handleJumpToSection = (sectionIndex: number) => {
    if (sectionIndex < 0 || sectionIndex >= sections.length) return;
    
    // 设置当前章节索引（用于在预览面板中定位）
    setCurrentSectionIndex(sectionIndex);
    
    // 通知预览面板切换到内容视图并滚动到对应章节
    setEditorViewMode('content');
  };

  // 打开编辑章节对话框
  const handleEditSection = (sectionIndex: number) => {
    if (sectionIndex < 0 || sectionIndex >= sections.length) return;
    setEditSectionIndex(sectionIndex);
    setShowEditSectionDialog(true);
  };

  // 执行章节编辑
  const executeEditSection = (newTitle: string) => {
    if (editSectionIndex === null) return;
    
    const oldTitle = sections[editSectionIndex];
    const newSections = [...sections];
    newSections[editSectionIndex] = newTitle;
    
    // 更新sections
    setSections(newSections);
    
    // 更新大纲
    const newOutline = outline.replace(oldTitle, newTitle);
    setOutline(newOutline);
    
    // 更新已生成的内容（如果该章节已生成）
    if (generatedContent.includes(oldTitle)) {
      const newContent = generatedContent.replace(oldTitle, newTitle);
      setGeneratedContent(newContent);
    }
    
    setShowEditSectionDialog(false);
    setEditSectionIndex(null);
  };

  // 重排序章节
  const handleReorderSections = (newOrder: string[]) => {
    setSections(newOrder);
    
    // 更新大纲中的章节顺序
    const newOutline = newOrder.join('\n\n');
    setOutline(newOutline);
    
    // 如果有已生成的内容，也需要重新排序
    if (generatedContent) {
      const parsedSections = parseGeneratedContentBySections(generatedContent, sections);
      const newContent = newOrder.map(sectionTitle => {
        const section = parsedSections.find(s => s.title === sectionTitle);
        if (section) {
          return `${sectionTitle}\n\n${section.content}`;
        }
        return '';
      }).filter(Boolean).join('\n\n');
      
      setGeneratedContent(newContent);
    }
  };

  return (
    <div className="app">
      <LeftPanel
        topic={topic}
        setTopic={setTopic}
        generationMode={generationMode}
        setGenerationMode={setGenerationMode}
        isGeneratingOutline={isGeneratingOutline}
        isGeneratingContent={isGeneratingContent}
        waitingForConfirmation={waitingForConfirmation}
        currentSection={sections[currentSectionIndex] || ''}
        totalSections={sections.length}
        currentSectionIndex={currentSectionIndex}
        onGenerateOutline={handleGenerateOutline}
        onStartGeneration={handleStartGeneration}
        onContinueGeneration={handleContinueGeneration}
        outlinePrompt={outlinePrompt}
        setOutlinePrompt={setOutlinePrompt}
        sectionPrompt={sectionPrompt}
        setSectionPrompt={setSectionPrompt}
        showOutlinePrompt={showOutlinePrompt}
        setShowOutlinePrompt={setShowOutlinePrompt}
        showSectionPrompt={showSectionPrompt}
        setShowSectionPrompt={setShowSectionPrompt}
        defaultOutlinePrompt={DEFAULT_OUTLINE_PROMPT}
        defaultSectionPrompt={DEFAULT_SECTION_PROMPT}
        lastSaved={lastSaved}
        onClearState={clearSavedState}
        hasUnfinishedTask={hasUnfinishedTask}
        onContinueFromSaved={handleContinueFromSaved}
      />
      <div
        className="compact-section-manager"
        style={{ width: `${sectionPanelWidth}px` }}
      >
        <CompactSectionManager
          sections={sections}
          generatedContent={generatedContent}
          isGeneratingContent={isGeneratingContent}
          currentSectionIndex={currentSectionIndex}
          onRegenerateSection={handleRegenerateSection}
          onJumpToSection={handleJumpToSection}
          onEditSection={handleEditSection}
          onReorderSections={handleReorderSections}
        />
      </div>
      <div
        className="resizer"
        onMouseDown={handleMouseDown}
        title="拖拽调整宽度"
      />
      <EditableMarkdownPanel
        outline={outline}
        setOutline={setOutline}
        generatedContent={generatedContent}
        setGeneratedContent={setGeneratedContent}
        sections={sections}
        currentSectionIndex={currentSectionIndex}
      />
      
      {showRegenerateDialog && regenerateSectionIndex !== null && (
        <RegenerateDialog
          sectionTitle={sections[regenerateSectionIndex]}
          onConfirm={executeRegeneration}
          onCancel={() => {
            setShowRegenerateDialog(false);
            setRegenerateSectionIndex(null);
          }}
        />
      )}
      
      {showEditSectionDialog && editSectionIndex !== null && (
        <EditSectionDialog
          sectionTitle={sections[editSectionIndex]}
          onConfirm={executeEditSection}
          onCancel={() => {
            setShowEditSectionDialog(false);
            setEditSectionIndex(null);
          }}
        />
      )}
    </div>
  );
}

export default App;

