"""
后端 API 服务 - 使用 DeepSeek API
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import os
from openai import OpenAI
from typing import List, Dict
import time

app = Flask(__name__)

# CORS 配置 - 允许前端访问
# 从环境变量读取允许的域名，如果没有则允许所有
allowed_origins = os.environ.get('ALLOWED_ORIGINS', '*')
if allowed_origins != '*':
    allowed_origins = allowed_origins.split(',')

CORS(app, 
     origins=allowed_origins,
     allow_headers=['Content-Type'],
     methods=['GET', 'POST', 'OPTIONS'])

# DeepSeek API 配置
DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-chat"

# 检查 API Key 是否配置
if not DEEPSEEK_API_KEY:
    print("=" * 60)
    print("警告：DeepSeek API Key 未配置！")
    print("请设置环境变量 DEEPSEEK_API_KEY")
    print("=" * 60)

client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url=DEEPSEEK_BASE_URL
)


def query_deepseek(messages: List[Dict[str, str]], stream: bool = False, max_tokens: int = 4000):
    """调用 DeepSeek API"""
    try:
        response = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=messages,
            stream=stream,
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response
    except Exception as e:
        print(f"Error calling DeepSeek API: {e}")
        raise e


@app.route('/api/generate-outline', methods=['POST'])
def generate_outline():
    """生成大纲"""
    data = request.json
    topic = data.get('topic', '')
    custom_prompt = data.get('custom_prompt', '')
    
    if not topic:
        return jsonify({'error': '主题不能为空'}), 400
    
    # 如果用户提供了自定义提示词，使用自定义提示词；否则使用默认提示词
    if custom_prompt:
        prompt = custom_prompt.replace('{topic}', topic)
    else:
        prompt = f"""你是一位专业的公文写作助手。用户想要写一篇关于"{topic}"的文章。

请为这个主题生成一个详细的大纲。大纲应该：
1. 结构清晰，层次分明
2. 涵盖主题的关键方面
3. 逻辑流畅，易于理解
4. 使用 Markdown 格式，支持层级结构（使用 ## 和 ### 标记）

只需要返回大纲内容，不要有其他解释。以 Markdown 格式输出。"""

    messages = [
        {"role": "system", "content": "你是一位专业的写作助手，擅长创建清晰、有逻辑的文章大纲。"},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = query_deepseek(messages, stream=False)
        outline = response.choices[0].message.content
        return jsonify({'outline': outline})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-section', methods=['POST'])
def generate_section():
    """生成单个章节的内容"""
    data = request.json
    topic = data.get('topic', '')
    outline = data.get('outline', '')
    current_section = data.get('current_section', '')
    previous_content = data.get('previous_content', '')
    custom_prompt = data.get('custom_prompt', '')
    
    if not topic or not current_section:
        return jsonify({'error': '主题和当前章节不能为空'}), 400
    
    # 如果用户提供了自定义提示词，使用自定义提示词
    if custom_prompt:
        # 构建上下文用于替换占位符
        context_parts = [f"整体主题：{topic}"]
        
        if outline:
            context_parts.append(f"\n完整大纲：\n{outline}")
        
        if previous_content:
            content_length = len(previous_content)
            if content_length > 3000:
                summary_prompt = f"""请简要概括以下内容的核心要点（100字以内）：

{previous_content[:1000]}

...（中间省略）...

{previous_content[-1000:]}"""
                
                summary_messages = [
                    {"role": "system", "content": "你是一位专业的内容总结助手。"},
                    {"role": "user", "content": summary_prompt}
                ]
                
                try:
                    summary_response = query_deepseek(summary_messages, stream=False, max_tokens=200)
                    summary = summary_response.choices[0].message.content
                    context_parts.append(f"\n之前内容的摘要：\n{summary}")
                except:
                    context_parts.append(f"\n之前内容（截取）：\n{previous_content[-1000:]}")
            else:
                context_parts.append(f"\n已生成的内容：\n{previous_content}")
        
        context = "\n".join(context_parts)
        
        # 替换自定义提示词中的占位符
        prompt = custom_prompt.replace('{topic}', topic).replace('{outline}', outline).replace('{current_section}', current_section).replace('{previous_content}', previous_content).replace('{context}', context)
    else:
        # 使用默认提示词
        # 构建上下文
        context_parts = [f"整体主题：{topic}"]
        
        if outline:
            context_parts.append(f"\n完整大纲：\n{outline}")
        
        if previous_content:
            # 处理长上下文：如果之前的内容太长，进行摘要或截取
            content_length = len(previous_content)
            if content_length > 3000:
                # 只保留最近的内容和开头部分
                summary_prompt = f"""请简要概括以下内容的核心要点（200字以内）：

{previous_content[:1000]}

...（中间省略）...

{previous_content[-1000:]}"""
                
                summary_messages = [
                    {"role": "system", "content": "你是一位专业的内容总结助手。"},
                    {"role": "user", "content": summary_prompt}
                ]
                
                try:
                    summary_response = query_deepseek(summary_messages, stream=False, max_tokens=200)
                    summary = summary_response.choices[0].message.content
                    context_parts.append(f"\n之前内容的摘要：\n{summary}")
                except:
                    # 如果摘要失败，使用简单截取
                    context_parts.append(f"\n之前内容（截取）：\n{previous_content[-1000:]}")
            else:
                context_parts.append(f"\n已生成的内容：\n{previous_content}")
        
        context = "\n".join(context_parts)
        
        prompt = f"""{context}

现在需要详细撰写以下部分：
{current_section}

要求：
1. 内容要详细、深入、有见地
2. 与之前的内容保持连贯，避免重复
3. 使用 Markdown 格式
4. 如果是第一部分，可以有引言；如果是最后一部分，可以有总结
5. 篇幅控制在 500-800 字之间
6. 只返回正文内容，不要包含章节标题（标题已在大纲中）

现在请撰写这一部分的内容："""

    messages = [
        {"role": "system", "content": "你是一位专业的内容创作者，擅长撰写深入、有见地的文章内容。"},
        {"role": "user", "content": prompt}
    ]
    
    def generate():
        try:
            response = query_deepseek(messages, stream=True)
            for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'content': content})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')


@app.route('/api/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    # 生产环境配置
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)

