import React from 'react';
import { GenerationMode } from '../types/writing';
import './LeftPanel.css';


interface LeftPanelProps {
  topic: string;
  setTopic: (topic: string) => void;
  generationMode: GenerationMode;
  setGenerationMode: (mode: GenerationMode) => void;
  isGeneratingOutline: boolean;
  isGeneratingContent: boolean;
  waitingForConfirmation: boolean;
  currentSection: string;
  totalSections: number;
  currentSectionIndex: number;
  onGenerateOutline: () => void;
  onStartGeneration: () => void;
  onContinueGeneration: () => void;
  outlinePrompt: string;
  setOutlinePrompt: (prompt: string) => void;
  sectionPrompt: string;
  setSectionPrompt: (prompt: string) => void;
  showOutlinePrompt: boolean;
  setShowOutlinePrompt: (show: boolean) => void;
  showSectionPrompt: boolean;
  setShowSectionPrompt: (show: boolean) => void;
  defaultOutlinePrompt: string;
  defaultSectionPrompt: string;
  lastSaved: Date | null;
  onClearState: () => void;
  hasUnfinishedTask: boolean;
  onContinueFromSaved: () => void;
  onOpenPromptManager: () => void;  // 新增
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  topic,
  setTopic,
  generationMode,
  setGenerationMode,
  isGeneratingOutline,
  isGeneratingContent,
  waitingForConfirmation,
  currentSection,
  totalSections,
  currentSectionIndex,
  onGenerateOutline,
  onStartGeneration,
  onContinueGeneration,
  outlinePrompt,
  setOutlinePrompt,
  sectionPrompt,
  setSectionPrompt,
  showOutlinePrompt,
  setShowOutlinePrompt,
  showSectionPrompt,
  setShowSectionPrompt,
  defaultOutlinePrompt,
  defaultSectionPrompt,
  lastSaved,
  onClearState,
  hasUnfinishedTask,
  onContinueFromSaved,
  onOpenPromptManager,
}) => {
  // 格式化保存时间
  const formatSaveTime = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 10) return '刚刚保存';
    if (diff < 60) return `${diff}秒前保存`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前保存`;
    
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };
  return (
    <div className="left-panel">
      <div className="panel-header">
        <h2>📝 AI 写作助手</h2>
        <div className="header-actions">
          <button
            className="btn-prompt-manager"
            onClick={onOpenPromptManager}
            title="提示词管理"
          >
            📚 提示词库
          </button>
          {lastSaved && (
            <div className="autosave-status" title="自动保存已启用">
              💾 {formatSaveTime(lastSaved)}
            </div>
          )}
          {(topic || lastSaved) && (
            <button
              className="btn-clear"
              onClick={() => {
                if (window.confirm('确定要清除所有内容并重新开始吗？此操作不可恢复。')) {
                  onClearState();
                }
              }}
              title="清除所有内容"
            >
              🗑️ 清空
            </button>
          )}
        </div>
      </div>

      <div className="panel-content">
        {/* 主题输入 */}
        <div className="input-section">
          <label htmlFor="topic">输入主题</label>
          <textarea
            id="topic"
            className="topic-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：人工智能在教育领域的应用"
            rows={4}
            disabled={isGeneratingOutline || isGeneratingContent}
          />
        </div>

        {/* 大纲提示词编辑 */}
        <div className="prompt-section">
          <div className="prompt-header">
            <button
              className="btn-toggle-prompt"
              onClick={() => setShowOutlinePrompt(!showOutlinePrompt)}
            >
              {showOutlinePrompt ? '▼' : '▶'} 大纲生成提示词
            </button>
            {showOutlinePrompt && outlinePrompt !== defaultOutlinePrompt && (
              <button
                className="btn-reset"
                onClick={() => setOutlinePrompt(defaultOutlinePrompt)}
                title="重置为默认提示词"
              >
                🔄
              </button>
            )}
          </div>
          {showOutlinePrompt && (
            <div className="prompt-edit">
              <textarea
                className="prompt-textarea"
                value={outlinePrompt}
                onChange={(e) => setOutlinePrompt(e.target.value)}
                placeholder="输入自定义提示词，使用 {topic} 作为主题占位符"
                rows={8}
                disabled={isGeneratingOutline || isGeneratingContent}
              />
              <div className="prompt-hint">
                💡 提示：使用 {'{topic}'} 作为主题占位符
              </div>
            </div>
          )}
        </div>

        {/* 生成大纲按钮 */}
        <button
          className="btn btn-primary"
          onClick={onGenerateOutline}
          disabled={isGeneratingOutline || isGeneratingContent || !topic.trim()}
        >
          {isGeneratingOutline ? '生成大纲中...' : '🎯 生成大纲'}
        </button>

        {/* 分隔线 */}
        <div className="divider"></div>

        {/* 生成模式选择 */}
        <div className="mode-section">
          <label>生成模式</label>
          <div className="mode-options">
            <label className="radio-label">
              <input
                type="radio"
                name="mode"
                value="sequential"
                checked={generationMode === 'sequential'}
                onChange={() => setGenerationMode('sequential')}
                disabled={isGeneratingContent}
              />
              <span>依次生成（需确认）</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="mode"
                value="continuous"
                checked={generationMode === 'continuous'}
                onChange={() => setGenerationMode('continuous')}
                disabled={isGeneratingContent}
              />
              <span>一次性生成</span>
            </label>
          </div>
        </div>

        {/* 段落提示词编辑 */}
        <div className="prompt-section">
          <div className="prompt-header">
            <button
              className="btn-toggle-prompt"
              onClick={() => setShowSectionPrompt(!showSectionPrompt)}
            >
              {showSectionPrompt ? '▼' : '▶'} 段落生成提示词
            </button>
            {showSectionPrompt && sectionPrompt !== defaultSectionPrompt && (
              <button
                className="btn-reset"
                onClick={() => setSectionPrompt(defaultSectionPrompt)}
                title="重置为默认提示词"
              >
                🔄
              </button>
            )}
          </div>
          {showSectionPrompt && (
            <div className="prompt-edit">
              <textarea
                className="prompt-textarea"
                value={sectionPrompt}
                onChange={(e) => setSectionPrompt(e.target.value)}
                placeholder="输入自定义提示词"
                rows={10}
                disabled={isGeneratingOutline || isGeneratingContent}
              />
              <div className="prompt-hint">
                💡 提示：可使用占位符 {'{topic}'}, {'{outline}'}, {'{current_section}'}, {'{context}'}
              </div>
            </div>
          )}
        </div>

        {/* 恢复状态提示 */}
        {hasUnfinishedTask && !isGeneratingContent && (
          <div className="restore-notice">
            <div className="restore-icon">💾</div>
            <div className="restore-text">
              <strong>已恢复至上次状态</strong>
              <p>检测到未完成的生成任务（{currentSectionIndex}/{totalSections}）</p>
            </div>
          </div>
        )}

        {/* 生成按钮组 */}
        {hasUnfinishedTask && !isGeneratingContent ? (
          <div className="generation-buttons">
            <button
              className="btn btn-continue"
              onClick={onContinueFromSaved}
              disabled={isGeneratingOutline || waitingForConfirmation}
            >
              ▶️ 继续生成
            </button>
            <button
              className="btn btn-restart"
              onClick={onStartGeneration}
              disabled={isGeneratingOutline || waitingForConfirmation}
            >
              🔄 重新生成
            </button>
          </div>
        ) : (
          <button
            className="btn btn-success"
            onClick={onStartGeneration}
            disabled={isGeneratingContent || isGeneratingOutline || waitingForConfirmation}
          >
            {isGeneratingContent ? '生成中...' : '✨ 开始生成内容'}
          </button>
        )}

        {/* 进度显示 */}
        {(isGeneratingContent || waitingForConfirmation) && totalSections > 0 && (
          <div className="progress-section">
            <div className="progress-info">
              <p className="progress-text">
                进度：{currentSectionIndex + 1} / {totalSections}
              </p>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${((currentSectionIndex + 1) / totalSections) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {currentSection && (
              <div className="current-section">
                <p className="section-label">当前章节：</p>
                <p className="section-title">{currentSection}</p>
              </div>
            )}

            {/* 继续生成按钮（依次生成模式） */}
            {waitingForConfirmation && generationMode === 'sequential' && (
              <button
                className="btn btn-continue"
                onClick={onContinueGeneration}
              >
                ▶️ 生成下一段
              </button>
            )}
          </div>
        )}

        {/* 说明文本 */}
        <div className="help-section">
          <h4>📖 使用说明</h4>
          <ol>
            <li>在上方输入您想要写作的主题</li>
            <li>点击"生成大纲"按钮，AI 将自动创建文章大纲</li>
            <li>在右侧编辑器中查看和修改大纲</li>
            <li>选择生成模式：
              <ul>
                <li><strong>依次生成</strong>：每生成一段后需要您确认再继续</li>
                <li><strong>一次性生成</strong>：自动连续生成所有内容</li>
              </ul>
            </li>
            <li>点击"开始生成内容"，AI 将根据大纲创作文章</li>
          </ol>
          <div className="help-tip">
            💡 <strong>提示：</strong>
            <ul>
              <li>大纲可以通过AI生成，也可以手动在右侧编辑器中输入</li>
              <li>使用 ## 或 ### 标记章节标题</li>
              <li>系统每3秒自动保存，刷新页面可恢复</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;

