import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './RightPanel.css';
import { exportToDocx } from '../utils/wordExporter';

interface RightPanelProps {
  outline: string;
  setOutline: (outline: string) => void;
  generatedContent: string;
  setGeneratedContent: (content: string) => void;
}

type ViewMode = 'outline' | 'content';

const RightPanel: React.FC<RightPanelProps> = ({
  outline,
  setOutline,
  generatedContent,
  setGeneratedContent,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('outline');
  const [editMode, setEditMode] = useState(true);

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

  return (
    <div className="right-panel">
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
          <button
            className={`tab ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
          >
            👁️ 预览
          </button>
        </div>

        <div className="toolbar-actions">
          {viewMode !== 'preview' && (
            <button
              className={`btn-icon ${editMode ? 'active' : ''}`}
              onClick={() => setEditMode(!editMode)}
              title={editMode ? '切换到只读' : '切换到编辑'}
            >
              {editMode ? '✏️' : '🔒'}
            </button>
          )}
          <button
            className="btn-icon"
            onClick={copyToClipboard}
            title="复制到剪贴板"
          >
            📋
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

      <div className="panel-editor">
        {viewMode === 'preview' || !editMode ? (
          <div className="markdown-preview">
            <ReactMarkdown>{getDisplayContent() || '暂无内容'}</ReactMarkdown>
          </div>
        ) : (
          <textarea
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

