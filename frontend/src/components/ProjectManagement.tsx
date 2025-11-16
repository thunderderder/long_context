import React, { useState, useEffect, useCallback } from 'react';
import './ProjectManagement.css';
import { Project, Document } from '../types/project';
import ProjectSidebar from './ProjectSidebar';
import ProjectDetail from './ProjectDetail';
import WritingWorkspace from './WritingWorkspace';
import { generateId, getUserId } from '../utils/userUtils';
import { useToast } from './ToastContainer';

const PROJECTS_STORAGE_KEY = 'ai-writing-projects';
const DOCUMENTS_STORAGE_KEY = 'ai-writing-documents';

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const [userId] = useState<string>(getUserId());
  const { showToast, ToastContainer } = useToast();

  // 从 localStorage 加载数据
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(`${PROJECTS_STORAGE_KEY}-${userId}`);
      const savedDocuments = localStorage.getItem(`${DOCUMENTS_STORAGE_KEY}-${userId}`);

      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }

      if (savedDocuments) {
        setDocuments(JSON.parse(savedDocuments));
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }, [userId]);

  // 保存项目到 localStorage
  const saveProjects = useCallback((updatedProjects: Project[]) => {
    try {
      localStorage.setItem(`${PROJECTS_STORAGE_KEY}-${userId}`, JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
    } catch (error) {
      console.error('保存项目失败:', error);
    }
  }, [userId]);

  // 保存文档到 localStorage
  const saveDocuments = useCallback((updatedDocuments: Document[]) => {
    try {
      localStorage.setItem(`${DOCUMENTS_STORAGE_KEY}-${userId}`, JSON.stringify(updatedDocuments));
      setDocuments(updatedDocuments);
    } catch (error) {
      console.error('保存文档失败:', error);
    }
  }, [userId]);

  // 创建新项目
  const handleCreateProject = useCallback(() => {
    const newProject: Project = {
      id: generateId(),
      title: '',  // 空标题，等待用户输入
      description: '',
      tags: [],
      knowledgeBaseKey: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentCount: 0,
    };

    const updatedProjects = [...projects, newProject];
    saveProjects(updatedProjects);
    setSelectedProjectId(newProject.id);
    showToast('info', '请输入项目名称', 2000);
  }, [projects, saveProjects, showToast]);

  // 选择项目
  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  // 更新项目
  const handleUpdateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    const updatedProjects = projects.map(project =>
      project.id === projectId
        ? { ...project, ...updates, updatedAt: new Date().toISOString() }
        : project
    );
    saveProjects(updatedProjects);
  }, [projects, saveProjects]);

  // 删除项目
  const handleDeleteProject = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    const projectTitle = project?.title || '未命名项目';
    
    // 删除项目
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjects(updatedProjects);

    // 删除项目下的所有文档
    const updatedDocuments = documents.filter(d => d.projectId !== projectId);
    saveDocuments(updatedDocuments);

    // 如果删除的是当前选中的项目，清空选中
    if (selectedProjectId === projectId) {
      setSelectedProjectId(updatedProjects.length > 0 ? updatedProjects[0].id : null);
    }
    
    showToast('success', `项目"${projectTitle}"已删除`);
  }, [projects, documents, selectedProjectId, saveProjects, saveDocuments, showToast]);

  // 创建新文档
  const handleCreateDocument = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newDocument: Document = {
      id: generateId(),
      projectId: projectId,
      title: '',  // 空标题，等待用户输入
      topic: '',
      outline: '',
      content: '',
      sections: [],
      sectionPrompts: {},
      outlinePrompt: '',
      sectionPrompt: '',
      knowledgeBaseKey: project.knowledgeBaseKey || '',  // 继承项目的知识库配置
      wordCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedDocuments = [...documents, newDocument];
    saveDocuments(updatedDocuments);

    // 更新项目的文档数量
    handleUpdateProject(projectId, {
      documentCount: project.documentCount + 1,
    });

    showToast('success', '文档已创建，请输入文档名称');
    showToast('info', '文档编辑器功能开发中，敬请期待...', 2000);
  }, [documents, projects, saveDocuments, handleUpdateProject, showToast]);

  // 更新文档
  const handleUpdateDocument = useCallback((documentId: string, updates: Partial<Document>) => {
    const updatedDocuments = documents.map(doc =>
      doc.id === documentId
        ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
        : doc
    );
    saveDocuments(updatedDocuments);
  }, [documents, saveDocuments]);

  // 打开文档
  const handleOpenDocument = useCallback((documentId: string) => {
    const document = documents.find(d => d.id === documentId);
    if (!document) return;

    setOpenDocumentId(documentId);
  }, [documents]);

  // 删除文档
  const handleDeleteDocument = useCallback((documentId: string) => {
    const document = documents.find(d => d.id === documentId);
    if (!document) return;

    const documentTitle = document.title || '未命名文档';
    
    const updatedDocuments = documents.filter(d => d.id !== documentId);
    saveDocuments(updatedDocuments);

    // 更新项目的文档数量
    const project = projects.find(p => p.id === document.projectId);
    if (project) {
      handleUpdateProject(project.id, {
        documentCount: Math.max(0, project.documentCount - 1),
      });
    }
    
    showToast('success', `文档"${documentTitle}"已删除`);
  }, [documents, projects, saveDocuments, handleUpdateProject, showToast]);

  // 关闭文档编辑器
  const handleCloseDocument = useCallback(() => {
    setOpenDocumentId(null);
  }, []);

  // 获取当前打开的文档
  const openDocument = openDocumentId
    ? documents.find(d => d.id === openDocumentId) || null
    : null;

  // 获取当前选中的项目
  const selectedProject = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId) || null
    : null;

  // 获取当前项目的文档列表
  const projectDocuments = selectedProjectId
    ? documents.filter(d => d.projectId === selectedProjectId)
    : [];

  // 保存文档的适配函数
  const handleSaveDocument = useCallback((updates: Partial<Document>) => {
    if (openDocumentId) {
      handleUpdateDocument(openDocumentId, updates);
    }
  }, [openDocumentId, handleUpdateDocument]);

  // 如果有打开的文档，显示编辑器
  if (openDocument) {
    const project = projects.find(p => p.id === openDocument.projectId);
    return (
      <>
        <WritingWorkspace
          document={openDocument}
          project={project}
          onSave={handleSaveDocument}
          onClose={handleCloseDocument}
        />
        <ToastContainer />
      </>
    );
  }

  // 否则显示项目管理界面
  return (
    <>
      <div className="project-management">
        <ProjectSidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
        />
        <ProjectDetail
          project={selectedProject}
          documents={projectDocuments}
          onUpdateProject={handleUpdateProject}
          onCreateDocument={handleCreateDocument}
          onOpenDocument={handleOpenDocument}
          onDeleteDocument={handleDeleteDocument}
          onUpdateDocument={handleUpdateDocument}
        />
      </div>
      <ToastContainer />
    </>
  );
};

export default ProjectManagement;

