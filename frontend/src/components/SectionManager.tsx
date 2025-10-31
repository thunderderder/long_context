import React, { useMemo } from 'react';
import './SectionManager.css';

interface SectionManagerProps {
  sections: string[];
  generatedContent: string;
  isGeneratingContent: boolean;
  currentSectionIndex: number;
  onRegenerateSection: (sectionIndex: number) => void;
  onJumpToSection: (sectionIndex: number) => void;
}

interface ParsedSection {
  title: string;
  index: number;
  isGenerated: boolean;
  level: number; // 标题层级 (2, 3, 4...)
}

const SectionManager: React.FC<SectionManagerProps> = ({
  sections,
  generatedContent,
  isGeneratingContent,
  currentSectionIndex,
  onRegenerateSection,
  onJumpToSection,
}) => {
  // 解析已生成的章节，包括层级信息
  const parsedSections = useMemo((): ParsedSection[] => {
    if (!sections || sections.length === 0) return [];

    return sections.map((title, index) => {
      // 检查这个章节是否已经生成
      const titlePos = generatedContent.indexOf(title);
      const isGenerated = titlePos !== -1;

      // 提取标题层级和显示文本
      const hashMatch = title.match(/^(#{2,})\s+(.+)$/);
      const level = hashMatch ? hashMatch[1].length : 2;
      const displayTitle = hashMatch ? hashMatch[2] : title; // 移除 ### 标识

      return {
        title: displayTitle,
        index,
        isGenerated,
        level,
      };
    });
  }, [sections, generatedContent]);

  if (sections.length === 0) {
    return (
      <div className="section-manager">
        <div className="section-manager-empty">
          <p>还没有章节。请先生成或输入大纲。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-manager">
      <div className="section-manager-header">
        <h3>章节管理</h3>
        <span className="section-count">
          已生成 {parsedSections.filter(s => s.isGenerated).length} / {sections.length} 个章节
        </span>
      </div>

      <div className="section-list">
        {parsedSections.map((section) => {
          // 计算缩进级别 (2级标题不缩进，3级缩进1，4级缩进2...)
          const indentLevel = Math.max(0, section.level - 2);
          
          return (
            <div
              key={section.index}
              className={`section-item ${
                section.isGenerated ? 'generated' : 'not-generated'
              } ${currentSectionIndex === section.index && isGeneratingContent ? 'generating' : ''} level-${section.level}`}
              style={{ paddingLeft: `${16 + indentLevel * 24}px` }}
            >
              <div className="section-item-header">
                <div 
                  className="section-title-container"
                  onClick={() => section.isGenerated && onJumpToSection(section.index)}
                  style={{ cursor: section.isGenerated ? 'pointer' : 'default' }}
                >
                  <span className="section-number">#{section.index + 1}</span>
                  <span className="section-title" title="点击跳转到内容">{section.title}</span>
                </div>
                <div className="section-actions">
                  {section.isGenerated && (
                    <button
                      className="regenerate-btn"
                      onClick={() => onRegenerateSection(section.index)}
                      disabled={isGeneratingContent}
                      title="重新生成此章节"
                    >
                      {currentSectionIndex === section.index && isGeneratingContent
                        ? '生成中...'
                        : '🔄 重新生成'}
                    </button>
                  )}
                  {!section.isGenerated && (
                    <span className="status-badge not-generated-badge">未生成</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionManager;

