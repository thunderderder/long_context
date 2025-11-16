import React, { useState } from 'react';
import './App.css';
import TopNavBar from './components/TopNavBar';
import ProjectManagement from './components/ProjectManagement';
import PromptManager from './components/PromptManager';

function App() {
  // 当前视图模式：'projects' | 'prompts' | 'settings'
  const [currentView, setCurrentView] = useState<'projects' | 'prompts' | 'settings'>('projects');
  
  // 从环境变量读取 API URL（暂未使用）
  // const API_BASE_URL = process.env.REACT_APP_API_URL 
  //   ? `${process.env.REACT_APP_API_URL}/api`
  //   : '/api';
  
  const handleNavigate = (view: 'projects' | 'prompts' | 'settings') => {
    setCurrentView(view);
  };

  return (
    <div className="app">
      <TopNavBar currentView={currentView} onNavigate={handleNavigate} />
      <div className="app-content">
        {currentView === 'projects' && <ProjectManagement />}
        {currentView === 'prompts' && <PromptManager />}
        {currentView === 'settings' && (
          <div className="settings-placeholder">
            <div className="placeholder-content">
              <h2>设置</h2>
              <p>开发中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
