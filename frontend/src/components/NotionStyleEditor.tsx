import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState, Transaction, Selection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, DOMSerializer, Node as ProseMirrorNode } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { keymap } from 'prosemirror-keymap';
import { history, undo, redo } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';
import { MarkdownParser, MarkdownSerializer } from 'prosemirror-markdown';
import './NotionStyleEditor.css';

interface NotionStyleEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSelectionChange?: (selectedText: string, from: number, to: number) => void;
  enableAI?: boolean; // 是否启用 AI 功能，默认 true
}

// 创建自定义 Schema，支持 Markdown 标记可见
const mySchema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: basicSchema.spec.marks,
});

/**
 * 解析文本中的行内标记（加粗、斜体等）
 * 特殊处理：列表序号（1. 2. 3.）和列表符号（- *）也标记为加粗，显示为蓝色
 */
const parseInlineMarks = (text: string, schema: Schema): ProseMirrorNode[] => {
  const nodes: ProseMirrorNode[] = [];
  
  // 检查是否是有序列表项（以数字和点开头）
  const orderedMatch = text.match(/^(\d+\.\s+)(.*)$/);
  if (orderedMatch) {
    // 序号部分标记为加粗（显示为蓝色）
    nodes.push(schema.text(orderedMatch[1], [schema.marks.strong.create()]));
    // 剩余内容继续解析
    const remainingNodes = parseTextWithMarks(orderedMatch[2], schema);
    nodes.push(...remainingNodes);
    return nodes;
  }
  
  // 检查是否是无序列表项（以 - 或 * 开头）
  const unorderedMatch = text.match(/^([-*]\s+)(.*)$/);
  if (unorderedMatch) {
    // 符号部分标记为加粗（显示为蓝色）
    nodes.push(schema.text(unorderedMatch[1], [schema.marks.strong.create()]));
    // 剩余内容继续解析
    const remainingNodes = parseTextWithMarks(unorderedMatch[2], schema);
    nodes.push(...remainingNodes);
    return nodes;
  }
  
  // 普通文本，解析 **加粗** 和 *斜体*
  return parseTextWithMarks(text, schema);
};

/**
 * 解析文本中的加粗和斜体标记
 */
const parseTextWithMarks = (text: string, schema: Schema): ProseMirrorNode[] => {
  const nodes: ProseMirrorNode[] = [];
  
  // 匹配 **加粗** 和 *斜体*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        nodes.push(schema.text(plainText));
      }
    }
    
    // 添加带标记的文本
    if (match[2]) {
      // **加粗**
      nodes.push(schema.text(match[2], [schema.marks.strong.create()]));
    } else if (match[3]) {
      // *斜体*
      nodes.push(schema.text(match[3], [schema.marks.em.create()]));
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // 添加剩余的普通文本
  if (lastIndex < text.length) {
    const plainText = text.substring(lastIndex);
    if (plainText) {
      nodes.push(schema.text(plainText));
    }
  }
  
  // 如果没有任何节点，返回原始文本
  if (nodes.length === 0) {
    nodes.push(schema.text(text));
  }
  
  return nodes;
};

// 创建浮动工具栏组件
interface FloatingToolbarProps {
  position: { top: number; left: number } | null;
  selectedText: string;
  onAIEdit: (instruction: string) => void;
  onClose: () => void;
  enableAI: boolean; // 是否启用 AI 功能（大纲不启用，内容启用）
  onChangeHeading?: (level: number | null) => void; // 修改标题级别
  currentBlockType?: string; // 当前块类型
  currentHeadingLevel?: number; // 当前标题级别
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  position,
  selectedText,
  onAIEdit,
  onClose,
  enableAI,
  onChangeHeading,
  currentBlockType,
  currentHeadingLevel,
}) => {
  const [instruction, setInstruction] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  if (!position) return null;

  const handleSubmit = () => {
    if (instruction.trim()) {
      onAIEdit(instruction);
      setInstruction('');
    }
  };

  return (
    <div
      className="floating-toolbar"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
      }}
      onMouseDown={(e) => {
        // 只阻止工具栏容器本身的事件，不阻止内部元素
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div className="toolbar-main">
        {/* 标题级别切换 */}
        {onChangeHeading && (
          <div className="toolbar-section">
            <select
              className="toolbar-select"
              value={currentBlockType === 'heading' ? `h${currentHeadingLevel}` : 'p'}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'p') {
                  onChangeHeading(null);
                } else {
                  const level = parseInt(value.substring(1));
                  onChangeHeading(level);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="修改标题级别"
            >
              <option value="p">正文</option>
              <option value="h1">标题 1</option>
              <option value="h2">标题 2</option>
              <option value="h3">标题 3</option>
              <option value="h4">标题 4</option>
              <option value="h5">标题 5</option>
              <option value="h6">标题 6</option>
            </select>
          </div>
        )}

        {/* AI 指令输入框 */}
        {enableAI && (
          <div className="toolbar-input-container">
            <input
              ref={inputRef}
              type="text"
              className="toolbar-input"
              placeholder="输入 AI 指令..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                } else if (e.key === 'Escape') {
                  onClose();
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <button 
              className="toolbar-btn-small" 
              onClick={handleSubmit} 
              title="执行"
              onMouseDown={(e) => e.stopPropagation()}
            >
              ✓
            </button>
          </div>
        )}

        <button
          className="toolbar-btn-small toolbar-close"
          onClick={onClose}
          title="关闭"
          onMouseDown={(e) => e.stopPropagation()}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const NotionStyleEditor: React.FC<NotionStyleEditorProps> = ({
  content,
  onChange,
  onSelectionChange,
  enableAI = true,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBlockType, setCurrentBlockType] = useState<string>('paragraph');
  const [currentHeadingLevel, setCurrentHeadingLevel] = useState<number>(1);

  // 从 Markdown 创建初始文档
  const createDocFromMarkdown = useCallback((markdown: string) => {
    if (!markdown || markdown.trim() === '') {
      // 空内容返回空段落
      return mySchema.node('doc', null, [mySchema.node('paragraph', null, [])]);
    }

    const lines = markdown.split('\n');
    const nodes: ProseMirrorNode[] = [];
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // 匹配标题（必须在行首）
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        nodes.push(mySchema.node('heading', { level }, [mySchema.text(text)]));
        i++;
        continue;
      }
      
      // 匹配提示词块（用 HTML 注释包裹）
      if (line.trim() === '<!-- PROMPT_START -->') {
        i++;
        const promptLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== '<!-- PROMPT_END -->') {
          promptLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim() === '<!-- PROMPT_END -->') {
          i++; // 跳过结束标识符
        }
        
        // 将提示词内容包裹在 blockquote 中显示，并解析 Markdown 格式
        if (promptLines.length > 0) {
          const promptNodes: ProseMirrorNode[] = [];
          let j = 0;
          
          while (j < promptLines.length) {
            const promptLine = promptLines[j];
            if (!promptLine.trim()) {
              j++;
              continue;
            }
            
            // 检查是否是标题
            const headingMatch = promptLine.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
              const level = headingMatch[1].length;
              const text = headingMatch[2];
              promptNodes.push(mySchema.node('heading', { level }, [mySchema.text(text)]));
              j++;
              continue;
            }
            
            // 检查是否是有序列表（保留原始序号）
            const orderedListMatch = promptLine.match(/^(\d+)\.\s+(.+)$/);
            if (orderedListMatch) {
              // 将列表项作为普通段落，但保留原始的 "1. ", "2. " 等前缀
              // 这样可以完整保留原始序号
              const textWithMarks = parseInlineMarks(promptLine, mySchema);
              promptNodes.push(mySchema.node('paragraph', { class: 'ordered-item' }, textWithMarks));
              j++;
              continue;
            }
            
            // 检查是否是无序列表（保留原始符号）
            const unorderedListMatch = promptLine.match(/^[-*]\s+(.+)$/);
            if (unorderedListMatch) {
              // 将列表项作为普通段落，保留原始的 "- " 或 "* " 前缀
              const textWithMarks = parseInlineMarks(promptLine, mySchema);
              promptNodes.push(mySchema.node('paragraph', { class: 'bullet-item' }, textWithMarks));
              j++;
              continue;
            }
            
            // 普通文本，处理加粗标记
            const textWithMarks = parseInlineMarks(promptLine, mySchema);
            promptNodes.push(mySchema.node('paragraph', null, textWithMarks));
            j++;
          }
          
          if (promptNodes.length > 0) {
            nodes.push(mySchema.node('blockquote', null, promptNodes));
          }
        }
        continue;
      }
      
      // 匹配无序列表
      const listMatch = line.match(/^[-*]\s+(.+)$/);
      if (listMatch) {
        const listItems: ProseMirrorNode[] = [];
        while (i < lines.length) {
          const itemMatch = lines[i].match(/^[-*]\s+(.+)$/);
          if (!itemMatch) break;
          listItems.push(
            mySchema.node('list_item', null, [
              mySchema.node('paragraph', null, [mySchema.text(itemMatch[1])])
            ])
          );
          i++;
        }
        if (listItems.length > 0) {
          nodes.push(mySchema.node('bullet_list', null, listItems));
        }
        continue;
      }
      
      // 空行跳过
      if (line.trim() === '') {
        i++;
        continue;
      }
      
      // 普通段落（可能包含行内格式）
      let textContent = line;
      const marks: any[] = [];
      
      // 简单处理加粗和斜体（不使用正则替换，而是标记位置）
      // 这里简化处理，直接作为纯文本
      nodes.push(mySchema.node('paragraph', null, textContent ? [mySchema.text(textContent)] : []));
      i++;
    }
    
    // 如果没有任何节点，添加一个空段落
    if (nodes.length === 0) {
      nodes.push(mySchema.node('paragraph', null, []));
    }
    
    try {
      return mySchema.node('doc', null, nodes);
    } catch (e) {
      console.error('创建文档失败:', e);
      // 降级处理：返回包含原始文本的段落
      return mySchema.node('doc', null, [
        mySchema.node('paragraph', null, markdown ? [mySchema.text(markdown)] : [])
      ]);
    }
  }, []);

  // 将 ProseMirror 文档转换回 Markdown
  const docToMarkdown = useCallback((doc: ProseMirrorNode): string => {
    let markdown = '';
    
    doc.forEach((node) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level || 1;
        const prefix = '#'.repeat(level);
        markdown += `${prefix} ${node.textContent}\n\n`;
      } else if (node.type.name === 'paragraph') {
        let text = '';
        node.forEach((child) => {
          if (child.isText) {
            let t = child.text || '';
            if (child.marks.length > 0) {
              child.marks.forEach((mark) => {
                if (mark.type.name === 'strong') {
                  t = `**${t}**`;
                } else if (mark.type.name === 'em') {
                  t = `*${t}*`;
                }
              });
            }
            text += t;
          }
        });
        if (text.trim()) {
          markdown += `${text}\n\n`;
        }
      } else if (node.type.name === 'blockquote') {
        // 将 blockquote 转换为提示词块格式（用 HTML 注释包裹）
        markdown += '<!-- PROMPT_START -->\n';
        const contentLines: string[] = [];
        node.forEach((childNode) => {
          if (childNode.type.name === 'heading') {
            // 保留标题标记
            const level = childNode.attrs.level || 1;
            const prefix = '#'.repeat(level);
            contentLines.push(`${prefix} ${childNode.textContent}`);
          } else if (childNode.type.name === 'paragraph') {
            // 保留加粗和斜体标记
            let text = '';
            childNode.forEach((textNode) => {
              if (textNode.isText) {
                let t = textNode.text || '';
                if (textNode.marks.length > 0) {
                  textNode.marks.forEach((mark) => {
                    if (mark.type.name === 'strong') {
                      t = `**${t}**`;
                    } else if (mark.type.name === 'em') {
                      t = `*${t}*`;
                    }
                  });
                }
                text += t;
              }
            });
            if (text.trim()) {
              contentLines.push(text);
            }
          }
        });
        markdown += contentLines.join('\n');
        markdown += '\n<!-- PROMPT_END -->\n\n';
      } else if (node.type.name === 'bullet_list') {
        node.forEach((listItem) => {
          markdown += `- ${listItem.textContent}\n`;
        });
        markdown += '\n';
      } else if (node.type.name === 'ordered_list') {
        let index = 1;
        node.forEach((listItem) => {
          markdown += `${index}. ${listItem.textContent}\n`;
          index++;
        });
        markdown += '\n';
      }
    });
    
    return markdown.trim();
  }, []);

  // 处理选择变化
  const handleSelectionChange = useCallback((state: EditorState) => {
    const { from, to } = state.selection;
    
    if (from === to) {
      // 没有选中文本
      setSelectedText('');
      setSelectionRange(null);
      setToolbarPosition(null);
      return;
    }

    // 获取选中的文本
    const text = state.doc.textBetween(from, to, ' ');
    setSelectedText(text);
    setSelectionRange({ from, to });

    // 获取当前块的类型和级别
    const $from = state.selection.$from;
    const blockNode = $from.parent;
    setCurrentBlockType(blockNode.type.name);
    if (blockNode.type.name === 'heading') {
      setCurrentHeadingLevel(blockNode.attrs.level || 1);
    }

    // 计算工具栏位置
    if (viewRef.current) {
      const view = viewRef.current;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      
      // 工具栏显示在选区上方
      const left = (start.left + end.left) / 2;
      const top = start.top - 60; // 上方 60px，避免遮挡

      setToolbarPosition({ top, left });
    }

    // 通知父组件
    if (onSelectionChange) {
      onSelectionChange(text, from, to);
    }
  }, [onSelectionChange]);

  // Notion 风格的标题快捷输入插件
  const notionShortcutsPlugin = useCallback(() => {
    return keymap({
      'Space': (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const { $from } = state.selection;
        
        // 只在段落中处理
        if ($from.parent.type.name !== 'paragraph') {
          return false;
        }
        
        // 获取当前位置之前的文本
        const textBefore = $from.parent.textContent.substring(0, $from.parentOffset);
        
        // 检查是否匹配标题模式 (##, ###, 等)
        const headingMatch = textBefore.match(/^(#{1,6})$/);
        
        if (!headingMatch) {
          return false;
        }
        
        const level = headingMatch[1].length;
        
        if (dispatch) {
          // 获取当前段落的深度
          const depth = $from.depth;
          
          // 计算段落的范围
          const from = $from.before(depth);
          const to = $from.after(depth);
          
          let tr = state.tr;
          
          // 先转换块类型
          tr = tr.setBlockType(from, to, mySchema.nodes.heading, { level });
          
          // 然后删除 ## 标记（在新文档中）
          const nodeStart = tr.doc.resolve(from + 1);
          tr = tr.delete(nodeStart.pos, nodeStart.pos + textBefore.length);
          
          dispatch(tr);
        }
        
        return true;
      },
    });
  }, []);

  // 使用 ref 保存 handleSelectionChange，避免循环依赖
  const handleSelectionChangeRef = useRef(handleSelectionChange);
  useEffect(() => {
    handleSelectionChangeRef.current = handleSelectionChange;
  }, [handleSelectionChange]);

  // 初始化编辑器
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const doc = createDocFromMarkdown(content);

    const state = EditorState.create({
      doc,
      plugins: [
        history(),
        notionShortcutsPlugin(), // 添加 Notion 快捷输入插件
        keymap({ 'Mod-z': undo, 'Mod-y': redo }),
        keymap(baseKeymap),
      ],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction: (transaction: Transaction) => {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        // 内容变化时通知父组件
        if (transaction.docChanged) {
          const newMarkdown = docToMarkdown(newState.doc);
          onChange(newMarkdown);
        }

        // 不在这里处理选择变化，而是在 mouseup 事件中处理
      },
      handleDOMEvents: {
        mouseup: (view, event) => {
          // 延迟一点执行，确保选择已经完成
          setTimeout(() => {
            handleSelectionChangeRef.current(view.state);
          }, 10);
          return false;
        },
        mousedown: () => {
          // 鼠标按下时隐藏工具栏
          setToolbarPosition(null);
          return false;
        },
      },
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // 只在组件挂载时初始化一次

  // 处理标题级别修改
  const handleChangeHeading = useCallback((level: number | null) => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const { from, to } = view.state.selection;
    const $from = view.state.selection.$from;
    
    // 获取块的范围
    const blockStart = $from.before($from.depth);
    const blockEnd = $from.after($from.depth);

    let tr = view.state.tr;

    if (level === null) {
      // 转换为段落
      tr = tr.setBlockType(blockStart, blockEnd, mySchema.nodes.paragraph);
    } else {
      // 转换为标题
      tr = tr.setBlockType(blockStart, blockEnd, mySchema.nodes.heading, { level });
    }

    view.dispatch(tr);
    view.focus();

    // 关闭工具栏
    setToolbarPosition(null);
    setSelectedText('');
    setSelectionRange(null);
  }, []);

  // 处理 AI 编辑
  const handleAIEdit = async (instruction: string) => {
    if (!selectedText || !selectionRange || !viewRef.current) return;

    setIsProcessing(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL 
        ? `${process.env.REACT_APP_API_URL}/api`
        : '/api';

      const response = await fetch(`${API_BASE_URL}/edit-selection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_text: selectedText,
          instruction: instruction,
          context: content, // 提供完整上下文
        }),
      });

      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let editedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                editedText += data.content;
                
                // 实时更新编辑器中的文本
                const view = viewRef.current;
                if (view && selectionRange) {
                  const { from, to } = selectionRange;
                  const tr = view.state.tr.replaceWith(
                    from,
                    to,
                    view.state.schema.text(editedText)
                  );
                  view.dispatch(tr);
                }
              }
              if (data.done) {
                // 编辑完成
                setToolbarPosition(null);
                setSelectedText('');
                setSelectionRange(null);
              }
              if (data.error) {
                alert(`AI 编辑失败：${data.error}`);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      alert(`AI 编辑失败：${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 当外部内容更新时，更新编辑器（谨慎使用，避免光标跳动）
  const lastContentRef = useRef<string>(content);
  
  useEffect(() => {
    if (!viewRef.current || isProcessing) return;
    
    // 如果内容没变，直接返回
    if (content === lastContentRef.current) return;
    
    const view = viewRef.current;
    const currentMarkdown = docToMarkdown(view.state.doc);
    
    // 规范化比较：去除多余空行
    const normalizeMarkdown = (md: string) => {
      return md.replace(/\n{3,}/g, '\n\n').trim();
    };
    
    const normalizedCurrent = normalizeMarkdown(currentMarkdown);
    const normalizedContent = normalizeMarkdown(content);
    
    // 只有当内容真正不同时才更新（避免循环更新）
    if (normalizedCurrent !== normalizedContent) {
      console.log('外部内容变化，更新编辑器');
      console.log('当前内容长度:', currentMarkdown.length, '新内容长度:', content.length);
      
      const newDoc = createDocFromMarkdown(content);
      
      // 保存当前光标位置
      const { from, to } = view.state.selection;
      
      // 替换整个文档
      const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, newDoc.content);
      
      // 尝试恢复光标位置（如果位置仍然有效）
      const newDocSize = tr.doc.content.size;
      if (from <= newDocSize && to <= newDocSize) {
        tr.setSelection(Selection.near(tr.doc.resolve(Math.min(from, newDocSize))));
      }
      
      view.dispatch(tr);
      lastContentRef.current = content;
    }
  }, [content, createDocFromMarkdown, docToMarkdown, isProcessing]);

  return (
    <div className="notion-style-editor-container">
      <div ref={editorRef} className="notion-editor" />
      
      <FloatingToolbar
        position={toolbarPosition}
        selectedText={selectedText}
        onAIEdit={handleAIEdit}
        onClose={() => {
          setToolbarPosition(null);
          setSelectedText('');
          setSelectionRange(null);
        }}
        enableAI={enableAI}
        onChangeHeading={handleChangeHeading}
        currentBlockType={currentBlockType}
        currentHeadingLevel={currentHeadingLevel}
      />

      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner">⚙️ AI 正在编辑...</div>
        </div>
      )}
    </div>
  );
};

export default NotionStyleEditor;

