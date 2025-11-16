/**
 * 用户识别和ID生成工具
 */

const USER_ID_KEY = 'ai-writing-user-id';

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取或创建用户ID
 * 基于浏览器的简单用户识别方案
 */
export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    userId = generateId();
    localStorage.setItem(USER_ID_KEY, userId);
    console.log('创建新用户ID:', userId);
  }
  
  return userId;
}

/**
 * 获取用户创建时间
 */
export function getUserCreatedTime(): Date | null {
  const userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) return null;
  
  const timestamp = parseInt(userId.split('-')[0]);
  return new Date(timestamp);
}

/**
 * 清除用户数据（用于调试）
 */
export function clearUserData(): void {
  const userId = getUserId();
  const keys = Object.keys(localStorage);
  
  // 清除所有包含用户ID的数据
  keys.forEach(key => {
    if (key.includes(userId) || key.includes('ai-writing')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('用户数据已清除');
}

/**
 * 导出用户数据（用于备份）
 */
export function exportUserData(): string {
  const userId = getUserId();
  const data: Record<string, any> = {
    userId,
    exportedAt: new Date().toISOString(),
    data: {},
  };
  
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes(userId) || key.includes('ai-writing')) {
      data.data[key] = localStorage.getItem(key);
    }
  });
  
  return JSON.stringify(data, null, 2);
}

/**
 * 导入用户数据（用于恢复）
 */
export function importUserData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    Object.keys(data.data).forEach(key => {
      localStorage.setItem(key, data.data[key]);
    });
    
    console.log('用户数据导入成功');
    return true;
  } catch (error) {
    console.error('导入数据失败:', error);
    return false;
  }
}

