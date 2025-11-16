import React, { useState, useEffect, useRef } from 'react';
import './DocumentList.css';
import { Document } from '../types/project';

interface DocumentListProps {
  documents: Document[];
  onOpenDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onUpdateDocument?: (documentId: string, updates: Partial<Document>) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onOpenDocument,
  onDeleteDocument,
  onUpdateDocument,
}) => {
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 当有新文档且标题为空时，自动进入编辑状态
  useEffect(() => {
    const emptyDoc = documents.find(d => !d.title);
    if (emptyDoc && editingDocId !== emptyDoc.id) {
      setEditingDocId(emptyDoc.id);
      setEditedTitle('');
    }
  }, [documents, editingDocId]);

  // 自动聚焦输入框
  useEffect(() => {
    if (editingDocId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingDocId]);

  const handleDelete = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个文档吗？此操作无法撤销。')) {
      onDeleteDocument(docId);
    }
  };

  const handleTitleEdit = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    setEditingDocId(doc.id);
    setEditedTitle(doc.title || '');
  };

  const handleTitleSave = (docId: string) => {
    const trimmedTitle = editedTitle.trim();
    
    if (!trimmedTitle) {
      // 如果标题为空，使用默认标题
      const defaultTitle = '未命名文档';
      if (onUpdateDocument) {
        onUpdateDocument(docId, { title: defaultTitle });
      }
    } else {
      // 保存标题
      if (onUpdateDocument) {
        onUpdateDocument(docId, { title: trimmedTitle });
      }
    }
    
    setEditingDocId(null);
    setEditedTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent, docId: string) => {
    if (e.key === 'Enter') {
      handleTitleSave(docId);
    } else if (e.key === 'Escape') {
      setEditingDocId(null);
      setEditedTitle('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    // 小于1小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} 分钟前`;
    }
    // 小于1天
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} 小时前`;
    }
    // 小于7天
    if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)} 天前`;
    }
    
    // 否则显示具体日期
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (documents.length === 0) {
    return (
      <div className="document-list-empty">
        <div className="empty-text">还没有文档</div>
        <div className="empty-hint">点击上方"新建文档"按钮开始创作</div>
      </div>
    );
  }

  return (
    <div className="document-list">
      <table className="document-table">
        <thead>
          <tr>
            <th className="col-title">文档标题</th>
            <th className="col-knowledge-key">知识库 Key</th>
            <th className="col-word-count">字数</th>
            <th className="col-updated">最后更新时间</th>
            <th className="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr
              key={doc.id}
              className="document-row"
              onClick={() => onOpenDocument(doc.id)}
              onMouseEnter={() => setHoveredDocId(doc.id)}
              onMouseLeave={() => setHoveredDocId(null)}
            >
              <td className="col-title">
                {editingDocId === doc.id ? (
                  <div className="document-title-edit">
                    <input
                      ref={inputRef}
                      type="text"
                      className="doc-title-input"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onBlur={() => handleTitleSave(doc.id)}
                      onKeyDown={(e) => handleTitleKeyDown(e, doc.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ) : (
                  <div className="document-title" onClick={(e) => handleTitleEdit(e, doc)}>
                    <span className="doc-title-text">{doc.title || '未命名文档'}</span>
                  </div>
                )}
              </td>
              <td className="col-knowledge-key">
                {doc.knowledgeBaseKey ? (
                  <span className="knowledge-key-badge">{doc.knowledgeBaseKey}</span>
                ) : (
                  <span className="no-key">-</span>
                )}
              </td>
              <td className="col-word-count">
                {doc.wordCount > 0 ? (
                  <span className="word-count">{doc.wordCount.toLocaleString()}</span>
                ) : (
                  <span className="no-content">0</span>
                )}
              </td>
              <td className="col-updated">
                <span className="update-time" title={new Date(doc.updatedAt).toLocaleString('zh-CN')}>
                  {formatDate(doc.updatedAt)}
                </span>
              </td>
              <td className="col-actions">
                {hoveredDocId === doc.id && (
                  <div className="action-buttons">
                    <button
                      className="action-btn edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDocument(doc.id);
                      }}
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => handleDelete(e, doc.id)}
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentList;

