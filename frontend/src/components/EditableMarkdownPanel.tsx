import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { exportToDocx } from '../utils/wordExporter';
import './EditableMarkdownPanel.css';

interface EditableMarkdownPanelProps {
  outline: string;
  setOutline: (outline: string) => void;
  generatedContent: string;
  setGeneratedContent: (content: string) => void;
  sections: string[];
  currentSectionIndex: number;
}

type ViewMode = 'outline' | 'content';
type EditMode = 'edit' | 'preview';

const EditableMarkdownPanel: React.FC<EditableMarkdownPanelProps> = ({
  outline,
  setOutline,
  generatedContent,
  setGeneratedContent,
  sections,
  currentSectionIndex,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('outline');
  const [editMode, setEditMode] = useState<EditMode>('preview');
  const [isAutoMode, setIsAutoMode] = useState(true); // 是否启用自动切换模式
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const clickPositionRef = useRef<number>(0);

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

  // 点击预览区域，自动切换到编辑模式
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAutoMode) return;
    
    // 保存点击位置和滚动位置
    const previewElement = previewRef.current;
    if (!previewElement) return;
    
    const scrollTop = previewElement.scrollTop;
    const clickY = e.clientY;
    const previewRect = previewElement.getBoundingClientRect();
    
    // 计算点击位置相对于内容顶部的实际距离（包含滚动）
    const relativeClickY = clickY - previewRect.top + scrollTop;
    
    // 保存到 ref，避免在 setTimeout 中丢失
    clickPositionRef.current = scrollTop;
    
    // 切换到编辑模式
    setEditMode('edit');
    
    // 尝试将光标定位到点击的位置
    setTimeout(() => {
      if (!textareaRef.current) return;
      
      const textarea = textareaRef.current;
      
      // 计算光标位置
      const content = getDisplayContent();
      const lines = content.split('\n');
      
      // 估算每行的高度（基于 font-size 和 line-height）
      // markdown-preview: font-size: 15px, line-height: 1.8
      const estimatedLineHeight = 15 * 1.8; // ≈ 27px
      
      // 计算点击位置对应的行号
      const estimatedLine = Math.floor(relativeClickY / estimatedLineHeight);
      const targetLine = Math.max(0, Math.min(estimatedLine, lines.length - 1));
      
      // 计算目标行之前的所有字符数
      let cursorPosition = 0;
      for (let i = 0; i < targetLine; i++) {
        cursorPosition += lines[i].length + 1; // +1 for newline
      }
      
      // 确保光标位置在有效范围内
      cursorPosition = Math.min(cursorPosition, content.length);
      
      // 先设置光标位置（不触发滚动）
      textarea.setSelectionRange(cursorPosition, cursorPosition);
      
      // 聚焦
      textarea.focus();
      
      // 强制恢复滚动位置（在 focus 之后）
      requestAnimationFrame(() => {
        textarea.scrollTop = scrollTop;
        // 再次确保滚动位置
        requestAnimationFrame(() => {
          textarea.scrollTop = scrollTop;
        });
      });
      
      console.log(`Click Y: ${relativeClickY}px, Scroll: ${scrollTop}px, Line: ${targetLine}, Cursor: ${cursorPosition}`);
    }, 50);
  };

  // 编辑器失去焦点时，自动切换回预览模式
  const handleEditorBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!isAutoMode) return;
    
    // 保存滚动位置
    const scrollTop = textareaRef.current?.scrollTop || 0;
    
    // 延迟切换，避免点击工具栏按钮时立即切换
    setTimeout(() => {
      // 检查新焦点是否在工具栏内
      const activeElement = document.activeElement;
      const toolbar = document.querySelector('.toolbar-actions');
      if (toolbar && toolbar.contains(activeElement)) {
        return; // 如果焦点在工具栏，不切换
      }
      setEditMode('preview');
      
      // 切换回预览后恢复滚动位置
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.scrollTop = scrollTop;
        }
      }, 0);
    }, 150);
  };

  // 当点击章节后，自动滚动到对应位置
  useEffect(() => {
    if (viewMode === 'content' && sections.length > 0 && editMode === 'preview') {
      const targetSection = sections[currentSectionIndex];
      if (targetSection && generatedContent.includes(targetSection)) {
        // 这里可以添加滚动逻辑
        // 暂时简化处理
      }
    }
  }, [currentSectionIndex, viewMode, sections, generatedContent, editMode]);

  return (
    <div className="editable-markdown-panel">
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
            className={`btn-toggle ${isAutoMode ? 'active' : ''}`}
            onClick={() => setIsAutoMode(!isAutoMode)}
            title={isAutoMode ? '自动切换模式：开启' : '自动切换模式：关闭'}
          >
            {isAutoMode ? '🤖 自动' : '🔒 手动'}
          </button>
          <button
            className={`btn-mode ${editMode === 'edit' ? 'edit-mode' : 'preview-mode'}`}
            onClick={() => {
              setEditMode(editMode === 'edit' ? 'preview' : 'edit');
              setIsAutoMode(false); // 手动切换时关闭自动模式
            }}
            title={editMode === 'edit' ? '切换到预览模式（只读）' : '切换到编辑模式'}
          >
            {editMode === 'edit' ? '👁️ 预览' : '✏️ 编辑'}
          </button>
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
        {editMode === 'edit' ? (
          <textarea
            ref={textareaRef}
            className="markdown-editor"
            value={getDisplayContent()}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={handleEditorBlur}
            placeholder={
              viewMode === 'outline'
                ? '大纲将在这里显示，您可以编辑修改...'
                : '生成的内容将在这里显示...'
            }
          />
        ) : (
          <div 
            ref={previewRef}
            className="markdown-preview"
            onClick={handlePreviewClick}
            style={{ cursor: isAutoMode ? 'text' : 'default' }}
          >
            <ReactMarkdown 
              remarkPlugins={[remarkBreaks, remarkGfm]}
            >
              {getDisplayContent() || (viewMode === 'outline' ? '暂无大纲内容' : '暂无生成内容')}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableMarkdownPanel;

