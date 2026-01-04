# Linked Art 数据分析工具

一个用于处理和分析来自文化遗产机构的 Linked Art JSON 数据的 Web 应用程序。

## 项目简介

该工具从博物馆收藏 API 中提取结构化信息，并以可读格式呈现给研究人员和策展人。支持处理来自乔治亚·欧姬芙博物馆、Numismatics.org、耶鲁大学艺术画廊等机构的 Linked Art 数据。

## 核心功能

- 从 Linked Art API 获取 JSON 数据
- 将紧凑 ID（如 `aat:300312355`）扩展为完整 URI
- 提取结构化元数据：名称、创作者、日期、尺寸、材料等
- Getty 词汇表解析（AAT/TGN/ULAN）
- IIIF 清单处理
- 支持 YAML 格式导出

### Web 界面特色

- **三种视图模式**
  - 标准视图：传统的字段提取结果
  - JSON-LD 结构视图：显示实体类型、属性和词汇表引用
  - 完整实体视图：递归解析所有属性，支持深度探索
- **双语支持**：中文/英文界面切换
- **实时分析**：URL 验证和即时结果
- **导出功能**：YAML 格式导出
- **响应式设计**：支持移动设备

## 快速开始

### 前置要求

- 现代浏览器（支持 ES6 模块）

### 启动应用

启动本地 HTTP 服务器：

```bash
# 使用 npx serve
npx serve -l 8080 .

# 或使用 Python
python -m http.server 8080

# 或使用 http-server
npx http-server -p 8080
```

然后在浏览器中访问服务器地址（如 `http://localhost:8080`）

**注意**：Web 应用需要通过 HTTP 服务器访问，直接打开 `file://` 协议会有 CORS 限制。

### 使用方法

1. 在输入框中粘贴 Linked Art API 的 URL
2. 点击"分析"按钮
3. 切换不同视图查看结果：
   - **标准视图**：查看提取的字段数据
   - **JSON-LD 视图**：查看数据结构和词汇表引用
   - **完整实体视图**：深度探索所有属性
4. 点击"导出"按钮保存为 YAML 文件

## 数据提取内容

工具可从 Linked Art 数据中提取以下信息：

| 类别 | 提取内容 |
|------|---------|
| **标识信息** | 名称和标题（主要、展览、前称）、登录号和标识符 |
| **创作信息** | 创作者信息和归属、制作日期和时间跨度 |
| **物理特征** | 作品类型和分类、尺寸（结构化格式和陈述格式）、材料和技术 |
| **关联信息** | 地理位置、所有权历史、IIIF 清单和数字图像 |
| **描述信息** | 网络引用、描述、信誉来源、引用 |

## 项目结构

```
taiwanken/
├── index.html                   # Web 应用入口
├── js/
│   ├── latool-core.js           # 核心分析逻辑
│   ├── jsonld-analyzer.js       # JSON-LD 结构分析
│   ├── complete-parser.js       # 完整实体递归解析
│   ├── translations.js          # 国际化翻译
│   ├── ui.js                    # 旧版UI控制器 (已弃用)
│   └── ui/                      # 模块化 UI 组件
│       ├── main.js              # 主控制器
│       ├── language-manager.js  # 语言管理
│       ├── input-handler.js     # 输入处理
│       ├── view-manager.js      # 视图管理
│       └── complete-entity-view.js # 完整实体视图
├── css/
│   └── style.css                # 样式文件
├── data/                        # 示例数据文件
│   ├── physical-objects/        # 物理对象示例
│   ├── visual-items/            # 视觉项目示例
│   └── exhibitions/             # 展览数据示例
├── package.json                 # 项目配置
├── CLAUDE.md                    # Claude Code 指南
└── README.md                    # 项目文档
```

## 技术架构

### 处理流程

1. **用户输入** - URL 验证和选项配置
2. **数据获取** - fetch API 获取 JSON 数据
3. **多模式分析**
   - 标准模式：模式匹配提取
   - JSON-LD 模式：结构和词汇表分析
   - 完整模式：递归解析所有属性
4. **结果展示** - 三种视图切换显示

### 核心组件

| 组件 | 文件 | 职责 |
|------|------|------|
| LinkedArtAnalyzer | js/latool-core.js | 核心分析逻辑 |
| JsonLdAnalyzer | js/jsonld-analyzer.js | JSON-LD 结构分析 |
| CompleteParser | js/complete-parser.js | 递归实体解析 |
| UIController | js/ui/main.js | UI 主控制器 |
| ViewManager | js/ui/view-manager.js | 视图切换管理 |
| CompleteEntityView | js/ui/complete-entity-view.js | 完整实体视图渲染 |
| LanguageManager | js/ui/language-manager.js | 语言切换管理 |

### 技术栈

- 纯 JavaScript (ES6 模块)
- 原生 fetch API
- 无外部依赖

## 开发

### 修改核心逻辑

1. 编辑 `js/latool-core.js` 中的 `LinkedArtAnalyzer` 类
2. 修改 `js/complete-parser.js` 中的解析函数
3. 修改 `js/jsonld-analyzer.js` 中的结构分析
4. 刷新浏览器测试

### 新增视图

1. 在 `index.html` 添加视图面板和标签
```html
<button class="view-tab" data-view="newview">新视图</button>
<div id="view-newview" class="view-panel hidden">
    <!-- 视图内容 -->
</div>
```

2. 在 `js/ui/view-manager.js` 添加视图切换逻辑
3. 在 `js/translations.js` 添加对应的翻译键

### 添加翻译

1. 编辑 `js/translations.js`
2. 在 `en` 和 `zh` 对象中添加相同的键值对
```javascript
export const translations = {
    zh: {
        newKey: '新的翻译文本',
    },
    en: {
        newKey: 'New translated text',
    }
};
```
3. 使用 `data-i18n` 属性在 HTML 中引用
```html
<span data-i18n="newKey"></span>
```

### 测试

1. 使用实际的 Linked Art API 端点进行测试
2. 验证 Getty 词汇解析功能正常
3. 确保与现有 JSON 示例的向后兼容性
4. 测试三种视图模式正常工作
5. 测试中英文语言切换
6. 验证数组元素的展开/折叠功能

### 调试

- 打开浏览器开发者工具（F12）
- 查看 Console 面板的日志输出
- 使用 Network 面板查看 API 请求
- 检查 Elements 面板验证 DOM 结构

## 注意事项

- Web 应用需要 HTTP 服务器（`file://` 协议有 CORS 限制）
- 没有自动化测试套件，需要手动验证
- 模块化架构使修改更简单
- 错误处理专注于数据质量验证
- JSON-LD 结构树支持数组元素的展开/折叠
- 完整实体视图使用模态框显示属性详情

## 测试数据

### 测试 URL 示例

**耶鲁大学艺术画廊：**
- Person: `https://linked-art.library.yale.edu/node/94421bee-dbb5-4401-b33d-7bbfe87e4f90`
- Object: `https://lux.collections.yale.edu/data/object/4d72f8e8-e6e1-5ddb-9b52-28ffa9110530`

**乔治亚·欧姬芙博物馆：**
- Object: `https://api.okeeffemuseum.org/object/1`

**Numismatics.org：**
- Coin: `https://numismatics.org/collection/1944.100.30575`

### 本地示例数据

项目包含多个本地示例 JSON 文件：
- `data/physical-objects/` - 物理对象示例
- `data/visual-items/` - 视觉项目示例
- `data/exhibitions/` - 展览数据示例

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+

需要支持以下特性：
- ES6 模块
- Fetch API
- async/await
- CSS Grid 和 Flexbox
- CSS 变量

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

请查看项目许可证文件。
