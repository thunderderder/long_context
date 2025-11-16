import React, { useState } from 'react';
import { exportToDocx } from '../utils/wordExporter';
import NotionStyleEditor from './NotionStyleEditor';
import './EnhancedEditorPanel.css';

interface EnhancedEditorPanelProps {
  outline: string;
  setOutline: (outline: string) => void;
  generatedContent: string;
  setGeneratedContent: (content: string) => void;
  sections: string[];
  currentSectionIndex: number;
}

type ViewMode = 'outline' | 'content';

const EnhancedEditorPanel: React.FC<EnhancedEditorPanelProps> = ({
  outline,
  setOutline,
  generatedContent,
  setGeneratedContent,
  sections,
  currentSectionIndex,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('outline');

  const getDisplayContent = () => {
    return viewMode === 'outline' ? outline : generatedContent;
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

  return (
    <div className="enhanced-editor-panel">
      <div className="panel-toolbar">
        <div className="view-tabs">
          <button
            className={`tab ${viewMode === 'outline' ? 'active' : ''}`}
            onClick={() => setViewMode('outline')}
          >
            📋 大纲
          </button>
          <button
            className={`tab ${viewMode === 'content' ? 'active' : ''}`}
            onClick={() => setViewMode('content')}
          >
            📄 内容
          </button>
        </div>

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
      </div>

      <div className="panel-content">
        {/* 为每个视图创建独立的编辑器实例，避免状态混乱 */}
        {viewMode === 'outline' ? (
          <NotionStyleEditor
            key="outline-editor"
            content={outline}
            onChange={setOutline}
            enableAI={false}  // 大纲不启用 AI 功能
          />
        ) : (
          <NotionStyleEditor
            key="content-editor"
            content={generatedContent}
            onChange={setGeneratedContent}
            enableAI={true}  // 内容启用 AI 功能
          />
        )}
      </div>

      <div className="editor-tip">
        {viewMode === 'outline' ? (
          <>💡 <strong>提示：</strong>选中文字可修改标题级别</>
        ) : (
          <>💡 <strong>提示：</strong>选中任意文字，输入 AI 指令进行改进、简化或扩展</>
        )}
      </div>
    </div>
  );
};

export default EnhancedEditorPanel;

