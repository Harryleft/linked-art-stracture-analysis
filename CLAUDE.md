# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个Linked Art数据分析工具 - Web应用程序，用于处理和分析来自文化遗产机构的Linked Art JSON数据。该工具从博物馆收藏API中提取结构化信息，并以可读格式呈现给研究人员和策展人。

## 核心技术

- **运行环境**: Modern Web Browser (ES6 modules support required)
- **数据格式**: JSON-LD (Linked Art context)
- **架构**: 模块化架构 - Web UI组件

## 开发环境设置

```bash
# 启动 Web 界面
npx serve -l 8080 .
# 然后访问 http://localhost:8080
```

### Web 界面功能
- **三种视图模式**: 标准视图、JSON-LD结构视图、完整实体视图
- **实时分析**: URL验证和数据获取
- **双语支持**: 中文/英文界面切换
- **导出功能**: YAML格式导出
- **响应式设计**: 支持移动设备

## 架构设计

### 项目结构

```
js/
├── latool-core.js           # 核心分析逻辑 (LinkedArtAnalyzer类 - 浏览器版本)
├── jsonld-analyzer.js       # JSON-LD结构分析 (JsonLdAnalyzer类)
├── complete-parser.js       # 完整实体递归解析
├── translations.js          # 国际化翻译 (EN/ZH)
├── ui.js                    # 旧版单文件UI控制器 (已弃用)
└── ui/                      # 模块化UI组件
    ├── main.js              # 主控制器 (UIController)
    ├── language-manager.js  # 语言管理
    ├── input-handler.js     # 输入处理
    ├── view-manager.js      # 视图管理
    └── complete-entity-view.js # 完整实体视图
```

### 处理流程

#### Web 流程
1. **用户输入** - URL验证和选项配置
2. **数据获取** - fetch API获取JSON数据
3. **多模式分析**
   - 标准分析: LinkedArtAnalyzer模式匹配提取
   - 结构分析: JsonLdAnalyzer提取JSON-LD结构
   - 完整解析: parseEntity递归解析所有属性
4. **结果展示** - 三种视图切换显示

### 核心类和函数

#### LinkedArtAnalyzer (js/latool-core.js)
- `fetchJson(url)` - 从URL获取JSON数据
- `convertToFullUri(id)` - 将紧凑ID扩展为完整URI
- `expandNumericIds(data)` - 递归扩展所有数值ID
- `getTerm(uri, dataField, termType)` - 从Getty词汇表获取术语
- `analyze(url, options)` - 主分析入口
- `formatResults(analysisResult)` - 格式化结果用于显示

#### JsonLdAnalyzer (js/jsonld-analyzer.js)
- `analyze(data, url)` - 分析JSON-LD结构
- `extractProperties(data)` - 提取所有属性
- `extractVocabularies(data)` - 提取词汇表引用
- `buildStructureTree(data)` - 构建结构树
- `identifyVocabulary(url)` - 识别词汇表来源
- `buildTreeNode(obj, parentKey, path, depth, maxDepth)` - 构建树节点
- `generateSummary(data)` - 生成结构摘要

#### CompleteParser (js/complete-parser.js)
- `parseEntity(entity, fetch, logMessages, options)` - 递归解析实体
- `formatParsedEntity(parsed, indent)` - 格式化解析结果
- `getParsedEntityStats(parsed)` - 获取实体统计信息
- `getEntityHierarchy(parsed, path, maxDepth)` - 获取实体层次结构
- `getPropertyByPath(parsed, path)` - 按路径获取属性

#### UIController (js/ui/main.js)
- 协调所有UI模块
- 管理分析流程和视图切换
- 处理用户交互事件
- `analyze(url)` - 执行数据分析
- `showLoading()` / `hideLoading()` - 显示/隐藏加载状态
- `showError(message)` - 显示错误信息

#### LanguageManager (js/ui/language-manager.js)
- `setLanguage(lang)` - 设置界面语言
- `updateTranslations()` - 更新所有翻译元素
- `t(key)` - 获取翻译文本
- `getTranslatedLabel(label)` - 获取字段标签翻译
- `detectLanguage()` - 自动检测浏览器语言

#### InputHandler (js/ui/input-handler.js)
- `onInput()` - 处理输入变化
- `isValidUrl(url)` - 验证URL格式
- `triggerAnalyze()` - 触发分析
- `getUrl()` / `setUrl(url)` - 获取/设置URL
- `setAnalyzeEnabled(enabled)` - 启用/禁用分析按钮

#### ViewManager (js/ui/view-manager.js)
- `switchView(view)` - 切换视图模式
- `displayJsonLdStructure(data)` - 显示JSON-LD结构
- `displayVocabularies(vocabularies)` - 显示词汇表引用
- `displayPropertyTree(structure)` - 显示属性树
- `buildTreeHtml(node, depth)` - 构建树HTML
- `attachArrayToggleListeners()` - 绑定数组展开/折叠事件

#### CompleteEntityView (js/ui/complete-entity-view.js)
- `display(rawData)` - 显示完整实体视图
- `updateDashboard(stats)` - 更新统计面板
- `renderPropertyGrid(parsed)` - 渲染属性网格
- `showPropertyDetail(path, parsed)` - 显示属性详情（模态框）
- `buildTreeContent(property, path)` - 构建树内容
- `filterPropertyGrid(searchTerm)` - 过滤属性网格

### 提取模式 (js/latool-core.js)

LinkedArtAnalyzer 类包含多个模式提取方法：

| 模式方法 | 提取内容 |
|---------|---------|
| `namePattern(data)` | 名称和标题（主要、展览、前称） |
| `identifierPattern(data)` | 登录号和标识符 |
| `creatorPattern(data)` | 创作者信息和归属 |
| `typePattern(data)` | 作品类型和分类 |
| `timespanPattern(data)` | 制作日期和时间跨度 |
| `dimensionsPattern(data)` | 尺寸（结构化格式） |
| `materialsPattern(data)` | 材料和技术 |
| `referencePattern(data)` | 地理位置和所有权历史 |
| `statementPattern(data)` | 网络引用和描述 |
| `digitalObjPattern(data, contentTypes)` | IIIF清单和数字对象 |
| `iiifPattern()` | 从IIIF清单提取图像 |

## 支持的数据源

该工具设计用于处理来自以下机构的Linked Art实现：
- 乔治亚·欧姬芙博物馆
- Numismatics.org
- 耶鲁大学艺术画廊
- 其他使用Linked Art标准的文化遗产机构

## 在此代码库中工作

### 修改核心逻辑

1. 核心分析逻辑在 `js/latool-core.js` (LinkedArtAnalyzer类)
2. JSON-LD分析在 `js/jsonld-analyzer.js` (JsonLdAnalyzer类)
3. 完整解析在 `js/complete-parser.js` (parseEntity函数)
4. 修改后需刷新浏览器测试

### 修改UI组件

1. UI模块位于 `js/ui/` 目录
2. 每个模块职责单一，便于维护：
   - `main.js` - 主控制器，协调所有模块
   - `language-manager.js` - 语言切换
   - `input-handler.js` - 输入验证和处理
   - `view-manager.js` - 视图切换逻辑
   - `complete-entity-view.js` - 完整实体视图渲染

### 添加新视图

1. 在 `index.html` 添加新的视图面板和标签
```html
<button class="view-tab" data-view="newview">新视图</button>
<div id="view-newview" class="view-panel hidden">...</div>
```
2. 在 `js/ui/view-manager.js` 添加视图切换逻辑
3. 在 `js/translations.js` 添加对应的翻译键

### 添加新的翻译

1. 编辑 `js/translations.js`
2. 在 `en` 和 `zh` 对象中添加相同的键值对
```javascript
export const translations = {
    zh: {
        newKey: '新的翻译文本',
        // ...
    },
    en: {
        newKey: 'New translated text',
        // ...
    }
};
```
3. 使用 `data-i18n` 属性在HTML中引用
```html
<span data-i18n="newKey"></span>
```

### 测试

1. 使用实际的Linked Art API端点进行测试
2. 验证Getty词汇解析功能仍然正常
3. 确保与现有JSON示例的向后兼容性
4. 测试三种视图模式都正常工作
5. 测试中英文语言切换
6. 验证数组元素的展开/折叠功能
7. 测试YAML导出功能

## 注意事项

- Web界面需要HTTP服务器（file://协议有CORS限制）
- 没有自动化测试套件 - 需要手动验证
- 模块化架构使修改更简单
- 错误处理专注于数据质量验证
- 日志记录跟踪紧凑ID使用和版本差异等问题
- 视图切换需要正确处理 `hidden` 和 `active` 类
- JSON-LD结构树中的数组元素支持展开/折叠切换
- 完整实体视图使用模态框显示属性详情
- 所有类使用ES6模块导出，需要通过 `<script type="module">` 引入

## 常用调试技巧

### Web界面调试
- 打开浏览器开发者工具查看Console日志（F12）
- 使用Network面板查看API请求
- 检查Elements面板验证DOM结构
- 使用 `debugger;` 语句设置断点

### 测试URL
- 耶鲁大学: `https://linked-art.library.yale.edu/node/94421bee-dbb5-4401-b33d-7bbfe87e4f90`
- 乔治亚·欧姬芙博物馆: `https://api.okeeffemuseum.org/object/1`
- Numismatics: `https://numismatics.org/collection/1944.100.30575`

### 本地开发
```bash
# 使用任何HTTP服务器
npx serve -l 8080 .
# 或
python -m http.server 8080
# 或
npx http-server -p 8080
```

## 已知问题

- 旧版 `js/ui.js` 文件已弃用，请使用 `js/ui/` 目录下的模块化组件
- 词汇表解析依赖外部API，可能受网络影响
- 大型实体解析可能需要较长时间
