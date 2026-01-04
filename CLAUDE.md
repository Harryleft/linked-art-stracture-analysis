# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个Linked Art数据分析工具 - 支持命令行和Web界面的双重应用，用于处理和分析来自文化遗产机构的Linked Art JSON数据。该工具从博物馆收藏API中提取结构化信息，并以可读格式呈现给研究人员和策展人。

## 核心技术

- **运行环境**: Node.js with ES6 modules + Modern Web Browser
- **依赖包**: `node-fetch`, `js-yaml`
- **数据格式**: JSON-LD (Linked Art context)
- **架构**: 模块化架构 - 核心逻辑 + UI组件

## 开发环境设置

```bash
# 安装依赖
npm install

# 运行 CLI 工具
node latool.js <URL> [选项]

# 启动 Web 界面
npx serve -l 8080 .
# 然后访问 http://localhost:50062
```

### CLI 可用选项
- `--log` - 显示详细日志消息
- `--concise` - 仅显示主要信息
- `--found` - 仅显示找到的项目，跳过"Not found"条目
- `--save=filename.yaml` - 保存结果到YAML文件

### Web 界面功能
- **三种视图模式**: 标准视图、JSON-LD结构视图、完整实体视图
- **实时分析**: URL验证和数据获取
- **双语支持**: 中文/英文界面切换
- **导出功能**: YAML格式导出
- **响应式设计**: 支持移动设备

## 架构设计

### 模块化结构

```
js/
├── latool-core.js          # 核心分析逻辑 (LinkedArtAnalyzer类)
├── jsonld-analyzer.js      # JSON-LD结构分析 (JsonLdAnalyzer类)
├── complete-parser.js      # 完整实体递归解析
├── translations.js         # 国际化翻译 (EN/ZH)
└── ui/                     # UI组件模块
    ├── main.js             # 主控制器 (UIController)
    ├── language-manager.js # 语言管理
    ├── input-handler.js    # 输入处理
    ├── results-renderer.js # 结果渲染
    ├── view-manager.js     # 视图管理
    ├── export-handler.js   # 导出处理
    └── complete-entity-view.js # 完整实体视图
```

### 处理流程

#### CLI 流程 (latool.js)
1. **数据获取** - 向Linked Art API发送HTTP请求
2. **ID扩展** - 将紧凑ID (aat:300312355) 转换为完整URI
3. **模式匹配** - 使用预定义模式提取结构化数据
4. **词汇解析** - Getty AAT/TGN/ULAN URI查找
5. **输出生成** - 控制台显示和/或YAML导出

#### Web 流程
1. **用户输入** - URL验证和选项配置
2. **数据获取** - fetch API获取JSON数据
3. **标准分析** - LinkedArtAnalyzer模式匹配提取
4. **结构分析** - JsonLdAnalyzer提取JSON-LD结构
5. **完整解析** - parseEntity递归解析所有属性
6. **结果展示** - 三种视图切换显示

### 核心类和函数

#### LinkedArtAnalyzer (latool-core.js)
- `fetchJson(url)` - 从URL获取JSON数据
- `convertToFullUri(id)` - 将紧凑ID扩展为完整URI
- `analyze(url, options)` - 主分析入口
- `formatResults(analysisResult)` - 格式化结果用于显示

#### JsonLdAnalyzer (jsonld-analyzer.js)
- `analyze(data, url)` - 分析JSON-LD结构
- `extractProperties(data)` - 提取所有属性
- `extractVocabularies(data)` - 提取词汇表引用
- `buildStructureTree(data)` - 构建结构树

#### UIController (ui/main.js)
- 协调所有UI模块
- 管理分析流程和视图切换
- 处理用户交互事件

### 提取模式
工具应用模式函数提取以下信息：
- 名称和标题（主要、展览、前称）
- 登录号和标识符
- 创作者信息和归属
- 作品类型和分类
- 制作日期和时间跨度
- 尺寸（结构化格式和陈述格式）
- 材料和技术
- 地理位置和所有权历史
- IIIF清单和数字图像
- 网络引用和描述

### 模式函数
每种模式类型都有专用函数：
- `creatorPattern()` - 识别创作者信息
- `digitalObjPattern()` - 处理数字对象和IIIF清单
- `typePattern()` - 处理作品类型分类
- `dimensionsPattern()` - 提取尺寸数据
- `materialsPattern()` - 处理材料信息
- `timespanPattern()` - 处理日期和时间跨度数据
- `referencePattern()` - 处理引用数据
- `iiifPattern()` - 处理IIIF呈现API数据

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
3. 修改后需测试CLI和Web界面两种模式

### 修改UI组件
1. UI模块位于 `js/ui/` 目录
2. 每个模块职责单一，便于维护
3. 修改后需刷新浏览器测试

### 添加新视图
1. 在 `index.html` 添加新的视图面板和标签
2. 在 `js/ui/view-manager.js` 添加视图切换逻辑
3. 在 `translations.js` 添加对应的翻译键

### 添加新的翻译
1. 编辑 `js/translations.js`
2. 在 `en` 和 `zh` 对象中添加相同的键值对
3. 使用 `data-i18n` 属性在HTML中引用

### 测试
1. 使用实际的Linked Art API端点进行测试
2. 验证Getty词汇解析功能仍然正常
3. 检查YAML输出格式保持有效
4. 确保与现有JSON示例的向后兼容性
5. 测试三种视图模式都正常工作
6. 测试中英文语言切换

## 注意事项

- Web界面需要HTTP服务器（file://协议有CORS限制）
- 没有自动化测试套件 - 需要手动验证
- 模块化架构使修改更简单
- 错误处理专注于数据质量验证
- 日志记录跟踪紧凑ID使用和版本差异等问题
- 视图切换需要正确处理 `hidden` 和 `active` 类