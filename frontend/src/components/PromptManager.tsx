import React, { useState, useEffect } from 'react';
import './PromptManager.css';
import { getUserId as getUserIdUtil } from '../utils/userUtils';
import * as XLSX from 'xlsx';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Prompt {
  id: number;
  title: string;
  content: string;
  category_id: number;
  category_name?: string;
  keywords: string;
  usage_count: number;
  is_favorite?: boolean;  // 是否收藏
  created_at: string;
  updated_at: string;
}

interface PromptManagerProps {
  // 不再需要 onClose 和 apiBaseUrl
}

const PromptManager: React.FC<PromptManagerProps> = () => {
  // 使用统一的用户ID工具函数
  const userId = getUserIdUtil();
  
  // 数据迁移：将旧的 'userId' key 下的数据迁移到新 key
  useEffect(() => {
    const oldUserId = localStorage.getItem('userId');
    if (oldUserId && oldUserId !== userId) {
      console.log('检测到旧版本数据，开始迁移...');
      
      // 迁移提示词
      const oldPromptsKey = `${oldUserId}_prompts`;
      const oldPrompts = localStorage.getItem(oldPromptsKey);
      if (oldPrompts) {
        const newPromptsKey = `${userId}_prompts`;
        if (!localStorage.getItem(newPromptsKey)) {
          localStorage.setItem(newPromptsKey, oldPrompts);
          console.log('提示词数据已迁移');
        }
      }
      
      // 迁移分类
      const oldCategoriesKey = `${oldUserId}_prompt_categories`;
      const oldCategories = localStorage.getItem(oldCategoriesKey);
      if (oldCategories) {
        const newCategoriesKey = `${userId}_prompt_categories`;
        if (!localStorage.getItem(newCategoriesKey)) {
          localStorage.setItem(newCategoriesKey, oldCategories);
          console.log('分类数据已迁移');
        }
      }
      
      // 清理旧数据（可选）
      // localStorage.removeItem('userId');
      // localStorage.removeItem(oldPromptsKey);
      // localStorage.removeItem(oldCategoriesKey);
    }
  }, [userId]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);  // 仅显示收藏
  
  // 编辑状态
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: 0,
    keywords: ''
  });
  
  // 分类管理状态
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Excel导入状态（暂未使用）
  // const [isImporting, setIsImporting] = useState(false);
  
  // 从 localStorage 加载分类
  const loadCategories = () => {
    try {
      const storageKey = `${userId}_prompt_categories`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        setCategories(data);
      } else {
        // 初始化默认分类
        const defaultCategories: Category[] = [
          { id: 1, name: '写作助手', description: '用于辅助各类文章写作的提示词' },
          { id: 2, name: '大纲生成', description: '生成文档大纲结构的提示词' },
          { id: 3, name: '内容扩展', description: '扩展和丰富内容的提示词' },
          { id: 4, name: '通用', description: '通用类型提示词' },
        ];
        localStorage.setItem(storageKey, JSON.stringify(defaultCategories));
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };
  
  // 从 localStorage 加载提示词
  const loadPrompts = (categoryId: number | null = null) => {
    setIsLoading(true);
    try {
      const storageKey = `${userId}_prompts`;
      const stored = localStorage.getItem(storageKey);
      let allPrompts: Prompt[] = [];
      
      // 只加载localStorage中的数据，不初始化示例数据
      if (stored) {
        allPrompts = JSON.parse(stored);
      }
      
      // 根据分类筛选
      if (categoryId !== null) {
        allPrompts = allPrompts.filter(p => p.category_id === categoryId);
      }
      
      // 填充分类名称
      allPrompts = allPrompts.map(p => ({
        ...p,
        category_name: categories.find(c => c.id === p.category_id)?.name || '未分类',
      }));
      
      setPrompts(allPrompts);
    } catch (error) {
      console.error('加载提示词失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    loadCategories();
    loadPrompts();
  }, []);
  
  // 切换分类时重新加载
  useEffect(() => {
    loadPrompts(selectedCategory);
  }, [selectedCategory]);
  
  // 创建/更新提示词
  const handleSavePrompt = () => {
    if (!formData.title || !formData.content) {
      alert('请填写标题和内容');
      return;
    }
    
    try {
      const storageKey = `${userId}_prompts`;
      const stored = localStorage.getItem(storageKey);
      let allPrompts: Prompt[] = stored ? JSON.parse(stored) : [];
      
      if (editingPrompt) {
        // 更新现有提示词
        allPrompts = allPrompts.map(p =>
          p.id === editingPrompt.id
            ? {
                ...p,
                ...formData,
                updated_at: new Date().toISOString(),
              }
            : p
        );
      } else {
        // 创建新提示词
        const newPrompt: Prompt = {
          id: Date.now(),
          ...formData,
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        allPrompts.push(newPrompt);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(allPrompts));
      
      setShowPromptForm(false);
      setEditingPrompt(null);
      setFormData({ title: '', content: '', category_id: 0, keywords: '' });
      loadPrompts(selectedCategory);
    } catch (error) {
      console.error('保存失败:', error);
      alert(`保存失败：${error}`);
    }
  };
  
  // 删除提示词
  const handleDeletePrompt = (id: number) => {
    if (!window.confirm('确定要删除这个提示词吗？')) return;
    
    try {
      const storageKey = `${userId}_prompts`;
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      
      const allPrompts: Prompt[] = JSON.parse(stored);
      const filtered = allPrompts.filter(p => p.id !== id);
      
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      loadPrompts(selectedCategory);
    } catch (error) {
      console.error('删除失败:', error);
      alert(`删除失败：${error}`);
    }
  };
  
  // 编辑提示词
  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      title: prompt.title,
      content: prompt.content,
      category_id: prompt.category_id,
      keywords: prompt.keywords
    });
    setShowPromptForm(true);
  };
  
  // 新建提示词
  const handleNewPrompt = () => {
    setEditingPrompt(null);
    setFormData({
      title: '',
      content: '',
      category_id: categories[0]?.id || 0,
      keywords: ''
    });
    setShowPromptForm(true);
  };
  
  // 创建/更新分类
  const handleSaveCategory = () => {
    if (!categoryFormData.name) {
      alert('请填写分类名称');
      return;
    }
    
    try {
      const storageKey = `${userId}_prompt_categories`;
      const stored = localStorage.getItem(storageKey);
      let allCategories: Category[] = stored ? JSON.parse(stored) : [];
      
      if (editingCategory) {
        // 更新现有分类
        allCategories = allCategories.map(c =>
          c.id === editingCategory.id
            ? { ...c, ...categoryFormData }
            : c
        );
      } else {
        // 创建新分类
        const newCategory: Category = {
          id: Date.now(),
          ...categoryFormData,
        };
        allCategories.push(newCategory);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(allCategories));
      
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '', description: '' });
      loadCategories();
    } catch (error) {
      console.error('保存失败:', error);
      alert(`保存失败：${error}`);
    }
  };
  
  // 删除分类
  const handleDeleteCategory = (id: number) => {
    if (!window.confirm('确定要删除这个分类吗？该分类下的提示词会移到"通用"分类。')) return;
    
    try {
      const storageKey = `${userId}_prompt_categories`;
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      
      const allCategories: Category[] = JSON.parse(stored);
      const filtered = allCategories.filter(c => c.id !== id);
      
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      
      // 将该分类下的提示词移到通用分类(id=4)
      const promptsKey = `${userId}_prompts`;
      const promptsStored = localStorage.getItem(promptsKey);
      if (promptsStored) {
        const allPrompts: Prompt[] = JSON.parse(promptsStored);
        const updated = allPrompts.map(p =>
          p.category_id === id ? { ...p, category_id: 4 } : p
        );
        localStorage.setItem(promptsKey, JSON.stringify(updated));
      }
      
      loadCategories();
      if (selectedCategory === id) {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert(`删除失败：${error}`);
    }
  };
  
  // 导入Excel
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('❌ 不支持的文件格式！\n\n请上传 .xlsx、.xls 或 .csv 格式的Excel文件。');
      event.target.value = '';
      return;
    }
    
    try {
      setIsLoading(true);
      
      // 读取Excel文件
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // 转换为JSON格式
      // 支持两种格式：
      // 1. 第一行是列名（标题、内容、分类、关键词）
      // 2. 第一行是数据（按位置：A=标题，B=内容，C=分类，D=关键词）
      let jsonData: any[];
      
      // 先读取第一行，判断是否是列名
      const firstRowData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        range: 0 // 只读取第一行
      });
      
      if (firstRowData.length > 0) {
        const firstRow = firstRowData[0] as any[];
        const firstRowStr = firstRow.map((cell: any) => String(cell).trim()).join('');
        
        // 检查第一行是否包含中文列名关键词
        const hasHeaderKeywords = firstRowStr.includes('标题') || 
                                  firstRowStr.includes('内容') || 
                                  firstRowStr.includes('分类') || 
                                  firstRowStr.includes('关键词');
        
        if (hasHeaderKeywords) {
          // 第一行是列名，使用第一行作为header，从第二行开始读取数据
          const rawData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // 数组格式
            defval: '',
            range: 1 // 从第二行开始
          }) as any[][];
          
          // 创建列名映射（根据第一行的内容）
          const headerMap: Record<number, string> = {};
          firstRow.forEach((cell: any, index: number) => {
            const cellStr = String(cell).trim();
            if (cellStr.includes('标题')) headerMap[index] = 'title';
            else if (cellStr.includes('内容')) headerMap[index] = 'content';
            else if (cellStr.includes('分类')) headerMap[index] = 'category';
            else if (cellStr.includes('关键词')) headerMap[index] = 'keywords';
          });
          
          // 如果没找到列名映射，按位置映射（A=标题，B=内容，C=分类，D=关键词）
          if (Object.keys(headerMap).length === 0) {
            headerMap[0] = 'title';
            headerMap[1] = 'content';
            headerMap[2] = 'category';
            headerMap[3] = 'keywords';
          }
          
          // 转换为对象数组
          jsonData = rawData.map((row: any[]) => {
            const obj: any = {};
            row.forEach((cell: any, index: number) => {
              const key = headerMap[index];
              if (key) {
                obj[key] = cell;
              }
            });
            return obj;
          });
        } else {
          // 第一行不是列名，使用固定列名（第一行也是数据）
          jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: ['title', 'content', 'category', 'keywords'],
            defval: ''
          });
        }
      } else {
        // 文件为空
        jsonData = [];
      }
      
      if (jsonData.length === 0) {
        alert('❌ Excel文件为空！\n\n请确保文件中有数据行。');
        event.target.value = '';
        setIsLoading(false);
        return;
      }
      
      // 加载现有提示词和分类
      const storageKey = `${userId}_prompts`;
      const categoriesKey = `${userId}_prompt_categories`;
      const existingPrompts: Prompt[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const existingCategories: Category[] = JSON.parse(localStorage.getItem(categoriesKey) || '[]');
      
      // 获取最大ID
      const maxPromptId = existingPrompts.length > 0 
        ? Math.max(...existingPrompts.map(p => p.id))
        : 0;
      
      let imported = 0;
      let skipped = 0;
      const skippedRows: number[] = [];
      
      // 处理每一行数据
      jsonData.forEach((row: any, index: number) => {
        const title = String(row.title || '').trim();
        const content = String(row.content || '').trim();
        const categoryName = String(row.category || '').trim() || '通用';
        const keywords = String(row.keywords || '').trim();
        
        // 验证必填字段
        if (!title || !content) {
          skipped++;
          skippedRows.push(index + 2); // +2 因为Excel从第2行开始（第1行是标题）
          return;
        }
        
        // 查找或创建分类
        let categoryId = 4; // 默认"通用"分类ID
        let category = existingCategories.find(c => c.name === categoryName);
        
        if (!category) {
          // 创建新分类
          const maxCategoryId = existingCategories.length > 0
            ? Math.max(...existingCategories.map(c => c.id))
            : 4;
          categoryId = maxCategoryId + 1;
          category = {
            id: categoryId,
            name: categoryName,
            description: `从Excel导入的分类`
          };
          existingCategories.push(category);
        } else {
          categoryId = category.id;
        }
        
        // 检查是否已存在相同标题的提示词
        const exists = existingPrompts.some(p => 
          p.title.toLowerCase().trim() === title.toLowerCase().trim()
        );
        
        if (exists) {
          skipped++;
          skippedRows.push(index + 2);
          return;
        }
        
        // 创建新提示词
        const newPrompt: Prompt = {
          id: maxPromptId + imported + 1,
          title,
          content,
          category_id: categoryId,
          category_name: categoryName,
          keywords,
          usage_count: 0,
          is_favorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        existingPrompts.push(newPrompt);
        imported++;
      });
      
      // 保存到localStorage
      localStorage.setItem(storageKey, JSON.stringify(existingPrompts));
      localStorage.setItem(categoriesKey, JSON.stringify(existingCategories));
      
      // 重新加载数据
      loadCategories();
      loadPrompts(selectedCategory);
      
      // 显示导入结果
      let message = `✅ 导入完成！\n\n`;
      message += `✓ 成功导入: ${imported} 条提示词\n`;
      if (skipped > 0) {
        message += `✗ 跳过: ${skipped} 条\n`;
        if (skippedRows.length <= 10) {
          message += `\n跳过的行号: ${skippedRows.join(', ')}`;
        } else {
          message += `\n跳过的行号: ${skippedRows.slice(0, 10).join(', ')} ... 等 ${skippedRows.length} 行`;
        }
        message += `\n\n跳过原因：标题或内容为空，或已存在相同标题的提示词`;
      }
      
      alert(message);
      
    } catch (error) {
      console.error('导入Excel失败:', error);
      alert(`❌ 导入失败：${error}\n\n请确保Excel文件格式正确。`);
    } finally {
      setIsLoading(false);
      event.target.value = ''; // 清空文件选择，允许重复选择同一文件
    }
  };
  
  
  // 切换收藏状态
  const handleToggleFavorite = (id: number) => {
    try {
      const storageKey = `${userId}_prompts`;
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      
      const allPrompts: Prompt[] = JSON.parse(stored);
      const updated = allPrompts.map(p =>
        p.id === id ? { ...p, is_favorite: !p.is_favorite } : p
      );
      
      localStorage.setItem(storageKey, JSON.stringify(updated));
      loadPrompts(selectedCategory);
    } catch (error) {
      console.error('切换收藏失败:', error);
    }
  };
  
  // 复制提示词内容
  const handleCopyPrompt = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      alert('✅ 提示词已复制到剪贴板！');
    }).catch((error) => {
      console.error('复制失败:', error);
      alert('复制失败，请重试');
    });
  };
  
  // 简单的Markdown渲染函数（支持标题、加粗）
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // 匹配 # ## ### 标题
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        return (
          <div key={index} className="md-heading">
            {headingMatch[2]}
          </div>
        );
      }
      
      // 匹配数字序号 1. 2. 3.
      const numberMatch = line.match(/^(\d+\.)\s+(.+)$/);
      if (numberMatch) {
        return (
          <div key={index} className="md-list-item">
            <span className="md-number">{numberMatch[1]}</span> {numberMatch[2]}
          </div>
        );
      }
      
      // 匹配 **加粗文字**
      const boldRegex = /\*\*([^*]+)\*\*/g;
      if (boldRegex.test(line)) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={index} className="md-line">
            {parts.map((part, i) => {
              const boldMatch = part.match(/\*\*([^*]+)\*\*/);
              if (boldMatch) {
                return <span key={i} className="md-bold">{boldMatch[1]}</span>;
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
        );
      }
      
      // 普通文本
      if (line.trim()) {
        return <div key={index} className="md-line">{line}</div>;
      }
      
      // 空行
      return <div key={index} className="md-empty-line"></div>;
    });
  };
  
  // 过滤提示词
  const filteredPrompts = prompts.filter(prompt => {
    // 如果只显示收藏，先过滤收藏状态
    if (showFavoritesOnly && !prompt.is_favorite) {
      return false;
    }
    
    // 然后应用搜索过滤
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      prompt.title.toLowerCase().includes(query) ||
      prompt.content.toLowerCase().includes(query) ||
      prompt.keywords.toLowerCase().includes(query)
    );
  });
  
  return (
    <div className="prompt-manager-page">
      <div className="prompt-manager">
        <div className="prompt-manager-body">
          {/* 左侧：分类列表 */}
          <div className="category-panel">
            <div className="category-header">
              <h3>分类</h3>
              <button 
                className="btn-add-category"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryFormData({ name: '', description: '' });
                  setShowCategoryForm(true);
                }}
                title="添加分类"
              >
                ➕
              </button>
            </div>
            
            <div className="category-list">
              <div
                className={`category-item ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                <span>全部</span>
                <span className="category-count">{prompts.length}</span>
              </div>
              
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
                >
                  <div onClick={() => setSelectedCategory(cat.id)}>
                    <span>{cat.name}</span>
                    <span className="category-count">
                      {prompts.filter(p => p.category_id === cat.id).length}
                    </span>
                  </div>
                  <div className="category-actions">
                    <button
                      className="btn-edit-cat"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(cat);
                        setCategoryFormData({ name: cat.name, description: cat.description });
                        setShowCategoryForm(true);
                      }}
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete-cat"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 右侧：提示词列表 */}
          <div className="prompts-panel">
            <div className="prompts-header">
              <input
                type="text"
                className="search-input"
                placeholder="搜索提示词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                className={`btn-toggle-favorite ${showFavoritesOnly ? 'active' : ''}`}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                title={showFavoritesOnly ? '显示全部' : '仅显示收藏'}
              >
                {showFavoritesOnly ? '⭐ 收藏' : '☆ 收藏'}
              </button>
              <label 
                className="btn-import-excel"
                title="从Excel导入提示词"
              >
                📥 导入
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={handleImportExcel}
                />
              </label>
              <button 
                className="btn-add-prompt"
                onClick={handleNewPrompt}
              >
                ➕ 新建
              </button>
            </div>
            
            <div className="prompts-list">
              {isLoading ? (
                <div className="loading">加载中...</div>
              ) : filteredPrompts.length === 0 ? (
                <div className="empty">暂无提示词</div>
              ) : (
                filteredPrompts.map(prompt => (
                  <div key={prompt.id} className="prompt-card">
                    <div className="prompt-card-header">
                      <h4>{prompt.title}</h4>
                      <div className="prompt-card-actions">
                        <button
                          className={`btn-favorite ${prompt.is_favorite ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(prompt.id);
                          }}
                          title={prompt.is_favorite ? '取消收藏' : '收藏'}
                        >
                          {prompt.is_favorite ? '⭐' : '☆'}
                        </button>
                        <button
                          className="btn-copy"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPrompt(prompt.content);
                          }}
                          title="复制到剪贴板"
                        >
                          📋
                        </button>
                        <button
                          className="btn-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPrompt(prompt);
                          }}
                          title="编辑"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(prompt.id);
                          }}
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="prompt-card-body">
                      <div className="prompt-content markdown-content">
                        {renderMarkdown(prompt.content)}
                      </div>
                      {prompt.keywords && (
                        <div className="prompt-keywords">
                          关键词：{prompt.keywords}
                        </div>
                      )}
                      <div className="prompt-meta">
                        <span className="prompt-category">{prompt.category_name}</span>
                        <span className="prompt-usage">使用次数：{prompt.usage_count}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* 提示词表单弹窗 */}
        {showPromptForm && (
          <div className="modal-overlay" onClick={() => setShowPromptForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingPrompt ? '编辑提示词' : '新建提示词'}</h3>
                <button className="btn-modal-close" onClick={() => setShowPromptForm(false)}>✖</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>标题 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="输入提示词标题"
                  />
                </div>
                
                <div className="form-group">
                  <label>分类 *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                  >
                    <option value={0}>请选择分类</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>内容 *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="输入提示词内容"
                    rows={8}
                  />
                </div>
                
                <div className="form-group">
                  <label>关键词</label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="用逗号分隔多个关键词"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowPromptForm(false)}>
                  取消
                </button>
                <button className="btn-save" onClick={handleSavePrompt}>
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 分类表单弹窗 */}
        {showCategoryForm && (
          <div className="modal-overlay" onClick={() => setShowCategoryForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingCategory ? '编辑分类' : '新建分类'}</h3>
                <button className="btn-modal-close" onClick={() => setShowCategoryForm(false)}>✖</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>分类名称 *</label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    placeholder="输入分类名称"
                  />
                </div>
                
                <div className="form-group">
                  <label>描述</label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    placeholder="输入分类描述"
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowCategoryForm(false)}>
                  取消
                </button>
                <button className="btn-save" onClick={handleSaveCategory}>
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptManager;

