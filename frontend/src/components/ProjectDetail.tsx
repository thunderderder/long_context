import React, { useState, useEffect } from 'react';
import './ProjectDetail.css';
import { Project, Document } from '../types/project';
import DocumentList from './DocumentList';

interface ProjectDetailProps {
  project: Project | null;
  documents: Document[];
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onCreateDocument: (projectId: string) => void;
  onOpenDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onUpdateDocument?: (documentId: string, updates: Partial<Document>) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  documents,
  onUpdateProject,
  onCreateDocument,
  onOpenDocument,
  onDeleteDocument,
  onUpdateDocument,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showKnowledgeBaseConfig, setShowKnowledgeBaseConfig] = useState(false);

  // 当项目标题为空时，自动进入编辑状态
  useEffect(() => {
    if (project && !project.title && !isEditingTitle) {
      setEditedTitle('');
      setIsEditingTitle(true);
    }
  }, [project, isEditingTitle]);

  if (!project) {
    return (
      <div className="project-detail-empty">
        <div className="empty-text">请从左侧选择一个项目</div>
        <div className="empty-hint">或创建一个新项目开始使用</div>
      </div>
    );
  }

  const handleTitleEdit = () => {
    setEditedTitle(project.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    const trimmedTitle = editedTitle.trim();
    
    // 如果标题为空，使用默认标题
    if (!trimmedTitle) {
      const defaultTitle = `未命名项目`;
      onUpdateProject(project.id, { title: defaultTitle });
      setIsEditingTitle(false);
      return;
    }
    
    // 如果标题有变化，则更新
    if (trimmedTitle !== project.title) {
      onUpdateProject(project.id, { title: trimmedTitle });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !project.tags.includes(newTag.trim())) {
      onUpdateProject(project.id, {
        tags: [...project.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateProject(project.id, {
      tags: project.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsEditingTags(false);
      setNewTag('');
    }
  };

  const handleKnowledgeBaseKeyChange = (value: string) => {
    onUpdateProject(project.id, {
      knowledgeBaseKey: value,
    });
  };

  return (
    <div className="project-detail">
      <div className="project-detail-header">
        <div className="project-title-section">
          {isEditingTitle ? (
            <input
              type="text"
              className="project-title-input"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              autoFocus
            />
          ) : (
            <div className="title-row">
              <h1 className="project-title" onClick={handleTitleEdit}>
                {project.title}
                <span className="edit-icon">✏️</span>
              </h1>
              <button
                className="knowledge-base-toggle"
                onClick={() => setShowKnowledgeBaseConfig(!showKnowledgeBaseConfig)}
                title={showKnowledgeBaseConfig ? "隐藏知识库配置" : "配置知识库"}
              >
                🔑 知识库
              </button>
            </div>
          )}
          
          {showKnowledgeBaseConfig && !isEditingTitle && (
            <div className="inline-knowledge-base-config">
              <input
                type="text"
                className="inline-kb-input"
                placeholder="输入项目统一知识库 Key（可选）"
                value={project.knowledgeBaseKey || ''}
                onChange={(e) => handleKnowledgeBaseKeyChange(e.target.value)}
              />
              <div className="inline-kb-hint">
                💡 设置后，项目下的所有文档将默认使用此知识库（文档可单独配置）
              </div>
            </div>
          )}
        </div>

        <div className="project-tags-section">
          <div className="project-tags">
            {project.tags.map(tag => (
              <span key={tag} className="project-tag">
                {tag}
                <button
                  className="tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                  title="移除标签"
                >
                  ×
                </button>
              </span>
            ))}
            {isEditingTags ? (
              <input
                type="text"
                className="tag-input"
                placeholder="输入标签..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onBlur={() => {
                  handleAddTag();
                  setIsEditingTags(false);
                }}
                onKeyDown={handleTagKeyDown}
                autoFocus
              />
            ) : (
              <button
                className="add-tag-btn"
                onClick={() => setIsEditingTags(true)}
                title="添加标签"
              >
                ＋ 标签
              </button>
            )}
          </div>
        </div>

        <div className="project-meta">
          <span className="meta-item">
            创建时间: {new Date(project.createdAt).toLocaleString('zh-CN')}
          </span>
          <span className="meta-separator">|</span>
          <span className="meta-item">
            更新时间: {new Date(project.updatedAt).toLocaleString('zh-CN')}
          </span>
          <span className="meta-separator">|</span>
          <span className="meta-item">
            文档数: {project.documentCount}
          </span>
        </div>
      </div>

      <div className="project-detail-content">
        <div className="documents-section">
          <div className="section-header">
            <h3 className="section-title">相关文档</h3>
            <button
              className="new-document-btn"
              onClick={() => onCreateDocument(project.id)}
            >
              ＋ 新建文档
            </button>
          </div>
          <DocumentList
            documents={documents}
            onOpenDocument={onOpenDocument}
            onDeleteDocument={onDeleteDocument}
            onUpdateDocument={onUpdateDocument}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

