import React, { useState } from 'react';
import './RegenerateDialog.css';

interface RegenerateDialogProps {
  sectionTitle: string;
  onConfirm: (newPrompt: string) => void;
  onCancel: () => void;
}

const RegenerateDialog: React.FC<RegenerateDialogProps> = ({
  sectionTitle,
  onConfirm,
  onCancel,
}) => {
  const [newPrompt, setNewPrompt] = useState('');

  const handleConfirm = () => {
    if (!newPrompt.trim()) {
      alert('请输入重新生成的要求');
      return;
    }
    onConfirm(newPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter 提交
    if (e.ctrlKey && e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="regenerate-dialog-overlay" onClick={onCancel}>
      <div className="regenerate-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="regenerate-dialog-header">
          <h3>🔄 重新生成章节</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="regenerate-dialog-body">
          <div className="section-info">
            <label>章节标题：</label>
            <div className="section-title-display">{sectionTitle}</div>
          </div>

          <div className="prompt-input-section">
            <label>请输入您的新要求：</label>
            <textarea
              className="prompt-textarea"
              placeholder="例如：请更详细地阐述这个主题，增加更多案例说明..."
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              rows={8}
            />
            <div className="input-hint">
              💡 提示：请描述您希望如何调整或重新撰写这个章节（支持 Ctrl+Enter 快捷提交）
            </div>
          </div>
        </div>

        <div className="regenerate-dialog-footer">
          <button className="cancel-btn" onClick={onCancel}>
            取消
          </button>
          <button className="confirm-btn" onClick={handleConfirm}>
            确定重新生成
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegenerateDialog;

