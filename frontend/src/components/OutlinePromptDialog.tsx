import React, { useState } from 'react';
import './OutlinePromptDialog.css';

interface OutlinePromptDialogProps {
  defaultPrompt: string;
  onConfirm: (prompt: string) => void;
  onCancel: () => void;
}

const OutlinePromptDialog: React.FC<OutlinePromptDialogProps> = ({
  defaultPrompt,
  onConfirm,
  onCancel,
}) => {
  const [prompt, setPrompt] = useState(defaultPrompt);

  const handleConfirm = () => {
    onConfirm(prompt);
  };

  const handleReset = () => {
    setPrompt(defaultPrompt);
  };

  return (
    <div className="outline-prompt-dialog-overlay" onClick={onCancel}>
      <div className="outline-prompt-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>编辑大纲生成提示词</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="dialog-body">
          <textarea
            className="prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入生成大纲的提示词..."
            autoFocus
          />
          <div className="prompt-hint">
            💡 提示词中可以使用占位符：<code>{`{project}`}</code>（项目名称）、<code>{`{doc-name}`}</code>（文档名称）
          </div>
        </div>
        
        <div className="dialog-footer">
          <button className="btn-secondary" onClick={handleReset}>
            重置为默认
          </button>
          <div className="btn-group">
            <button className="btn-cancel" onClick={onCancel}>
              取消
            </button>
            <button className="btn-confirm" onClick={handleConfirm}>
              确定并生成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutlinePromptDialog;

