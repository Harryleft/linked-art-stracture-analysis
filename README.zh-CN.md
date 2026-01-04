# Linked Art 数据分析工具

> English document is here: [English](README.md)

一个用于分析来自GLAM机构的 Linked Art JSON 数据的 Web 平台。

## 项目简介

该工具从GLAM（美术馆、图书馆、档案馆、博物馆）发布的 Linked Art JSON-LD 数据中提取结构化信息，并以可读格式呈现给用户。

![01](image/01.jpg)

## 项目价值

### 核心问题

Linked Art 数据虽然结构化，但**原始 JSON-LD 格式对非技术人员极不友好**：

```json
{
  "type": "HumanMadeObject",
  "classified_as": [
    {"id": "http://vocab.getty.edu/aat/300312355", "type": "Type"}
  ]
}
```

`aat:300312355` 是什么？策展人和研究人员不应该需要懂编程才能理解文化遗产数据。

### 核心价值

| 维度 | 价值 |
|------|------|
| **降低技术门槛** | 将复杂的 JSON-LD 转换为可读格式，策展人/研究者无需懂编程 |
| **数据洞察** | 多视图展示（结构树、完整属性），帮助发现数据中的隐藏信息 |
| **实时分析** | 无需下载数据，直接通过 URL 探索 GLAM 机构的开放数据 |
| **知识连接** | 解析 Getty 词汇表（AAT/TGN/ULAN），连接专业术语网络 |
| **跨语言** | 双语界面，促进国际文化遗产领域的交流 |

### 应用场景

- **策展研究**：快速了解一件艺术品的所有结构化信息（作者、年代、材料、尺寸）
- **数据质量检查**：机构可以检查自己发布的 Linked Art 数据是否完整
- **数字人文**：学者可以批量探索多个机构的数据模式
- **教育工具**：教学生理解 Linked Art 数据模型

### 目标用户

- 博物馆/美术馆的研究人员
- 策展人
- 文化遗产领域的学者
- 数字人文研究者
- GLAM 机构工作人员

**简而言之**：这个项目是文化遗产数据的"翻译器" — 把机器读的 JSON-LD 翻译成人能理解的格式，让文化遗产数据真正对公众和研究有用。

## 核心功能

- 从 Linked Art API 获取 JSON 数据
- 将紧凑 ID（如 `aat:300312355`）扩展为完整 URI
- 提取结构化元数据：名称、创作者、日期、尺寸、材料等
- Getty 词汇表解析（AAT/TGN/ULAN）
- IIIF 清单处理



## 快速开始

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
3. **切换 JSON-LD 视图**：查看数据结构和词汇表引用

![02](image/02.jpg)

4. **切换完整实体视图**：探索所有属性

![03](image/03.jpg)

点击每个卡片可以查看详情：

![04](image/04.jpg)

### 数据显示说明

**实体类型显示**：部分实体类型可能显示完整的 URL 而非可读标签。这是因为原始数据源中某些类型定义缺少 `_label` 字段，工具会显示可用的标识符 URL。

## 项目结构

```
src/
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
├── package.json                 # 项目配置
├── CLAUDE.md                    # Claude Code 指南
└── README.md                    # 项目文档
```

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT



