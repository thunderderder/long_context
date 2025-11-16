"""
提示词数据库管理模块
使用 SQLite 存储和管理提示词
"""

import sqlite3
import json
import os
from typing import List, Dict, Optional
from datetime import datetime
import re


class PromptDatabase:
    def __init__(self, db_path: str = 'prompts.db'):
        """初始化数据库连接"""
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 使用字典形式返回结果
        return conn
    
    def init_database(self):
        """初始化数据库表结构"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 创建分类表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 创建提示词表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category_id INTEGER,
                keywords TEXT,
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id)
            )
        ''')
        
        # 创建索引提高查询性能
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_prompts_keywords 
            ON prompts(keywords)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_prompts_category 
            ON prompts(category_id)
        ''')
        
        conn.commit()
        conn.close()
        
        # 插入默认分类
        self.ensure_default_categories()
    
    def ensure_default_categories(self):
        """确保有默认分类"""
        default_categories = [
            ('大纲生成', '用于生成文章大纲的提示词'),
            ('章节生成', '用于生成具体章节内容的提示词'),
            ('技术文档', '技术相关文档的提示词'),
            ('商业文档', '商业计划、报告等的提示词'),
            ('学术论文', '学术写作相关的提示词'),
            ('公文写作', '政府、企业公文的提示词'),
            ('通用', '通用场景的提示词'),
        ]
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        for name, description in default_categories:
            cursor.execute(
                'INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)',
                (name, description)
            )
        
        conn.commit()
        conn.close()
    
    # ==================== 分类管理 ====================
    
    def get_all_categories(self) -> List[Dict]:
        """获取所有分类"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM categories ORDER BY name')
        categories = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return categories
    
    def create_category(self, name: str, description: str = '') -> int:
        """创建新分类"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            (name, description)
        )
        category_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return category_id
    
    def update_category(self, category_id: int, name: str, description: str = '') -> bool:
        """更新分类"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            (name, description, category_id)
        )
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def delete_category(self, category_id: int) -> bool:
        """删除分类（会将该分类下的提示词移到"通用"分类）"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 获取"通用"分类ID
        cursor.execute('SELECT id FROM categories WHERE name = ?', ('通用',))
        general_category = cursor.fetchone()
        if not general_category:
            return False
        
        general_id = general_category['id']
        
        # 将该分类下的所有提示词移到"通用"
        cursor.execute(
            'UPDATE prompts SET category_id = ? WHERE category_id = ?',
            (general_id, category_id)
        )
        
        # 删除分类
        cursor.execute('DELETE FROM categories WHERE id = ?', (category_id,))
        success = cursor.rowcount > 0
        
        conn.commit()
        conn.close()
        return success
    
    # ==================== 提示词管理 ====================
    
    def create_prompt(self, title: str, content: str, category_id: int = None, keywords: str = '') -> int:
        """创建新提示词"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 如果没有指定分类，使用"通用"分类
        if category_id is None:
            cursor.execute('SELECT id FROM categories WHERE name = ?', ('通用',))
            general_category = cursor.fetchone()
            if general_category:
                category_id = general_category['id']
        
        cursor.execute(
            '''INSERT INTO prompts (title, content, category_id, keywords) 
               VALUES (?, ?, ?, ?)''',
            (title, content, category_id, keywords)
        )
        prompt_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return prompt_id
    
    def get_prompt(self, prompt_id: int) -> Optional[Dict]:
        """获取单个提示词"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM prompts WHERE id = ?', (prompt_id,))
        prompt = cursor.fetchone()
        conn.close()
        return dict(prompt) if prompt else None
    
    def get_all_prompts(self, category_id: Optional[int] = None) -> List[Dict]:
        """获取所有提示词（可按分类筛选）"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if category_id:
            cursor.execute(
                '''SELECT p.*, c.name as category_name 
                   FROM prompts p 
                   LEFT JOIN categories c ON p.category_id = c.id 
                   WHERE p.category_id = ? 
                   ORDER BY p.usage_count DESC, p.created_at DESC''',
                (category_id,)
            )
        else:
            cursor.execute(
                '''SELECT p.*, c.name as category_name 
                   FROM prompts p 
                   LEFT JOIN categories c ON p.category_id = c.id 
                   ORDER BY p.usage_count DESC, p.created_at DESC'''
            )
        
        prompts = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return prompts
    
    def update_prompt(self, prompt_id: int, title: str = None, content: str = None, 
                     category_id: int = None, keywords: str = None) -> bool:
        """更新提示词"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        updates = []
        params = []
        
        if title is not None:
            updates.append('title = ?')
            params.append(title)
        
        if content is not None:
            updates.append('content = ?')
            params.append(content)
        
        if category_id is not None:
            updates.append('category_id = ?')
            params.append(category_id)
        
        if keywords is not None:
            updates.append('keywords = ?')
            params.append(keywords)
        
        if updates:
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(prompt_id)
            
            query = f'UPDATE prompts SET {", ".join(updates)} WHERE id = ?'
            cursor.execute(query, params)
            success = cursor.rowcount > 0
            conn.commit()
        else:
            success = False
        
        conn.close()
        return success
    
    def delete_prompt(self, prompt_id: int) -> bool:
        """删除提示词"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM prompts WHERE id = ?', (prompt_id,))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def increment_usage(self, prompt_id: int):
        """增加提示词使用次数"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE prompts SET usage_count = usage_count + 1 WHERE id = ?',
            (prompt_id,)
        )
        conn.commit()
        conn.close()
    
    # ==================== 智能匹配 ====================
    
    def search_prompts_by_keywords(self, query: str, category_id: Optional[int] = None, limit: int = 5) -> List[Dict]:
        """根据关键词搜索提示词"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 将查询词分割成关键词
        keywords = [kw.strip() for kw in re.split(r'[,\s，、]+', query.lower()) if kw.strip()]
        
        if not keywords:
            return []
        
        # 构建搜索条件
        if category_id:
            query_sql = '''
                SELECT p.*, c.name as category_name 
                FROM prompts p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.category_id = ? AND (
            '''
            params = [category_id]
        else:
            query_sql = '''
                SELECT p.*, c.name as category_name 
                FROM prompts p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE (
            '''
            params = []
        
        # 构建关键词匹配条件
        conditions = []
        for keyword in keywords:
            conditions.append('LOWER(p.title) LIKE ? OR LOWER(p.keywords) LIKE ? OR LOWER(p.content) LIKE ?')
            params.extend([f'%{keyword}%', f'%{keyword}%', f'%{keyword}%'])
        
        query_sql += ' OR '.join(conditions)
        query_sql += ') ORDER BY p.usage_count DESC, p.created_at DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query_sql, params)
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return results
    
    def find_best_match_for_section(self, section_title: str, category_name: str = '章节生成') -> Optional[Dict]:
        """为章节标题找到最佳匹配的提示词"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 获取分类ID
        cursor.execute('SELECT id FROM categories WHERE name = ?', (category_name,))
        category = cursor.fetchone()
        category_id = category['id'] if category else None
        
        # 提取章节标题中的关键词
        title_clean = re.sub(r'^#+\s*', '', section_title)  # 移除 markdown 标记
        
        # 搜索匹配的提示词
        results = self.search_prompts_by_keywords(title_clean, category_id, limit=1)
        
        conn.close()
        
        return results[0] if results else None
    
    # ==================== 数据导入 ====================
    
    def import_from_excel(self, excel_path: str) -> Dict[str, int]:
        """从Excel文件导入提示词"""
        try:
            import openpyxl
            
            workbook = openpyxl.load_workbook(excel_path)
            sheet = workbook.active
            
            imported = 0
            skipped = 0
            
            # 假设Excel格式：第一列是标题，第二列是内容，第三列是分类，第四列是关键词
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if not row[0] or not row[1]:  # 标题和内容必须有
                    skipped += 1
                    continue
                
                title = str(row[0]).strip()
                content = str(row[1]).strip()
                category_name = str(row[2]).strip() if len(row) > 2 and row[2] else '通用'
                keywords = str(row[3]).strip() if len(row) > 3 and row[3] else ''
                
                # 获取或创建分类
                conn = self.get_connection()
                cursor = conn.cursor()
                cursor.execute('SELECT id FROM categories WHERE name = ?', (category_name,))
                category = cursor.fetchone()
                
                if category:
                    category_id = category['id']
                else:
                    # 创建新分类
                    category_id = self.create_category(category_name)
                
                conn.close()
                
                # 创建提示词
                self.create_prompt(title, content, category_id, keywords)
                imported += 1
            
            return {'imported': imported, 'skipped': skipped}
        
        except Exception as e:
            print(f"导入Excel失败: {e}")
            return {'imported': 0, 'skipped': 0, 'error': str(e)}
    
    def export_to_dict(self) -> Dict:
        """导出所有数据为字典（用于备份）"""
        return {
            'categories': self.get_all_categories(),
            'prompts': self.get_all_prompts(),
            'exported_at': datetime.now().isoformat()
        }
    
    def import_from_dict(self, data: Dict) -> bool:
        """从字典导入数据（用于恢复）"""
        try:
            # 导入分类
            category_mapping = {}  # 旧ID -> 新ID
            for cat in data.get('categories', []):
                old_id = cat['id']
                new_id = self.create_category(cat['name'], cat.get('description', ''))
                category_mapping[old_id] = new_id
            
            # 导入提示词
            for prompt in data.get('prompts', []):
                old_category_id = prompt.get('category_id')
                new_category_id = category_mapping.get(old_category_id) if old_category_id else None
                
                self.create_prompt(
                    title=prompt['title'],
                    content=prompt['content'],
                    category_id=new_category_id,
                    keywords=prompt.get('keywords', '')
                )
            
            return True
        except Exception as e:
            print(f"导入数据失败: {e}")
            return False


# 全局数据库实例
db = PromptDatabase()

