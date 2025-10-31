import React, { useState, useRef, useEffect } from 'react';
import './RightPanel.css';
import { exportToDocx } from '../utils/wordExporter';
import SectionManager from './SectionManager';

interface RightPanelProps {
  outline: string;
  setOutline: (outline: string) => void;
  generatedContent: string;
  setGeneratedContent: (content: string) => void;
  onViewModeChange?: (mode: 'outline' | 'content') => void;
  onScrollRatioChange?: (ratio: number) => void;
  sections: string[];
  isGeneratingContent: boolean;
  currentSectionIndex: number;
  onRegenerateSection: (sectionIndex: number) => void;
  onJumpToSection: (sectionIndex: number) => void;
}

type ViewMode = 'outline' | 'content' | 'sections';

const RightPanel: React.FC<RightPanelProps> = ({
  outline,
  setOutline,
  generatedContent,
  setGeneratedContent,
  onViewModeChange,
  onScrollRatioChange,
  sections,
  isGeneratingContent,
  currentSectionIndex,
  onRegenerateSection,
  onJumpToSection,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('outline');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getDisplayContent = () => {
    if (viewMode === 'outline') {
      return outline;
    } else {
      return generatedContent;
    }
  };

  const handleContentChange = (value: string) => {
    if (viewMode === 'outline') {
      setOutline(value);
    } else {
      setGeneratedContent(value);
    }
  };

  const exportToWord = async () => {
    const content = getDisplayContent();
    const filename = viewMode === 'outline' ? '大纲' : '内容';
    try {
      await exportToDocx(content, filename);
    } catch (error) {
      console.error('导出Word失败:', error);
    }
  };

  const downloadAsMarkdown = () => {
    const content = getDisplayContent();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viewMode === 'outline' ? '大纲' : '内容'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 处理视图模式切换
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (onViewModeChange && mode !== 'sections') {
      onViewModeChange(mode);
    }
  };

  // 监听滚动事件，计算滚动比例（使用 requestAnimationFrame 优化）
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !onScrollRatioChange) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (textareaRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
            const maxScroll = scrollHeight - clientHeight;
            const ratio = maxScroll > 0 ? scrollTop / maxScroll : 0;
            onScrollRatioChange(ratio);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    textarea.addEventListener('scroll', handleScroll, { passive: true });
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, [onScrollRatioChange]);

  return (
    <div className="right-panel editor-panel">
      <div className="panel-toolbar">
        <div className="view-tabs">
          <button
            className={`tab ${viewMode === 'outline' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('outline')}
          >
            📋 大纲编辑
          </button>
          <button
            className={`tab ${viewMode === 'content' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('content')}
          >
            📄 内容编辑
          </button>
          <button
            className={`tab ${viewMode === 'sections' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('sections')}
          >
            📑 章节管理
          </button>
        </div>

        {viewMode !== 'sections' && (
          <div className="toolbar-actions">
            <button
              className="btn-icon"
              onClick={exportToWord}
              title="导出为Word文档"
            >
              📝
            </button>
            <button
              className="btn-icon"
              onClick={downloadAsMarkdown}
              title="下载为 Markdown"
            >
              ⬇️
            </button>
          </div>
        )}
      </div>

      <div className="panel-editor">
        {viewMode === 'sections' ? (
          <SectionManager
            sections={sections}
            generatedContent={generatedContent}
            isGeneratingContent={isGeneratingContent}
            currentSectionIndex={currentSectionIndex}
            onRegenerateSection={onRegenerateSection}
            onJumpToSection={onJumpToSection}
          />
        ) : (
          <textarea
            ref={textareaRef}
            className="markdown-editor"
            value={getDisplayContent()}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={
              viewMode === 'outline'
                ? '大纲将在这里显示，您可以编辑修改...'
                : '生成的内容将在这里显示...'
            }
          />
        )}
      </div>
    </div>
  );
};

export default RightPanel;

