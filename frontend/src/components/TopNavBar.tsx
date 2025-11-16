import React from 'react';
import './TopNavBar.css';

interface TopNavBarProps {
  currentView: 'projects' | 'prompts' | 'settings';
  onNavigate: (view: 'projects' | 'prompts' | 'settings') => void;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ currentView, onNavigate }) => {
  return (
    <nav className="top-nav-bar">
      <div className="nav-left">
        <div className="nav-logo">
          <span className="logo-icon">📝</span>
          <span className="logo-text">AI写作助手</span>
        </div>
        
        <div className="nav-links">
          <button
            className={`nav-link ${currentView === 'projects' ? 'active' : ''}`}
            onClick={() => onNavigate('projects')}
          >
            我的项目
          </button>
          <button
            className={`nav-link ${currentView === 'prompts' ? 'active' : ''}`}
            onClick={() => onNavigate('prompts')}
          >
            提示词库
          </button>
          <button
            className="nav-link disabled"
            disabled
            title="开发中"
          >
            设置
          </button>
        </div>
      </div>
      
      <div className="nav-right">
        <button className="user-button disabled" disabled title="开发中">
          <span className="user-avatar">👤</span>
          <span className="user-name">访客</span>
        </button>
      </div>
    </nav>
  );
};

export default TopNavBar;

