# Linked Art 数据分析工具

一个 Node.js 命令行应用程序，用于处理和分析来自文化遗产机构的 Linked Art JSON 数据。

## 项目简介

该工具从博物馆收藏 API 中提取结构化信息，并以可读格式呈现给研究人员和策展人。支持处理来自乔治亚·欧姬芙博物馆、Numismatics.org、耶鲁大学艺术画廊等机构的 Linked Art 数据。

## 核心功能

- 从 Linked Art API 获取 JSON 数据
- 将紧凑 ID（如 `aat:300312355`）扩展为完整 URI
- 提取结构化元数据：名称、创作者、日期、尺寸、材料等
- Getty 词汇表解析（AAT/TGN/ULAN）
- IIIF 清单处理
- 支持 YAML 格式导出

## 安装

### 前置要求

- Node.js（建议使用 LTS 版本，支持 ES6 模块）

### 安装依赖

```bash
npm install
```

## 使用方法

### 基本语法

```bash
node latool.js <URL> [选项]
```

### 命令行选项

| 选项 | 说明 |
|------|------|
| `--log` | 显示详细日志消息 |
| `--concise` | 仅显示主要信息 |
| `--found` | 仅显示找到的项目，跳过 "Not found" 条目 |
| `--save=filename.yaml` | 保存结果到 YAML 文件 |

### 使用示例

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
├── latool.js                    # 主应用程序
├── package.json                 # 项目依赖
├── CLAUDE.md                    # Claude Code 指南
├── README.md                    # 项目文档
├── *.json                       # Linked Art 数据示例文件
└── Linked Art Tool Documentation.pdf  # 技术文档
```

## 技术架构

### 处理流程

1. **数据获取** - 向 Linked Art API 发送 HTTP 请求
2. **ID 扩展** - 将紧凑 ID 转换为完整 URI
3. **模式匹配** - 使用预定义模式提取结构化数据
4. **词汇解析** - Getty AAT/TGN/ULAN URI 查找
5. **输出生成** - 控制台显示和/或 YAML 导出

### 核心依赖

- `node-fetch` - HTTP 请求
- `js-yaml` - YAML 格式输出

## 开发

进行修改时：

1. 使用实际的 Linked Art API 端点进行测试
2. 验证 Getty 词汇解析功能仍然正常
3. 检查 YAML 输出格式保持有效
4. 确保与现有 JSON 示例的向后兼容性
5. 测试控制台和文件输出模式

## 注意事项

- 没有自动化测试套件，需要手动验证
- 单文件架构使修改相对简单
- 错误处理专注于数据质量验证

## 许可证

请查看项目许可证文件。

## 贡献

欢迎提交 Issue 和 Pull Request。
