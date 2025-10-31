import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import './PreviewPanel.css';

interface PreviewPanelProps {
  outline: string;
  generatedContent: string;
  viewMode: 'outline' | 'content';
  scrollRatio: number;
  sections: string[];
  currentSectionIndex: number;
}

type PreviewViewMode = 'outline' | 'content';

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  outline,
  generatedContent,
  viewMode: editorViewMode,
  scrollRatio,
  sections,
  currentSectionIndex,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewMode, setPreviewMode] = useState<PreviewViewMode>('outline');

  // 当编辑器视图模式改变时，自动同步预览模式
  useEffect(() => {
    setPreviewMode(editorViewMode);
  }, [editorViewMode]);

  const getDisplayContent = () => {
    if (previewMode === 'outline') {
      return outline || '暂无大纲内容';
    } else {
      return generatedContent || '暂无生成内容';
    }
  };

  // 同步滚动位置（移除 smooth 动画，使用即时滚动）
  useEffect(() => {
    if (previewRef.current) {
      const { scrollHeight, clientHeight } = previewRef.current;
      const maxScroll = scrollHeight - clientHeight;
      const targetScrollTop = maxScroll * scrollRatio;
      
      // 使用即时滚动，避免动画冲突
      previewRef.current.scrollTop = targetScrollTop;
    }
  }, [scrollRatio, previewMode]);

  // 当点击章节后，自动滚动到对应位置
  useEffect(() => {
    if (previewMode === 'content' && previewRef.current && sections.length > 0) {
      const targetSection = sections[currentSectionIndex];
      if (targetSection && generatedContent.includes(targetSection)) {
        // 简单的方式：滚动到内容的大致位置
        // 更精确的方式需要解析DOM节点
        const sectionPos = generatedContent.indexOf(targetSection);
        const totalLength = generatedContent.length;
        const ratio = sectionPos / totalLength;
        
        const { scrollHeight, clientHeight } = previewRef.current;
        const maxScroll = scrollHeight - clientHeight;
        const targetScrollTop = maxScroll * ratio;
        
        previewRef.current.scrollTop = targetScrollTop;
      }
    }
  }, [currentSectionIndex, previewMode, sections, generatedContent]);

  return (
    <div className="preview-panel">
      <div className="preview-toolbar">
        <div className="preview-tabs">
          <button
            className={`preview-tab ${previewMode === 'outline' ? 'active' : ''}`}
            onClick={() => setPreviewMode('outline')}
          >
            📋 大纲预览
          </button>
          <button
            className={`preview-tab ${previewMode === 'content' ? 'active' : ''}`}
            onClick={() => setPreviewMode('content')}
          >
            📄 内容预览
          </button>
        </div>
        <div className="preview-hint">
          <span className="sync-icon">🔄</span> 跟随编辑窗格
        </div>
      </div>

      <div className="preview-content">
        <div ref={previewRef} className="markdown-preview">
          <ReactMarkdown 
            remarkPlugins={[remarkBreaks, remarkGfm]}
          >
            {getDisplayContent()}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;

