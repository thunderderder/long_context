/**
 * 演示数据生成器 - 用于快速测试界面
 */

import { Project, Document } from '../types/project';
import { generateId } from './userUtils';

export function generateDemoProjects(): Project[] {
  const now = Date.now();
  
  return [
    {
      id: generateId(),
      title: '交通运输发展规划',
      description: '2024-2030年市级交通运输发展规划项目',
      tags: ['规划', '交通', '重要'],
      knowledgeBaseKey: 'transport-kb-001',
      createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      documentCount: 3,
    },
    {
      id: generateId(),
      title: '基础设施投资分析',
      description: '市政基础设施投资可行性分析报告',
      tags: ['分析报告', '基建'],
      knowledgeBaseKey: 'infra-kb-002',
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      documentCount: 2,
    },
    {
      id: generateId(),
      title: '智慧城市建设方案',
      description: '智慧城市信息化建设整体方案',
      tags: ['智慧城市', '信息化', '创新'],
      knowledgeBaseKey: '',
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      documentCount: 1,
    },
    {
      id: generateId(),
      title: '年度工作总结',
      description: '2024年度部门工作总结与规划',
      tags: ['总结', '年度'],
      knowledgeBaseKey: '',
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 30 * 60 * 1000).toISOString(),
      documentCount: 0,
    },
  ];
}

export function generateDemoDocuments(projects: Project[]): Document[] {
  const now = Date.now();
  const documents: Document[] = [];
  
  // 为第一个项目生成3个文档
  if (projects[0]) {
    documents.push({
      id: generateId(),
      projectId: projects[0].id,
      title: '总体规划框架',
      topic: '交通运输发展总体规划',
      outline: '## 一、发展现状\n## 二、面临挑战\n## 三、发展目标\n## 四、重点任务',
      content: '# 总体规划框架\n\n## 一、发展现状...',
      sections: ['## 一、发展现状', '## 二、面临挑战', '## 三、发展目标', '## 四、重点任务'],
      sectionPrompts: {},
      outlinePrompt: '',
      sectionPrompt: '',
      knowledgeBaseKey: projects[0].knowledgeBaseKey,
      wordCount: 5234,
      createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    });
    
    documents.push({
      id: generateId(),
      projectId: projects[0].id,
      title: '实施方案',
      topic: '交通运输规划实施方案',
      outline: '## 一、实施原则\n## 二、实施步骤\n## 三、保障措施',
      content: '# 实施方案\n\n## 一、实施原则...',
      sections: ['## 一、实施原则', '## 二、实施步骤', '## 三、保障措施'],
      sectionPrompts: {},
      outlinePrompt: '',
      sectionPrompt: '',
      knowledgeBaseKey: projects[0].knowledgeBaseKey,
      wordCount: 3456,
      createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    });
    
    documents.push({
      id: generateId(),
      projectId: projects[0].id,
      title: '预算说明',
      topic: '交通运输规划预算说明',
      outline: '## 一、预算总览\n## 二、分项预算\n## 三、资金来源',
      content: '# 预算说明\n\n## 一、预算总览...',
      sections: ['## 一、预算总览', '## 二、分项预算', '## 三、资金来源'],
      sectionPrompts: {},
      outlinePrompt: '',
      sectionPrompt: '',
      knowledgeBaseKey: projects[0].knowledgeBaseKey,
      wordCount: 2890,
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  // 为第二个项目生成2个文档
  if (projects[1]) {
    documents.push({
      id: generateId(),
      projectId: projects[1].id,
      title: '投资可行性研究',
      topic: '基础设施投资可行性研究',
      outline: '## 一、项目背景\n## 二、市场分析\n## 三、财务评估\n## 四、风险分析',
      content: '# 投资可行性研究...',
      sections: ['## 一、项目背景', '## 二、市场分析', '## 三、财务评估', '## 四、风险分析'],
      sectionPrompts: {},
      outlinePrompt: '',
      sectionPrompt: '',
      knowledgeBaseKey: projects[1].knowledgeBaseKey,
      wordCount: 6789,
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
    
    documents.push({
      id: generateId(),
      projectId: projects[1].id,
      title: '经济效益分析',
      topic: '基础设施项目经济效益分析',
      outline: '## 一、投资效益\n## 二、社会效益\n## 三、环境影响',
      content: '# 经济效益分析...',
      sections: ['## 一、投资效益', '## 二、社会效益', '## 三、环境影响'],
      sectionPrompts: {},
      outlinePrompt: '',
      sectionPrompt: '',
      knowledgeBaseKey: projects[1].knowledgeBaseKey,
      wordCount: 4567,
      createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  // 为第三个项目生成1个文档
  if (projects[2]) {
    documents.push({
      id: generateId(),
      projectId: projects[2].id,
      title: '智慧城市建设总体方案',
      topic: '智慧城市信息化建设',
      outline: '## 一、建设目标\n## 二、技术架构\n## 三、应用场景\n## 四、实施计划',
      content: '# 智慧城市建设总体方案...',
      sections: ['## 一、建设目标', '## 二、技术架构', '## 三、应用场景', '## 四、实施计划'],
      sectionPrompts: {},
      outlinePrompt: '',
      sectionPrompt: '',
      knowledgeBaseKey: '',
      wordCount: 8901,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return documents;
}

/**
 * 加载演示数据到 localStorage
 */
export function loadDemoData(userId: string): void {
  const projects = generateDemoProjects();
  const documents = generateDemoDocuments(projects);
  
  localStorage.setItem(`ai-writing-projects-${userId}`, JSON.stringify(projects));
  localStorage.setItem(`ai-writing-documents-${userId}`, JSON.stringify(documents));
  
  console.log('演示数据已加载:');
  console.log('- 项目数:', projects.length);
  console.log('- 文档数:', documents.length);
}

/**
 * 清空所有数据
 */
export function clearAllData(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('ai-writing')) {
      localStorage.removeItem(key);
    }
  });
  console.log('所有数据已清空');
}

// 在浏览器控制台中可以使用的辅助函数
if (typeof window !== 'undefined') {
  (window as any).loadDemoData = () => {
    const userId = localStorage.getItem('ai-writing-user-id');
    if (userId) {
      loadDemoData(userId);
      alert('演示数据已加载，请刷新页面查看');
    } else {
      alert('请先访问应用以生成用户ID');
    }
  };
  
  (window as any).clearAllData = () => {
    if (confirm('确定要清空所有数据吗？此操作无法撤销。')) {
      clearAllData();
      alert('所有数据已清空，请刷新页面');
    }
  };
}

