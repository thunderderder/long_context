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
from dotenv import load_dotenv
from prompt_database import db

# 加载 .env 文件
load_dotenv()

app = Flask(__name__)

# CORS 配置 - 允许前端访问
CORS(app,
     resources={r"/api/*": {
         "origins": "*",
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type"],
         "supports_credentials": False,
         "max_age": 3600
     }})

# 手动处理 OPTIONS 请求
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

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
    """生成大纲 - 流式输出"""
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


@app.route('/api/generate-section', methods=['POST'])
def generate_section():
    """生成单个章节的内容"""
    data = request.json
    topic = data.get('topic', '')
    outline = data.get('outline', '')
    current_section = data.get('current_section', '')
    previous_content = data.get('previous_content', '')
    custom_prompt = data.get('custom_prompt', '')
    section_hint = data.get('section_hint', '')  # 章节下方的专属提示词
    
    if not topic or not current_section:
        return jsonify({'error': '主题和当前章节不能为空'}), 400
    
    # 如果用户提供了自定义提示词，使用自定义提示词
    if custom_prompt:
        # 构建上下文用于替换占位符
        context_parts = []
        
        if outline:
            context_parts.append(f"完整大纲：\n{outline}")
        
        if previous_content:
            content_length = len(previous_content)
            if content_length > 3000:
                # 对长内容进行摘要
                summary_prompt = f"""请简要概括以下内容的核心要点（200字以内）：

{previous_content[:1000]}

...（中间省略）...

{previous_content[-1000:]}"""
                
                summary_messages = [
                    {"role": "system", "content": "你是一位专业的内容总结助手。"},
                    {"role": "user", "content": summary_prompt}
                ]
                
                try:
                    summary_response = query_deepseek(summary_messages, stream=False, max_tokens=300)
                    summary = summary_response.choices[0].message.content
                    context_parts.append(f"\n已生成内容的摘要：\n{summary}")
                except Exception as e:
                    print(f"生成摘要失败: {e}")
                    context_parts.append(f"\n已生成内容（最近1000字）：\n{previous_content[-1000:]}")
            else:
                context_parts.append(f"\n已生成的内容：\n{previous_content}")
        else:
            context_parts.append("\n（这是第一个章节，没有之前的内容）")
        
        context = "\n".join(context_parts)
        
        # 替换自定义提示词中的占位符
        prompt = custom_prompt.replace('{topic}', topic)
        prompt = prompt.replace('{outline}', outline if outline else '')
        prompt = prompt.replace('{current_section}', current_section)
        prompt = prompt.replace('{previous_content}', previous_content if previous_content else '')
        prompt = prompt.replace('{context}', context)
        
        # 如果有章节专属提示词，添加到提示词末尾
        if section_hint:
            prompt += f"\n\n针对本章节的专属要求：\n{section_hint}"
        
        print(f"使用自定义提示词生成章节: {current_section[:50]}...")
        print(f"提示词长度: {len(prompt)} 字符")
        if section_hint:
            print(f"包含章节专属提示词: {section_hint[:100]}...")
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
        
        # 构建基础提示词
        prompt_parts = [f"""{context}

现在需要详细撰写以下部分：
{current_section}

要求：
1. 内容要详细、深入、有见地
2. 与之前的内容保持连贯，避免重复
3. 使用 Markdown 格式
4. 如果是第一部分，可以有引言；如果是最后一部分，可以有总结
5. 篇幅控制在 500-800 字之间
6. 只返回正文内容，不要包含章节标题（标题已在大纲中）"""]
        
        # 如果有章节专属提示词，添加额外要求
        if section_hint:
            prompt_parts.append(f"\n针对本章节的专属要求：\n{section_hint}")
            print(f"包含章节专属提示词: {section_hint[:100]}...")
        
        prompt_parts.append("\n现在请撰写这一部分的内容：")
        prompt = "".join(prompt_parts)

    # 构建系统消息：基础角色 + 章节专属提示词（如果有）
    system_message = "你是一位专业的内容创作者，擅长撰写深入、有见地的文章内容。"
    
    # 如果有章节专属提示词，添加到系统消息中（提高权重）
    if section_hint:
        system_message += f"\n\n【本章节专属要求】\n{section_hint}"
        print(f"将章节提示词添加到系统消息中: {section_hint[:100]}...")
    
    messages = [
        {"role": "system", "content": system_message},
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


@app.route('/api/regenerate-section', methods=['POST'])
def regenerate_section():
    """重新生成单个章节的内容"""
    data = request.json
    topic = data.get('topic', '')
    outline = data.get('outline', '')
    current_section = data.get('current_section', '')
    previous_content = data.get('previous_content', '')
    preview_context = data.get('preview_context', '')  # 原有的生成内容
    new_prompt = data.get('new_prompt', '')  # 用户的新要求
    section_hint = data.get('section_hint', '')  # 章节下方的专属提示词
    
    if not topic or not current_section or not new_prompt:
        return jsonify({'error': '主题、当前章节和新要求不能为空'}), 400
    
    # 构建重新生成的提示词
    # 构建上下文
    context_parts = []
    
    if outline:
        context_parts.append(f"完整大纲：\n{outline}")
    
    if previous_content:
        content_length = len(previous_content)
        if content_length > 3000:
            # 对长内容进行摘要
            summary_prompt = f"""请简要概括以下内容的核心要点（200字以内）：

{previous_content[:1000]}

...（中间省略）...

{previous_content[-1000:]}"""
            
            summary_messages = [
                {"role": "system", "content": "你是一位专业的内容总结助手。"},
                {"role": "user", "content": summary_prompt}
            ]
            
            try:
                summary_response = query_deepseek(summary_messages, stream=False, max_tokens=300)
                summary = summary_response.choices[0].message.content
                context_parts.append(f"\n已生成内容的摘要：\n{summary}")
            except Exception as e:
                print(f"生成摘要失败: {e}")
                context_parts.append(f"\n已生成内容（最近1000字）：\n{previous_content[-1000:]}")
        else:
            context_parts.append(f"\n已生成的内容：\n{previous_content}")
    else:
        context_parts.append("\n（这是第一个章节，没有之前的内容）")
    
    context = "\n".join(context_parts)
    
    # 使用新的提示词模板
    prompt_parts = [f"""#角色
你是一个交通运输与管理局工作过15年，在发展改革委评审委员会工作过10年的公务员。

#写作风格和内容要求
1. 公文风，内容详细、深入、有见地；
2. 与之前的内容保持连贯，避免重复；

#格式要求
1. 使用 Markdown 格式
2. 每一个段落的篇幅在500字到1200字；
3. 只返回正文内容，不要包含章节标题（标题已在大纲中）

文档主题：
{topic}

这是之前撰写的内容：
{context}

这是用户要求调整或重新撰写的章节：
{current_section}

这是原有的生成内容：
{preview_context}

这是用户的新要求：
{new_prompt}"""]
    
    # 如果有章节专属提示词，添加到提示词中
    if section_hint:
        prompt_parts.append(f"\n\n针对本章节的专属要求（来自大纲）：\n{section_hint}")
        print(f"包含章节专属提示词: {section_hint[:100]}...")
    
    prompt_parts.append("\n\n请根据用户的新要求，重新撰写或调整这个章节的内容：")
    prompt = "".join(prompt_parts)
    
    print(f"重新生成章节: {current_section[:50]}...")
    print(f"用户新要求: {new_prompt}")
    print(f"提示词长度: {len(prompt)} 字符")
    
    # 构建系统消息：基础角色 + 章节专属提示词（如果有）
    system_message = "你是一位专业的内容创作者，擅长撰写深入、有见地的文章内容。你能够根据用户的反馈进行调整和改进。"
    
    # 如果有章节专属提示词，添加到系统消息中（提高权重）
    if section_hint:
        system_message += f"\n\n【本章节专属要求（来自大纲）】\n{section_hint}"
        print(f"将章节提示词添加到系统消息中: {section_hint[:100]}...")
    
    messages = [
        {"role": "system", "content": system_message},
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


@app.route('/api/edit-selection', methods=['POST'])
def edit_selection():
    """编辑选中的文本片段"""
    data = request.json
    selected_text = data.get('selected_text', '')
    instruction = data.get('instruction', '')
    context = data.get('context', '')  # 完整文档上下文
    
    if not selected_text or not instruction:
        return jsonify({'error': '选中文本和指令不能为空'}), 400
    
    # 构建提示词
    prompt = f"""你是一位专业的文本编辑助手。用户选中了一段文字，希望你根据指令对其进行修改。

用户的指令：{instruction}

选中的文字：
{selected_text}

要求：
1. 只返回修改后的文字内容，不要有其他解释
2. 保持原有的 Markdown 格式（如果有）
3. 确保修改后的文字与上下文连贯
4. 如果指令不清晰，请尽量理解用户意图

请直接输出修改后的文字："""
    
    messages = [
        {"role": "system", "content": "你是一位专业的文本编辑助手，擅长根据用户指令改进和修改文字内容。"},
        {"role": "user", "content": prompt}
    ]
    
    def generate():
        try:
            response = query_deepseek(messages, stream=True, max_tokens=2000)
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


# ==================== 提示词管理 API ====================

@app.route('/api/prompts/categories', methods=['GET'])
def get_categories():
    """获取所有分类"""
    try:
        categories = db.get_all_categories()
        return jsonify({'categories': categories})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/categories', methods=['POST'])
def create_category():
    """创建新分类"""
    try:
        data = request.json
        name = data.get('name')
        description = data.get('description', '')
        
        if not name:
            return jsonify({'error': '分类名称不能为空'}), 400
        
        category_id = db.create_category(name, description)
        return jsonify({'id': category_id, 'message': '分类创建成功'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    """更新分类"""
    try:
        data = request.json
        name = data.get('name')
        description = data.get('description', '')
        
        if not name:
            return jsonify({'error': '分类名称不能为空'}), 400
        
        success = db.update_category(category_id, name, description)
        if success:
            return jsonify({'message': '分类更新成功'})
        else:
            return jsonify({'error': '分类不存在'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    """删除分类"""
    try:
        success = db.delete_category(category_id)
        if success:
            return jsonify({'message': '分类删除成功'})
        else:
            return jsonify({'error': '分类不存在'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts', methods=['GET'])
def get_prompts():
    """获取所有提示词（可按分类筛选）"""
    try:
        category_id = request.args.get('category_id', type=int)
        prompts = db.get_all_prompts(category_id)
        return jsonify({'prompts': prompts})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts', methods=['POST'])
def create_prompt():
    """创建新提示词"""
    try:
        data = request.json
        title = data.get('title')
        content = data.get('content')
        category_id = data.get('category_id')
        keywords = data.get('keywords', '')
        
        if not title or not content:
            return jsonify({'error': '标题和内容不能为空'}), 400
        
        prompt_id = db.create_prompt(title, content, category_id, keywords)
        return jsonify({'id': prompt_id, 'message': '提示词创建成功'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/<int:prompt_id>', methods=['GET'])
def get_prompt(prompt_id):
    """获取单个提示词"""
    try:
        prompt = db.get_prompt(prompt_id)
        if prompt:
            return jsonify({'prompt': prompt})
        else:
            return jsonify({'error': '提示词不存在'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/<int:prompt_id>', methods=['PUT'])
def update_prompt(prompt_id):
    """更新提示词"""
    try:
        data = request.json
        success = db.update_prompt(
            prompt_id,
            title=data.get('title'),
            content=data.get('content'),
            category_id=data.get('category_id'),
            keywords=data.get('keywords')
        )
        if success:
            return jsonify({'message': '提示词更新成功'})
        else:
            return jsonify({'error': '提示词不存在'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/<int:prompt_id>', methods=['DELETE'])
def delete_prompt(prompt_id):
    """删除提示词"""
    try:
        success = db.delete_prompt(prompt_id)
        if success:
            return jsonify({'message': '提示词删除成功'})
        else:
            return jsonify({'error': '提示词不存在'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/search', methods=['POST'])
def search_prompts():
    """搜索提示词"""
    try:
        data = request.json
        query = data.get('query', '')
        category_id = data.get('category_id')
        limit = data.get('limit', 5)
        
        results = db.search_prompts_by_keywords(query, category_id, limit)
        return jsonify({'results': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/match-section', methods=['POST'])
def match_section():
    """为章节标题匹配最佳提示词"""
    try:
        data = request.json
        section_title = data.get('section_title', '')
        category_name = data.get('category_name', '章节生成')
        
        if not section_title:
            return jsonify({'error': '章节标题不能为空'}), 400
        
        match = db.find_best_match_for_section(section_title, category_name)
        
        if match:
            # 增加使用次数
            db.increment_usage(match['id'])
            return jsonify({'match': match})
        else:
            return jsonify({'match': None})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/auto-generate', methods=['POST'])
def auto_generate_prompt():
    """使用AI为章节生成提示词（流式响应）"""
    try:
        data = request.json
        section_title = data.get('section_title', '')
        topic = data.get('topic', '')
        outline = data.get('outline', '')
        
        if not section_title:
            return jsonify({'error': '章节标题不能为空'}), 400
        
        # 构建生成提示词的提示
        prompt = f"""你是一个专业的写作提示词生成助手。用户正在写一篇关于"{topic}"的文章，需要为以下章节生成一个写作提示词。

完整大纲：
{outline}

当前章节：
{section_title}

请生成一个简洁但详细的写作提示词，指导AI如何撰写这个章节。提示词应该包含：
1. 该章节应该包含哪些要点
2. 写作风格和语气建议
3. 需要注意的事项

直接返回提示词内容，不要有其他解释。字数控制在100-200字之间。"""

        messages = [
            {"role": "system", "content": "你是一个专业的写作提示词生成助手，擅长为不同类型的文章章节生成精准的写作指导。"},
            {"role": "user", "content": prompt}
        ]
        
        def generate():
            """生成器函数，用于流式响应"""
            try:
                response = query_deepseek(messages, stream=True, max_tokens=500)
                
                for chunk in response:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        # 立即发送，避免缓冲
                        data = f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n"
                        yield data
                
                # 发送完成信号
                yield f"data: {json.dumps({'done': True})}\n\n"
            
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        # 禁用缓冲，确保流式数据立即发送
        response = Response(generate(), mimetype='text/event-stream')
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['X-Accel-Buffering'] = 'no'
        return response
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/import-excel', methods=['POST'])
def import_excel():
    """从Excel导入提示词"""
    try:
        # 检查是否有上传的文件
        if 'file' not in request.files:
            return jsonify({'error': '没有上传文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '文件名为空'}), 400
        
        # 保存临时文件
        temp_path = 'temp_import.xlsx'
        file.save(temp_path)
        
        # 导入
        result = db.import_from_excel(temp_path)
        
        # 删除临时文件
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== 章节提示词生成 API（新增）====================

@app.route('/api/generate-section-prompt', methods=['POST'])
def generate_section_prompt():
    """为单个章节生成专属提示词（非流式，直接返回）"""
    try:
        data = request.json
        section_title = data.get('section_title', '')
        topic = data.get('topic', '')
        outline = data.get('outline', '')
        project_name = data.get('project_name', '')
        doc_name = data.get('doc_name', '')
        
        if not section_title:
            return jsonify({'error': '章节标题不能为空'}), 400
        
        # 构建生成提示词的提示
        prompt = f"""你是一个专业的写作提示词生成助手。用户正在写一篇关于"{topic}"的文档，需要为以下章节生成一个写作提示词。

项目名称：{project_name}
文档名称：{doc_name}

完整大纲：
{outline}

当前章节：{section_title}

请生成一个简洁但详细的写作提示词，指导 AI 如何撰写这个章节。提示词应该包含：
1. 该章节的核心内容和要点
2. 写作风格和语气建议（公文风、专业、详实等）
3. 需要注意的事项和重点
4. 与上下文的衔接建议

要求：
- 直接返回提示词内容，不要有其他解释
- 字数控制在 150-300 字之间
- 使用第二人称（"你需要..."）或祈使句（"请..."）
- 内容具体、可执行"""

        messages = [
            {"role": "system", "content": "你是一个专业的写作提示词生成助手，擅长为不同类型的文章章节生成精准的写作指导。你生成的提示词清晰、具体、易于AI理解和执行。"},
            {"role": "user", "content": prompt}
        ]
        
        # 非流式调用，直接获取结果
        response = query_deepseek(messages, stream=False, max_tokens=600)
        generated_prompt = response.choices[0].message.content
        
        print(f"为章节 '{section_title}' 生成提示词成功，长度: {len(generated_prompt)} 字符")
        
        return jsonify({
            'prompt': generated_prompt,
            'section_title': section_title
        })
    
    except Exception as e:
        print(f"生成章节提示词失败: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/ai-semantic-match', methods=['POST'])
def ai_semantic_match():
    """AI 语义匹配提示词（预留接口，使用小模型）
    
    此接口预留给后续使用小型 AI 模型（如 embedding 模型）进行语义相似度匹配
    当关键词匹配分数较低时，可以调用此接口进行更智能的匹配
    
    实现思路：
    1. 使用小模型（如 text-embedding-ada-002）计算章节标题的 embedding
    2. 与提示词库中所有提示词的 embedding 进行相似度计算
    3. 返回相似度最高的提示词
    
    优势：
    - 更智能的语义理解
    - 能匹配到意思相近但关键词不同的提示词
    - 使用小模型成本低、速度快
    """
    try:
        data = request.json
        section_title = data.get('section_title', '')
        prompts = data.get('prompts', [])  # 前端传入的提示词列表
        
        if not section_title:
            return jsonify({'error': '章节标题不能为空'}), 400
        
        # TODO: 实现 AI 语义匹配
        # 1. 获取章节标题的 embedding
        # section_embedding = get_embedding(section_title)
        
        # 2. 计算与每个提示词的相似度
        # best_match = None
        # best_score = 0
        # for prompt in prompts:
        #     prompt_embedding = get_embedding(prompt['title'] + ' ' + prompt['keywords'])
        #     similarity = cosine_similarity(section_embedding, prompt_embedding)
        #     if similarity > best_score:
        #         best_score = similarity
        #         best_match = prompt
        
        # 3. 返回最佳匹配
        # return jsonify({
        #     'match': best_match,
        #     'score': best_score,
        #     'method': 'ai_semantic'
        # })
        
        # 当前返回未实现提示
        return jsonify({
            'error': 'AI 语义匹配功能尚未实现',
            'message': '此接口已预留，后续可集成小型 embedding 模型进行语义匹配',
            'suggestion': '请先使用关键词匹配或 AI 生成功能'
        }), 501  # 501 Not Implemented
    
    except Exception as e:
        print(f"AI 语义匹配失败: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # 生产环境配置
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)

