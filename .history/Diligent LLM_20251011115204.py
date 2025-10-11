"""
title: Diligent LLM
description: 处理长上下文的 Python 管道，专门解决 LLM 在上下文窗口被大量占用时性能下降的问题
author: AI Assistant
version: 1.0.0
license: MIT
"""

from typing import List, Dict
import re


class DiligentLLM:
    """
    Diligent LLM - 智能上下文管理器
    
    用于处理长上下文问题，通过以下策略优化性能：
    1. 内容摘要：当上下文过长时，自动生成摘要
    2. 滑动窗口：保留最近的内容和开头部分
    3. 重要性评分：识别并保留关键信息
    """
    
    def __init__(self, max_context_length: int = 3000):
        """
        初始化 DiligentLLM
        
        Args:
            max_context_length: 最大上下文长度（字符数）
        """
        self.max_context_length = max_context_length
    
    def manage_context(self, content: str) -> str:
        """
        管理上下文长度
        
        Args:
            content: 原始内容
            
        Returns:
            处理后的内容
        """
        if len(content) <= self.max_context_length:
            return content
        
        # 策略：保留开头和结尾，中间用摘要替代
        head_length = min(1000, len(content) // 3)
        tail_length = min(1000, len(content) // 3)
        
        head = content[:head_length]
        tail = content[-tail_length:]
        
        return f"{head}\n\n...(中间部分已省略，总长度约 {len(content)} 字)...\n\n{tail}"
    
    def extract_key_points(self, content: str, max_points: int = 5) -> List[str]:
        """
        提取关键要点
        
        Args:
            content: 内容文本
            max_points: 最多提取的要点数
            
        Returns:
            关键要点列表
        """
        # 简单实现：提取段落的第一句话
        paragraphs = content.split('\n\n')
        key_points = []
        
        for para in paragraphs:
            if para.strip():
                # 提取第一句话
                sentences = re.split(r'[。！？.!?]', para)
                if sentences and sentences[0].strip():
                    key_points.append(sentences[0].strip())
                    if len(key_points) >= max_points:
                        break
        
        return key_points
    
    def create_summary(self, content: str, target_length: int = 200) -> str:
        """
        创建内容摘要（简化版本）
        
        Args:
            content: 原始内容
            target_length: 目标长度（字符数）
            
        Returns:
            摘要文本
        """
        # 提取关键要点
        key_points = self.extract_key_points(content)
        
        # 组合成摘要
        summary = "内容摘要：\n" + "\n".join([f"• {point}" for point in key_points])
        
        # 如果摘要仍然太长，截断
        if len(summary) > target_length:
            summary = summary[:target_length] + "..."
        
        return summary
    
    def sliding_window_context(
        self, 
        previous_content: str, 
        window_size: int = 2000,
        keep_head: bool = True
    ) -> str:
        """
        使用滑动窗口策略处理上下文
        
        Args:
            previous_content: 之前的内容
            window_size: 窗口大小
            keep_head: 是否保留开头部分
            
        Returns:
            处理后的上下文
        """
        if len(previous_content) <= window_size:
            return previous_content
        
        if keep_head:
            # 保留开头和结尾
            head_size = window_size // 3
            tail_size = window_size * 2 // 3
            
            head = previous_content[:head_size]
            tail = previous_content[-tail_size:]
            
            return f"{head}\n\n...(省略中间部分)...\n\n{tail}"
        else:
            # 只保留最近的内容
            return previous_content[-window_size:]
    
    def get_relevant_context(
        self,
        full_content: str,
        current_section: str,
        max_length: int = 1500
    ) -> str:
        """
        获取与当前章节相关的上下文
        
        Args:
            full_content: 完整内容
            current_section: 当前章节标题
            max_length: 最大长度
            
        Returns:
            相关上下文
        """
        if len(full_content) <= max_length:
            return full_content
        
        # 查找当前章节的关键词
        keywords = self._extract_keywords(current_section)
        
        # 找出包含关键词的段落
        paragraphs = full_content.split('\n\n')
        relevant_paras = []
        
        for para in paragraphs:
            for keyword in keywords:
                if keyword.lower() in para.lower():
                    relevant_paras.append(para)
                    break
        
        # 如果找到相关段落，使用这些段落
        if relevant_paras:
            relevant_text = '\n\n'.join(relevant_paras)
            if len(relevant_text) <= max_length:
                return relevant_text
            else:
                return relevant_text[:max_length] + "..."
        
        # 否则使用滑动窗口策略
        return self.sliding_window_context(full_content, max_length)
    
    def _extract_keywords(self, text: str) -> List[str]:
        """
        提取关键词（简单实现）
        
        Args:
            text: 文本
            
        Returns:
            关键词列表
        """
        # 移除标题标记
        text = re.sub(r'#+\s*', '', text)
        
        # 分词（简单按空格分）
        words = text.split()
        
        # 过滤短词和常用词
        stop_words = {'的', '是', '在', '和', '与', '等', '了', '也', '就', 'the', 'is', 'and', 'or', 'in', 'on', 'at'}
        keywords = [w for w in words if len(w) > 1 and w.lower() not in stop_words]
        
        return keywords[:5]  # 返回前5个关键词


def process_long_context_for_generation(
    previous_content: str,
    current_section: str,
    max_context_length: int = 3000
) -> str:
    """
    为生成准备上下文的辅助函数
    
    这是一个示例函数，展示如何在实际应用中使用 DiligentLLM
    
    Args:
        previous_content: 之前生成的内容
        current_section: 当前要生成的章节
        max_context_length: 最大上下文长度
        
    Returns:
        优化后的上下文
    """
    manager = DiligentLLM(max_context_length=max_context_length)
    
    if not previous_content:
        return ""
    
    content_length = len(previous_content)
    
    if content_length <= max_context_length:
        # 内容不长，直接返回
        return previous_content
    
    elif content_length <= max_context_length * 2:
        # 内容适中，使用滑动窗口
        return manager.sliding_window_context(previous_content, max_context_length)
    
    else:
        # 内容很长，需要更智能的处理
        # 1. 获取与当前章节相关的上下文
        relevant = manager.get_relevant_context(
            previous_content, 
            current_section, 
            max_context_length // 2
        )
        
        # 2. 创建整体摘要
        summary = manager.create_summary(previous_content, max_context_length // 4)
        
        # 3. 保留最近的内容
        recent = previous_content[-(max_context_length // 4):]
        
        # 4. 组合所有部分
        return f"{summary}\n\n相关内容：\n{relevant}\n\n最近生成：\n{recent}"


# 示例用法
if __name__ == "__main__":
    # 创建管理器实例
    manager = DiligentLLM(max_context_length=3000)
    
    # 示例：处理长文本
    long_text = "这是一个很长的文本..." * 1000
    managed = manager.manage_context(long_text)
    print(f"原始长度: {len(long_text)}")
    print(f"处理后长度: {len(managed)}")
    
    # 示例：提取关键要点
    content = """
    人工智能在教育领域的应用越来越广泛。它可以提供个性化学习体验。
    
    通过分析学生的学习数据，AI可以识别学生的强项和弱项。这有助于教师制定更有针对性的教学计划。
    
    此外，AI驱动的虚拟助教可以24/7为学生提供帮助。这大大提高了学习的效率和便利性。
    """
    key_points = manager.extract_key_points(content)
    print("\n关键要点:")
    for point in key_points:
        print(f"- {point}")
    
    # 示例：创建摘要
    summary = manager.create_summary(content)
    print(f"\n摘要:\n{summary}")

