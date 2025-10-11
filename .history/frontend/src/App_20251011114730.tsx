import React, { useState, useCallback } from 'react';
import './App.css';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';

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

function App() {
  const [topic, setTopic] = useState('');
  const [outline, setOutline] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('sequential');
  const [sections, setSections] = useState<string[]>([]);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  // 生成大纲
  const handleGenerateOutline = useCallback(async () => {
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
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      if (data.error) {
        alert(`错误：${data.error}`);
      } else {
        setOutline(data.outline);
        // 解析大纲中的章节
        const parsedSections = parseOutlineSections(data.outline);
        setSections(parsedSections);
      }
    } catch (error) {
      alert(`生成大纲失败：${error}`);
    } finally {
      setIsGeneratingOutline(false);
    }
  }, [topic, API_BASE_URL]);

  // 解析大纲中的章节（提取 ## 和 ### 标题）
  const parseOutlineSections = (outlineText: string): string[] => {
    const lines = outlineText.split('\n');
    const sections: string[] = [];
    
    for (const line of lines) {
      if (line.trim().match(/^#{2,3}\s+/)) {
        sections.push(line.trim());
      }
    }
    
    return sections;
  };

  // 生成单个章节
  const generateSection = async (sectionIndex: number) => {
    if (sectionIndex >= sections.length) {
      setIsGeneratingContent(false);
      setWaitingForConfirmation(false);
      return;
    }

    const currentSection = sections[sectionIndex];
    setCurrentSectionIndex(sectionIndex);
    setIsGeneratingContent(true);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          outline,
          current_section: currentSection,
          previous_content: generatedContent,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let sectionContent = '';
      setGeneratedContent(prev => prev + `\n\n${currentSection}\n\n`);

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
                sectionContent += data.content;
                setGeneratedContent(prev => prev + data.content);
              }
              if (data.done) {
                // 章节完成
                if (generationMode === 'sequential') {
                  // 依次生成模式：等待用户确认
                  setWaitingForConfirmation(true);
                  setIsGeneratingContent(false);
                } else {
                  // 一次性生成模式：继续下一个章节
                  await generateSection(sectionIndex + 1);
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

  // 开始生成内容
  const handleStartGeneration = useCallback(async () => {
    if (!outline.trim()) {
      alert('请先生成大纲');
      return;
    }

    const parsedSections = parseOutlineSections(outline);
    if (parsedSections.length === 0) {
      alert('大纲中没有找到章节标题');
      return;
    }

    setSections(parsedSections);
    setGeneratedContent('');
    setCurrentSectionIndex(0);
    setWaitingForConfirmation(false);
    
    await generateSection(0);
  }, [outline, generationMode, topic, API_BASE_URL]);

  // 继续生成下一章节
  const handleContinueGeneration = useCallback(() => {
    setWaitingForConfirmation(false);
    generateSection(currentSectionIndex + 1);
  }, [currentSectionIndex, sections, generatedContent, outline, topic, API_BASE_URL]);

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
      />
      <RightPanel
        outline={outline}
        setOutline={setOutline}
        generatedContent={generatedContent}
        setGeneratedContent={setGeneratedContent}
      />
    </div>
  );
}

export default App;

