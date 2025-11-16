import React, { useState } from 'react';
import './ProjectSidebar.css';
import { Project } from '../types/project';

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  // 过滤项目
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个项目吗？项目下的所有文档也会被删除。')) {
      onDeleteProject(projectId);
    }
  };

  return (
    <div className="project-sidebar">
      <div className="project-sidebar-header">
        <h2 className="project-sidebar-title">我的项目</h2>
        <button 
          className="new-project-btn"
          onClick={onCreateProject}
          title="新建项目"
        >
          ＋ 新建
        </button>
      </div>

      <div className="project-search">
        <input
          type="text"
          placeholder="搜索项目..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="project-search-input"
        />
      </div>

      <div className="project-list">
        {filteredProjects.length === 0 ? (
          <div className="project-list-empty">
            {searchQuery ? '未找到匹配的项目' : '还没有项目'}
            {!searchQuery && <div className="empty-hint-small">点击上方按钮创建</div>}
          </div>
        ) : (
          filteredProjects.map(project => (
            <div
              key={project.id}
              className={`project-card ${selectedProjectId === project.id ? 'selected' : ''}`}
              onClick={() => onSelectProject(project.id)}
              onMouseEnter={() => setHoveredProjectId(project.id)}
              onMouseLeave={() => setHoveredProjectId(null)}
            >
              <div className="project-card-content">
                <div className="project-card-title">
                  {project.title || '未命名项目'}
                  {project.knowledgeBaseKey && (
                    <span className="kb-indicator" title="已配置知识库">🔑</span>
                  )}
                </div>
                <div className="project-card-meta">
                  <span className="project-card-doc-count">
                    {project.documentCount} 个文档
                  </span>
                  {project.tags.length > 0 && (
                    <span className="project-card-tags">
                      {project.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="project-tag-mini">
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 2 && (
                        <span className="project-tag-mini">+{project.tags.length - 2}</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              {hoveredProjectId === project.id && (
                <button
                  className="project-card-delete"
                  onClick={(e) => handleDeleteClick(e, project.id)}
                  title="删除项目"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectSidebar;

