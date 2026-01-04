# Linked Art 数据分析工具

一个用于处理和分析来自文化遗产机构的 Linked Art JSON 数据的工具，提供命令行界面和 Web 界面两种使用方式。

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

## 安装

### 前置要求

- Node.js（建议使用 LTS 版本，支持 ES6 模块）

### 安装依赖

```bash
npm install
```

## 使用方法

### Web 界面（推荐）

启动本地服务器：

```bash
# 使用 npx serve
npx serve -l 8080 .

# 或使用 Python
python -m http.server 8080

# 或使用 http-server
npx http-server -p 8080
```

然后在浏览器中访问服务器地址（如 `http://localhost:8080`）

**注意**：Web 界面需要通过 HTTP 服务器访问，直接打开 `file://` 协议会有 CORS 限制。

### 命令行界面

#### 基本语法

```bash
node latool.js <URL> [选项]
```

#### 命令行选项

| 选项 | 说明 |
|------|------|
| `--log` | 显示详细日志消息 |
| `--concise` | 仅显示主要信息 |
| `--found` | 仅显示找到的项目，跳过 "Not found" 条目 |
| `--save=filename.yaml` | 保存结果到 YAML 文件 |

#### 使用示例

```bash
# 基本用法
node latool.js https://lux.collections.yale.edu/data/person/d7d7e27e-3dab-4fab-b049-f09c76de18fe

# 带日志和文件输出
node latool.js https://lux.collections.yale.edu/data/person/d7d7e27e-3dab-4fab-b049-f09c76de18fe --log --save=analysis.yaml

# 简洁输出
node latool.js https://lux.collections.yale.edu/data/person/d7d7e27e-3dab-4fab-b049-f09c76de18fe --concise
```

## 数据提取内容

工具可从 Linked Art 数据中提取以下信息：

- 名称和标题（主要、展览、前称）
- 登录号和标识符
- 创作者信息和归属
- 作品类型和分类
- 制作日期和时间跨度
- 尺寸（结构化格式和陈述格式）
- 材料和技术
- 地理位置和所有权历史
- IIIF 清单和数字图像
- 网络引用和描述

## 项目结构

```
taiwanken/
├── index.html                   # Web 界面入口
├── latool.js                    # CLI 命令行工具
├── js/
│   ├── latool-core.js          # 核心分析逻辑
│   ├── jsonld-analyzer.js      # JSON-LD 结构分析
│   ├── complete-parser.js      # 完整实体递归解析
│   ├── translations.js         # 国际化翻译
│   └── ui/                     # UI 组件模块
│       ├── main.js             # 主控制器
│       ├── language-manager.js # 语言管理
│       ├── input-handler.js    # 输入处理
│       ├── results-renderer.js # 结果渲染
│       ├── view-manager.js     # 视图管理
│       ├── export-handler.js   # 导出处理
│       └── complete-entity-view.js # 完整实体视图
├── css/
│   └── style.css               # 样式文件
├── lib/                        # CLI 库文件
│   ├── parser.js               # 数据解析器
│   └── utils.js                # 工具函数
├── data/                       # 示例数据文件
├── package.json                 # 项目依赖
├── CLAUDE.md                    # Claude Code 指南
└── README.md                    # 项目文档
```

## 技术架构

### 处理流程

#### CLI 流程
1. **数据获取** - 向 Linked Art API 发送 HTTP 请求
2. **ID 扩展** - 将紧凑 ID 转换为完整 URI
3. **模式匹配** - 使用预定义模式提取结构化数据
4. **词汇解析** - Getty AAT/TGN/ULAN URI 查找
5. **输出生成** - 控制台显示和/或 YAML 导出

#### Web 流程
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

### 核心依赖

- `node-fetch` - HTTP 请求
- `js-yaml` - YAML 格式输出

## 开发

### 添加新功能

1. **核心逻辑修改**：编辑 `js/latool-core.js` 中的 `LinkedArtAnalyzer` 类
2. **新增视图**：在 `index.html` 添加视图面板，在 `js/ui/view-manager.js` 添加切换逻辑
3. **添加翻译**：在 `js/translations.js` 的 `en` 和 `zh` 对象中添加键值对

### 测试

1. 使用实际的 Linked Art API 端点进行测试
2. 验证 Getty 词汇解析功能仍然正常
3. 检查 YAML 输出格式保持有效
4. 确保与现有 JSON 示例的向后兼容性
5. 测试三种视图模式都正常工作
6. 测试中英文语言切换

### 调试

Web 界面支持浏览器控制台调试：
- 打开浏览器开发者工具
- 查看 Console 面板的日志输出
- 使用 Network 面板查看 API 请求

## 注意事项

- Web 界面需要 HTTP 服务器（`file://` 协议有 CORS 限制）
- 没有自动化测试套件，需要手动验证
- 模块化架构使修改更简单
- 错误处理专注于数据质量验证

## 测试数据

测试 URL 示例：
- 耶鲁大学：`https://linked-art.library.yale.edu/node/94421bee-dbb5-4401-b33d-7bbfe87e4f90`
- 乔治亚·欧姬芙博物馆：`https://api.okeeffemuseum.org/object/1`

## 许可证

请查看项目许可证文件。

## 贡献

欢迎提交 Issue 和 Pull Request。
