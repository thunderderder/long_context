import React, { useMemo, useState } from 'react';
import './CompactSectionManager.css';

interface CompactSectionManagerProps {
  sections: string[];
  generatedContent: string;
  isGeneratingContent: boolean;
  currentSectionIndex: number;
  onRegenerateSection: (sectionIndex: number) => void;
  onJumpToSection: (sectionIndex: number) => void;
  onEditSection: (sectionIndex: number) => void;
  onReorderSections: (newOrder: string[]) => void;
}

interface ParsedSection {
  title: string;
  index: number;
  isGenerated: boolean;
  level: number;
}

const CompactSectionManager: React.FC<CompactSectionManagerProps> = ({
  sections,
  generatedContent,
  isGeneratingContent,
  currentSectionIndex,
  onRegenerateSection,
  onJumpToSection,
  onEditSection,
  onReorderSections,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const parsedSections = useMemo((): ParsedSection[] => {
    if (!sections || sections.length === 0) return [];

    return sections.map((title, index) => {
      const titlePos = generatedContent.indexOf(title);
      const isGenerated = titlePos !== -1;
      const hashMatch = title.match(/^(#{2,})\s+(.+)$/);
      const level = hashMatch ? hashMatch[1].length : 2;
      const displayTitle = hashMatch ? hashMatch[2] : title;

      return {
        title: displayTitle,
        index,
        isGenerated,
        level,
      };
    });
  }, [sections, generatedContent]);

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
          <h3>📑 章节</h3>
        </div>
        <div className="compact-empty">
          <p>暂无章节</p>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-section-manager-inner">
      <div className="compact-header">
        <h3>📑 章节</h3>
        <span className="compact-count">
          {parsedSections.filter(s => s.isGenerated).length}/{sections.length}
        </span>
      </div>

      <div className="compact-list">
        {parsedSections.map((section) => {
          const indentLevel = Math.max(0, section.level - 2);
          
          return (
            <div
              key={section.index}
              className={`compact-item ${
                section.isGenerated ? 'generated' : 'not-generated'
              } ${currentSectionIndex === section.index && isGeneratingContent ? 'generating' : ''} ${
                dragOverIndex === section.index ? 'drag-over' : ''
              } level-${section.level}`}
              style={{ paddingLeft: `${8 + indentLevel * 12}px` }}
              title={section.title}
              draggable={!isGeneratingContent}
              onDragStart={(e) => handleDragStart(e, section.index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, section.index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, section.index)}
            >
              <span className="drag-handle" title="拖动调整顺序">⋮⋮</span>
              <div 
                className="compact-item-content"
                onClick={() => section.isGenerated && onJumpToSection(section.index)}
              >
                <span className="compact-number">{section.index + 1}</span>
                <span className="compact-title">{section.title}</span>
              </div>
              <div className="compact-actions">
                <button
                  className="compact-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSection(section.index);
                  }}
                  disabled={isGeneratingContent}
                  title="编辑章节"
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
          );
        })}
      </div>
    </div>
  );
};

export default CompactSectionManager;

