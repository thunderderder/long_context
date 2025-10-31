import React, { useState } from 'react';
import './EditSectionDialog.css';

interface EditSectionDialogProps {
  sectionTitle: string;
  onConfirm: (newTitle: string) => void;
  onCancel: () => void;
}

const EditSectionDialog: React.FC<EditSectionDialogProps> = ({
  sectionTitle,
  onConfirm,
  onCancel,
}) => {
  // 提取标题文本（去掉 ### 标记）
  const hashMatch = sectionTitle.match(/^(#{2,})\s+(.+)$/);
  const level = hashMatch ? hashMatch[1] : '##';
  const titleText = hashMatch ? hashMatch[2] : sectionTitle;
  
  const [newTitle, setNewTitle] = useState(titleText);
  const [selectedLevel, setSelectedLevel] = useState(level);

  const handleConfirm = () => {
    if (!newTitle.trim()) {
      alert('章节标题不能为空');
      return;
    }
    const fullTitle = `${selectedLevel} ${newTitle.trim()}`;
    onConfirm(fullTitle);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="edit-section-dialog-overlay" onClick={onCancel}>
      <div className="edit-section-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="edit-section-dialog-header">
          <h3>✏️ 编辑章节</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="edit-section-dialog-body">
          <div className="level-selector">
            <label>章节层级：</label>
            <div className="level-buttons">
              <button
                className={selectedLevel === '##' ? 'active' : ''}
                onClick={() => setSelectedLevel('##')}
              >
                二级 (##)
              </button>
              <button
                className={selectedLevel === '###' ? 'active' : ''}
                onClick={() => setSelectedLevel('###')}
              >
                三级 (###)
              </button>
              <button
                className={selectedLevel === '####' ? 'active' : ''}
                onClick={() => setSelectedLevel('####')}
              >
                四级 (####)
              </button>
              <button
                className={selectedLevel === '#####' ? 'active' : ''}
                onClick={() => setSelectedLevel('#####')}
              >
                五级 (#####)
              </button>
            </div>
          </div>

          <div className="title-input-section">
            <label>章节标题：</label>
            <input
              type="text"
              className="title-input"
              placeholder="请输入章节标题..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className="preview-hint">
              预览：<strong>{selectedLevel} {newTitle || '章节标题'}</strong>
            </div>
          </div>
        </div>

        <div className="edit-section-dialog-footer">
          <button className="cancel-btn" onClick={onCancel}>
            取消
          </button>
          <button className="confirm-btn" onClick={handleConfirm}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSectionDialog;

