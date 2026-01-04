# Linked Art 数据分析工具

> English document is here: [English](README.md)

一个用于分析来自GLAM机构的 Linked Art JSON 数据的 Web 平台。

## 项目简介

该工具从GLAM（美术馆、图书馆、档案馆、博物馆）发布的 Linked Art JSON-LD 数据中提取结构化信息，并以可读格式呈现给用户。

![01](image/01.jpg)



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



