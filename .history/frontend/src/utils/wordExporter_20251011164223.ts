import * as docx from 'docx';
import { saveAs } from 'file-saver';
import { marked } from 'marked';
import mermaid from 'mermaid';

// 初始化mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true
  }
});

// 解析内联样式（加粗、斜体等）
interface InlineContent {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

function parseInlineStyles(html: string): InlineContent[] {
  const result: InlineContent[] = [];
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const processNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        // 检查父节点是否有样式
        let bold = false;
        let italic = false;
        let parent = node.parentElement;
        
        while (parent && parent !== tempDiv) {
          const tagName = parent.tagName.toLowerCase();
          if (tagName === 'strong' || tagName === 'b') {
            bold = true;
          }
          if (tagName === 'em' || tagName === 'i') {
            italic = true;
          }
          parent = parent.parentElement;
        }
        
        result.push({ text, bold, italic });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      // 处理换行
      if (tagName === 'br') {
        result.push({ text: '\n' });
      } else {
        // 递归处理子节点
        for (let i = 0; i < node.childNodes.length; i++) {
          processNode(node.childNodes[i]);
        }
      }
    }
  };

  processNode(tempDiv);
  return result;
}

// Word导出函数
export async function exportToDocx(markdownContent: string, filename: string = 'document'): Promise<void> {
  if (!markdownContent.trim()) {
    alert('请先输入内容');
    return;
  }
  
  try {
    // 解析Markdown为HTML
    const htmlContent = await marked.parse(markdownContent);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // 处理Mermaid图表 - 先转换代码块为可渲染的格式
    const mermaidBlocks = tempDiv.querySelectorAll('pre code.language-mermaid');
    
    mermaidBlocks.forEach((block, index) => {
      const mermaidCode = block.textContent || '';
      const container = document.createElement('div');
      container.className = 'mermaid-for-export';
      container.setAttribute('data-mermaid-code', mermaidCode);
      container.setAttribute('data-index', String(index));
      const parent = block.parentNode?.parentNode;
      if (parent) {
        parent.replaceChild(container, block.parentNode as Node);
      }
    });
    
    // 准备文档段落
    const children: (docx.Paragraph | docx.Table)[] = [];
    
    // 遍历所有HTML元素
    const elements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, table, .mermaid-for-export');
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent?.trim() || '';
      
      // 对于mermaid元素和表格，不检查文本内容
      if (!element.classList.contains('mermaid-for-export') && tagName !== 'table' && !text) continue;
      
      // 根据不同元素类型创建不同格式的段落
      if (tagName === 'h1') {
        // 一级标题：黑体（三号）
        children.push(new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: text,
              font: "黑体",
              size: 32 // 三号字约16pt
            })
          ],
          spacing: { line: 560, before: 240, after: 240 },
          style: "Heading1"
        }));
      } 
      else if (tagName === 'h2') {
        // 二级标题：黑体（三号）
        children.push(new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: text,
              font: "黑体",
              size: 32
            })
          ],
          spacing: { line: 560, before: 240, after: 120 },
          style: "Heading2"
        }));
      } 
      else if (tagName === 'h3') {
        // 三级标题：楷体GB-2312（三号）
        children.push(new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: text,
              font: "楷体_GB2312",
              size: 32
            })
          ],
          spacing: { line: 560, before: 240, after: 120 },
          style: "Heading3"
        }));
      }
      else if (tagName === 'h4') {
        // 四级标题：仿宋GB-2312（三号）
        children.push(new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: text,
              font: "仿宋_GB2312",
              size: 32,
              bold: true
            })
          ],
          spacing: { line: 560, before: 240, after: 120 },
          style: "Heading4"
        }));
      }
      else if (tagName === 'h5') {
        // 五级标题：黑体（小四号）
        children.push(new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: text,
              font: "黑体",
              size: 28
            })
          ],
          spacing: { line: 560, before: 240, after: 120 },
          style: "Heading5"
        }));
      }
      else if (tagName === 'h6') {
        // 六级标题：楷体GB-2312（小四号）
        children.push(new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: text,
              font: "楷体_GB2312",
              size: 28
            })
          ],
          spacing: { line: 560, before: 240, after: 120 },
          style: "Heading6"
        }));
      } 
      else if (tagName === 'p') {
        // 正文：仿宋GB-2312（三号），支持加粗、斜体
        const inlineContents = parseInlineStyles(element.innerHTML);
        const textRuns = inlineContents.map(content => 
          new docx.TextRun({
            text: content.text,
            font: "仿宋_GB2312",
            size: 32,
            bold: content.bold,
            italics: content.italic
          })
        );
        
        children.push(new docx.Paragraph({
          children: textRuns.length > 0 ? textRuns : [
            new docx.TextRun({
              text: text,
              font: "仿宋_GB2312",
              size: 32
            })
          ],
          style: "Normal"
        }));
      }
      else if (element.classList.contains('mermaid-for-export')) {
        // 处理Mermaid图表
        const mermaidCode = element.getAttribute('data-mermaid-code') || '';
        const mermaidIndex = element.getAttribute('data-index') || '0';
        
        try {
          // 渲染Mermaid图表并等待完成
          const renderResult = await mermaid.render('mermaid-svg-' + i + '-' + mermaidIndex, mermaidCode);
          const svgContent = renderResult.svg;
          
          // 获取SVG尺寸信息
          const svgElement = document.createElement('div');
          svgElement.innerHTML = svgContent;
          const svg = svgElement.firstChild as SVGSVGElement;
          
          // 设置canvas大小
          let width = 800;
          let height = 600;
          
          // 尝试从viewBox获取尺寸
          if (svg && svg.viewBox && svg.viewBox.baseVal) {
            width = svg.viewBox.baseVal.width || 800;
            height = svg.viewBox.baseVal.height || 600;
          }
          // 尝试从width/height属性获取尺寸
          else if (svg && svg.getAttribute('width') && svg.getAttribute('height')) {
            width = parseInt(svg.getAttribute('width') || '800') || 800;
            height = parseInt(svg.getAttribute('height') || '600') || 600;
          }
          
          // 创建SVG转PNG的Promise
          const imagePromise = new Promise<string>((resolve, reject) => {
            // 创建一个canvas元素
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('无法创建canvas上下文'));
              return;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 将SVG转换为PNG
            const svgData = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            
            img.onload = () => {
              try {
                ctx.drawImage(img, 0, 0);
                // 将canvas内容转换为base64
                const base64 = canvas.toDataURL('image/png');
                resolve(base64);
              } catch (error) {
                reject(error);
              }
            };
            
            img.onerror = (error) => {
              reject(error);
            };
            
            // 清理SVG数据并转换为base64
            const cleanSvgData = svgData.replace(/\s+/g, ' ').trim();
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cleanSvgData);
          });
          
          // 等待图片转换完成
          const base64Image = await imagePromise;
          
          // 添加图片到Word文档
          // 计算合适的显示尺寸（最大宽度500像素）
          const maxWidth = 500;
          const maxHeight = 400;
          let displayWidth = maxWidth;
          let displayHeight = maxHeight;
          
          // 如果有实际尺寸，按比例缩放
          if (width && height) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            displayWidth = Math.round(width * ratio);
            displayHeight = Math.round(height * ratio);
          }
          
          children.push(new docx.Paragraph({
            children: [
              new docx.ImageRun({
                data: base64Image.split(',')[1],
                transformation: {
                  width: displayWidth,
                  height: displayHeight
                }
              })
            ],
            alignment: docx.AlignmentType.CENTER,
            spacing: { before: 240, after: 240 }
          }));
          
        } catch (error) {
          console.error('Mermaid图表处理错误:', error);
          // 如果图表处理失败，添加错误提示文本
          children.push(new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `[Mermaid图表渲染失败: ${mermaidCode.substring(0, 50)}...]`,
                font: "仿宋_GB2312",
                size: 28,
                color: "FF0000"
              })
            ],
            alignment: docx.AlignmentType.CENTER,
            spacing: { before: 240, after: 240 }
          }));
        }
      }
      else if (tagName === 'ul' || tagName === 'ol') {
        // 处理列表
        const listItems = element.querySelectorAll('li');
        for (let j = 0; j < listItems.length; j++) {
          const bulletText = tagName === 'ul' ? '• ' : `${j+1}. `;
          const liHtml = listItems[j].innerHTML;
          const inlineContents = parseInlineStyles(liHtml);
          
          const textRuns = [
            new docx.TextRun({
              text: bulletText,
              font: "仿宋_GB2312",
              size: 32
            }),
            ...inlineContents.map(content => 
              new docx.TextRun({
                text: content.text,
                font: "仿宋_GB2312",
                size: 32,
                bold: content.bold,
                italics: content.italic
              })
            )
          ];
          
          children.push(
            new docx.Paragraph({
              children: textRuns,
              indent: { left: 640, firstLine: 0 },
              spacing: { line: 560 }
            })
          );
        }
      }
      else if (tagName === 'table') {
        // 处理表格
        const table = element;
        const rows = table.querySelectorAll('tr');
        const tableRows: docx.TableRow[] = [];
        
        for (let j = 0; j < rows.length; j++) {
          const row = rows[j];
          const cells = row.querySelectorAll('td, th');
          const tableCells: docx.TableCell[] = [];
          
          for (let k = 0; k < cells.length; k++) {
            const cell = cells[k];
            const cellHtml = cell.innerHTML;
            const isHeader = cell.tagName.toLowerCase() === 'th';
            
            // 解析单元格内的内联样式
            const inlineContents = parseInlineStyles(cellHtml);
            const textRuns = inlineContents.map(content => 
              new docx.TextRun({
                text: content.text,
                font: isHeader ? "黑体" : "仿宋_GB2312",
                size: 32,
                bold: isHeader || content.bold,
                italics: content.italic
              })
            );
            
            tableCells.push(
              new docx.TableCell({
                children: [
                  new docx.Paragraph({
                    children: textRuns.length > 0 ? textRuns : [
                      new docx.TextRun({
                        text: cell.textContent?.trim() || '',
                        font: isHeader ? "黑体" : "仿宋_GB2312",
                        size: 32,
                        bold: isHeader
                      })
                    ],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { line: 560 }
                  })
                ],
                borders: {
                  top: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
                  bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
                  left: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
                  right: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" }
                },
                margins: {
                  top: 100,
                  bottom: 100,
                  left: 100,
                  right: 100
                }
              })
            );
          }
          
          tableRows.push(
            new docx.TableRow({
              children: tableCells
            })
          );
        }
        
        // 创建表格
        const docxTable = new docx.Table({
          rows: tableRows,
          width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE
          },
          borders: {
            top: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
            insideHorizontal: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
            insideVertical: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" }
          },
          margins: {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100
          }
        });
        
        children.push(docxTable);
        
        // 在表格后添加一个空段落作为间距
        children.push(
          new docx.Paragraph({
            children: [new docx.TextRun({ text: "" })],
            spacing: { before: 120, after: 120 }
          })
        );
      }
    }
    
    // 如果没有内容，添加一个默认段落
    if (children.length === 0) {
      children.push(
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: "没有内容",
              font: "仿宋_GB2312",
              size: 32
            })
          ]
        })
      );
    }
    
    // 创建文档样式
    const styles = {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "黑体",
            size: 32,
          },
          paragraph: {
            spacing: { before: 240, after: 240, line: 560 },
            outlineLevel: 0,
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "黑体",
            size: 32,
          },
          paragraph: {
            spacing: { before: 240, after: 120, line: 560 },
            outlineLevel: 1,
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "楷体_GB2312",
            size: 32,
          },
          paragraph: {
            spacing: { before: 240, after: 120, line: 560 },
            outlineLevel: 2,
          },
        },
        {
          id: "Heading4",
          name: "Heading 4",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "仿宋_GB2312",
            size: 32,
            bold: true,
          },
          paragraph: {
            spacing: { before: 240, after: 120, line: 560 },
            outlineLevel: 3,
          },
        },
        {
          id: "Heading5",
          name: "Heading 5",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "黑体",
            size: 28,
          },
          paragraph: {
            spacing: { before: 240, after: 120, line: 560 },
            outlineLevel: 4,
          },
        },
        {
          id: "Heading6",
          name: "Heading 6",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "楷体_GB2312",
            size: 28,
          },
          paragraph: {
            spacing: { before: 240, after: 120, line: 560 },
            outlineLevel: 5,
          },
        },
        {
          id: "Normal",
          name: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "仿宋_GB2312",
            size: 32,
          },
          paragraph: {
            spacing: { line: 560 },
            indent: { firstLine: 640 },
          },
        },
      ],
    };

    // 创建一个最基本的文档结构
    const doc = new docx.Document({
      styles: styles,
      sections: [
        {
          properties: {},
          children: children
        }
      ]
    });
    
    // 生成并下载文档
    const blob = await docx.Packer.toBlob(doc);
    const now = new Date();
    const timestamp = now.getFullYear() + 
      String(now.getMonth() + 1).padStart(2, '0') + 
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') + 
      String(now.getMinutes()).padStart(2, '0');
    saveAs(blob, `${filename}_${timestamp}.docx`);
    
  } catch (error) {
    console.error('Word文档生成错误:', error);
    alert('Word文档生成失败：' + (error as Error).message);
    throw error;
  }
}

