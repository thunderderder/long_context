import React, { useMemo, useState, useEffect } from 'react';
import './CompactSectionManager.css';

interface CompactSectionManagerProps {
  sections: string[];
  generatedContent: string;
  isGeneratingContent: boolean;
  currentSectionIndex: number;
  sectionPrompts: Record<string, string>;  // 章节标题 -> 提示词
  onRegenerateSection: (sectionIndex: number) => void;
  onJumpToSection: (sectionIndex: number) => void;
  onEditSection: (sectionIndex: number) => void;
  onReorderSections: (newOrder: string[]) => void;
  onUpdateSectionPrompt: (sectionTitle: string, prompt: string) => void;  // 更新提示词
  onGeneratePromptForSection: (sectionTitle: string) => void;  // AI生成提示词
  onMatchPromptForSection: (sectionTitle: string) => void;  // 匹配数据库提示词
  onBatchGeneratePrompts: () => void;  // 批量生成提示词
  isBatchGenerating: boolean;  // 是否正在批量生成
  batchProgress: { current: number; total: number; matched: number; generated: number; failed: number };  // 批量生成进度
  onPauseBatchGeneration: () => void;  // 暂停批量生成
  onCancelBatchGeneration: () => void;  // 取消批量生成
  batchGenerationPaused: boolean;  // 是否暂停
  hasUnfinishedBatchGeneration: boolean;  // 是否有未完成的批量生成
  onContinueBatchGeneration: () => void;  // 继续未完成的批量生成
  onAddSection: (afterIndex: number, level: number) => void;  // 新增章节
  onDeleteSection: (index: number) => void;  // 删除章节
  onUpdateSectionTitle: (index: number, newTitle: string) => void;  // 更新章节标题
}

interface ParsedSection {
  title: string;
  rawTitle: string;  // 原始标题（包含 ## 等）
  index: number;
  isGenerated: boolean;
  level: number;
}

const CompactSectionManager: React.FC<CompactSectionManagerProps> = ({
  sections,
  generatedContent,
  isGeneratingContent,
  currentSectionIndex,
  sectionPrompts,
  onRegenerateSection,
  onJumpToSection,
  onEditSection,
  onReorderSections,
  onUpdateSectionPrompt,
  onGeneratePromptForSection,
  onMatchPromptForSection,
  onBatchGeneratePrompts,
  isBatchGenerating,
  batchProgress,
  onPauseBatchGeneration,
  onCancelBatchGeneration,
  batchGenerationPaused,
  hasUnfinishedBatchGeneration,
  onContinueBatchGeneration,
  onAddSection,
  onDeleteSection,
  onUpdateSectionTitle,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [editingPrompt, setEditingPrompt] = useState<number | null>(null);
  const [editingPromptText, setEditingPromptText] = useState('');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);  // 鼠标悬停的章节索引
  const [hoverGapIndex, setHoverGapIndex] = useState<number | null>(null);  // 鼠标悬停的章节间隙索引
  const [editingTitle, setEditingTitle] = useState<number | null>(null);  // 正在编辑标题的章节索引
  const [editingTitleText, setEditingTitleText] = useState('');  // 编辑中的标题文本
  
  const parsedSections = useMemo((): ParsedSection[] => {
    if (!sections || sections.length === 0) return [];

    return sections.map((rawTitle, index) => {
      const titlePos = generatedContent.indexOf(rawTitle);
      const isGenerated = titlePos !== -1;
      const hashMatch = rawTitle.match(/^(#{2,})\s+(.+)$/);
      const level = hashMatch ? hashMatch[1].length : 2;
      const displayTitle = hashMatch ? hashMatch[2] : rawTitle;

      return {
        title: displayTitle,
        rawTitle,
        index,
        isGenerated,
        level,
      };
    });
  }, [sections, generatedContent]);
  
  // 切换章节提示词展开/折叠
  const toggleSectionPrompt = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };
  
  // 开始编辑提示词
  const startEditingPrompt = (index: number, currentPrompt: string) => {
    setEditingPrompt(index);
    setEditingPromptText(currentPrompt);
  };
  
  // 保存提示词
  const saveSectionPrompt = (rawTitle: string) => {
    if (editingPrompt !== null) {
      onUpdateSectionPrompt(rawTitle, editingPromptText);
      setEditingPrompt(null);
      setEditingPromptText('');
    }
  };
  
  // 取消编辑
  const cancelEditingPrompt = () => {
    setEditingPrompt(null);
    setEditingPromptText('');
  };

  // 开始编辑标题
  const startEditingTitle = (index: number, currentTitle: string) => {
    setEditingTitle(index);
    setEditingTitleText(currentTitle);
  };

  // 保存标题
  const saveSectionTitle = (index: number) => {
    if (editingTitleText.trim()) {
      onUpdateSectionTitle(index, editingTitleText.trim());
      setEditingTitle(null);
      setEditingTitleText('');
    }
  };

  // 取消编辑标题
  const cancelEditingTitle = () => {
    setEditingTitle(null);
    setEditingTitleText('');
  };

  // 拖放处理函数
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    // 添加拖动时的视觉效果
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 重新排序
    const newSections = [...sections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(dropIndex, 0, removed);

    onReorderSections(newSections);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (sections.length === 0) {
    return (
      <div className="compact-section-manager-inner">
        <div className="compact-header">
          <h3>📑 大纲</h3>
        </div>
        <div className="compact-empty">
          <p>暂无大纲</p>
        </div>
      </div>
    );
  }

  // 统计有多少章节已有提示词
  const sectionsWithPrompts = parsedSections.filter(s => sectionPrompts[s.rawTitle]).length;
  const allHavePrompts = sectionsWithPrompts === parsedSections.length;

  return (
    <div className="compact-section-manager-inner">
      <div className="compact-header">
        <h3>📑 大纲 </h3>
        <div className="compact-header-right">
          <span className="compact-count">
            {parsedSections.filter(s => s.isGenerated).length}/{sections.length}
          </span>
          {sections.length > 0 && (
            <div className="batch-generation-controls">
              {hasUnfinishedBatchGeneration && !isBatchGenerating ? (
                // 显示继续生成按钮
                <button
                  className="btn-continue-batch"
                  onClick={onContinueBatchGeneration}
                  disabled={isGeneratingContent}
                  title="继续未完成的批量生成"
                >
                  ▶️ 继续生成 ({sectionsWithPrompts}/{parsedSections.length})
                </button>
              ) : (
                // 显示一键生成按钮
                <button
                  className={`btn-batch-prompts ${allHavePrompts ? 'all-generated' : ''}`}
                  onClick={onBatchGeneratePrompts}
                  disabled={isGeneratingContent || isBatchGenerating}
                  title={allHavePrompts ? '重新批量生成提示词' : '一键生成全部提示词'}
                >
                  {allHavePrompts ? '🔄 重新生成' : '✨ 一键生成'} ({sectionsWithPrompts}/{parsedSections.length})
                </button>
              )}
              
              {isBatchGenerating && (
                <>
                  {/* 进度指示器 */}
                  <div className="batch-progress-indicator">
                    <span className="progress-dot"></span>
                    <span className="progress-text">
                      {batchProgress.current}/{batchProgress.total}
                    </span>
                  </div>
                  
                  {/* 控制按钮 */}
                  <button
                    className="btn-batch-control pause"
                    onClick={onPauseBatchGeneration}
                    title={batchGenerationPaused ? '继续' : '暂停'}
                  >
                    {batchGenerationPaused ? '▶' : '⏸'}
                  </button>
                  <button
                    className="btn-batch-control cancel"
                    onClick={onCancelBatchGeneration}
                    title="取消"
                  >
                    ✖
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="compact-list">
        {parsedSections.map((section, idx) => {
          const indentLevel = Math.max(0, section.level - 2);
          const hasPrompt = !!sectionPrompts[section.rawTitle];
          const isExpanded = expandedSections.has(section.index);
          const isEditingPrompt = editingPrompt === section.index;
          const isEditingTitle = editingTitle === section.index;
          const currentPrompt = sectionPrompts[section.rawTitle] || '';
          const isHovering = hoverIndex === section.index;
          
          return (
            <React.Fragment key={section.index}>
              {/* 章节间隙添加按钮 */}
              <div
                className={`section-gap ${hoverGapIndex === section.index ? 'hover' : ''}`}
                onMouseEnter={() => setHoverGapIndex(section.index)}
                onMouseLeave={() => setHoverGapIndex(null)}
              >
                {hoverGapIndex === section.index && (
                  <button
                    className="btn-add-section-gap"
                    onClick={() => {
                      const level = section.level;
                      onAddSection(section.index, level);
                    }}
                    title="在此处添加章节"
                  >
                    +
                  </button>
                )}
              </div>
              
              {/* 章节主体 */}
              <div
                className={`compact-item ${
                  section.isGenerated ? 'generated' : 'not-generated'
                } ${currentSectionIndex === section.index && isGeneratingContent ? 'generating' : ''} ${
                  dragOverIndex === section.index ? 'drag-over' : ''
                } level-${section.level}`}
                onMouseEnter={() => setHoverIndex(section.index)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <div
                  className="compact-item-header"
                  style={{ paddingLeft: `${8 + indentLevel * 12}px` }}
                  title={section.title}
                  draggable={!isGeneratingContent && !isEditingTitle}
                  onDragStart={(e) => handleDragStart(e, section.index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, section.index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, section.index)}
                >
                  {/* 删除按钮（悬停时显示） */}
                  {isHovering && !isEditingTitle && (
                    <button
                      className="btn-delete-section"
                      onClick={() => onDeleteSection(section.index)}
                      title="删除此章节"
                    >
                      −
                    </button>
                  )}
                  
                  <span className="drag-handle" title="拖动调整顺序">⋮⋮</span>
                  
                  {/* 标题区域 */}
                  {isEditingTitle ? (
                    <div className="title-edit-area">
                      <input
                        type="text"
                        className="title-input"
                        value={editingTitleText}
                        onChange={(e) => setEditingTitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveSectionTitle(section.index);
                          } else if (e.key === 'Escape') {
                            cancelEditingTitle();
                          }
                        }}
                        autoFocus
                        onBlur={() => saveSectionTitle(section.index)}
                      />
                    </div>
                  ) : (
                    <div 
                      className="compact-item-content"
                      onClick={() => section.isGenerated && onJumpToSection(section.index)}
                      onDoubleClick={() => startEditingTitle(section.index, section.title)}
                    >
                      <span className="compact-title">{section.title}</span>
                    </div>
                  )}
                <div className="compact-actions">
                  <button
                    className={`compact-prompt-toggle ${hasPrompt ? 'has-prompt' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionPrompt(section.index);
                    }}
                    title={hasPrompt ? (isExpanded ? '折叠提示词' : '展开提示词') : '无提示词'}
                  >
                    {hasPrompt ? (isExpanded ? '🔽' : '▶️') : '💬'}
                  </button>
                  <button
                    className="compact-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSection(section.index);
                    }}
                    disabled={isGeneratingContent}
                    title="调整大纲标题顺序"
                  >
                    ✏️
                  </button>
                  {section.isGenerated && (
                    <button
                      className="compact-regenerate"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRegenerateSection(section.index);
                      }}
                      disabled={isGeneratingContent}
                      title="重新生成"
                    >
                      🔄
                    </button>
                  )}
                </div>
              </div>
              
              {/* 提示词展开区域 */}
              {isExpanded && (
                <div 
                  className="compact-prompt-section"
                  style={{ paddingLeft: `${8 + indentLevel * 12 + 24}px` }}
                >
                  {isEditingPrompt ? (
                    // 编辑模式
                    <div className="prompt-edit-area">
                      <textarea
                        className="prompt-textarea"
                        value={editingPromptText}
                        onChange={(e) => setEditingPromptText(e.target.value)}
                        placeholder="输入大纲生成提示词..."
                        rows={4}
                      />
                      <div className="prompt-edit-actions">
                        <button
                          className="btn-save"
                          onClick={() => saveSectionPrompt(section.rawTitle)}
                        >
                          ✔ 保存
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={cancelEditingPrompt}
                        >
                          ✖ 取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 显示模式
                    <div className="prompt-display-area">
                      {hasPrompt ? (
                        <>
                          <div className="prompt-text">{currentPrompt}</div>
                          <div className="prompt-actions">
                            <button
                              className="btn-edit-prompt"
                              onClick={() => startEditingPrompt(section.index, currentPrompt)}
                              title="编辑提示词"
                            >
                              ✏️ 编辑
                            </button>
                            <button
                              className="btn-match-prompt"
                              onClick={() => onMatchPromptForSection(section.rawTitle)}
                              title="从数据库匹配提示词"
                              disabled={isGeneratingContent}
                            >
                              🔍 匹配
                            </button>
                            <button
                              className="btn-generate-prompt"
                              onClick={() => onGeneratePromptForSection(section.rawTitle)}
                              title="AI生成提示词"
                              disabled={isGeneratingContent}
                            >
                              ✨ 生成
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="prompt-empty">
                          <p>暂无提示词</p>
                          <div className="prompt-actions">
                            <button
                              className="btn-add-prompt"
                              onClick={() => startEditingPrompt(section.index, '')}
                              title="手动添加提示词"
                            >
                              ✏️ 添加
                            </button>
                            <button
                              className="btn-match-prompt"
                              onClick={() => onMatchPromptForSection(section.rawTitle)}
                              title="从数据库匹配提示词"
                              disabled={isGeneratingContent}
                            >
                              🔍 匹配
                            </button>
                            <button
                              className="btn-generate-prompt"
                              onClick={() => onGeneratePromptForSection(section.rawTitle)}
                              title="AI生成提示词"
                              disabled={isGeneratingContent}
                            >
                              ✨ 生成
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
          );
        })}
        
        {/* 最后一个章节后的间隙添加按钮 */}
        {parsedSections.length > 0 && (
          <div
            className={`section-gap ${hoverGapIndex === -1 ? 'hover' : ''}`}
            onMouseEnter={() => setHoverGapIndex(-1)}
            onMouseLeave={() => setHoverGapIndex(null)}
          >
            {hoverGapIndex === -1 && (
              <button
                className="btn-add-section-gap"
                onClick={() => {
                  const lastSection = parsedSections[parsedSections.length - 1];
                  onAddSection(lastSection.index, lastSection.level);
                }}
                title="在末尾添加章节"
              >
                +
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactSectionManager;

