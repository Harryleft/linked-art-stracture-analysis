# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个Linked Art数据分析工具 - Node.js命令行应用程序，用于处理和分析来自文化遗产机构的Linked Art JSON数据。该工具从博物馆收藏API中提取结构化信息，并以可读格式呈现给研究人员和策展人。

## 核心技术

- **运行环境**: Node.js with ES6 modules
- **依赖包**: `node-fetch`, `js-yaml`
- **数据格式**: JSON-LD (Linked Art context)
- **架构**: 单文件CLI应用 (latool.js)

## 开发环境设置

```bash
# 安装依赖
npm install

# 运行工具
node latool.js <URL> [选项]
```

### 可用选项
- `--log` - 显示详细日志消息
- `--concise` - 仅显示主要信息
- `--found` - 仅显示找到的项目，跳过"Not found"条目
- `--save=filename.yaml` - 保存结果到YAML文件

### 示例
```bash
node latool.js https://lux.collections.yale.edu/data/person/d7d7e27e-3dab-4fab-b049-f09c76de18fe --log --save=analysis.yaml
```

## 架构设计

### 处理流程
1. **数据获取** - 向Linked Art API发送HTTP请求
2. **ID扩展** - 将紧凑ID (aat:300312355) 转换为完整URI
3. **模式匹配** - 使用预定义模式提取结构化数据
4. **词汇解析** - Getty AAT/TGN/ULAN URI查找
5. **输出生成** - 控制台显示和/或YAML导出

### 核心函数
- `fetchJson()` - 从URL获取JSON数据
- `convertToFullUri()` - 将紧凑ID扩展为完整URI
- `getContentOrValue()` - 处理数据结构中的版本差异
- `iterativeSearch()` - 递归对象遍历
- `runAllPatterns()` - 主协调函数，应用所有提取模式
- `outputResults()` - 格式化并显示结果

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

进行修改时：
1. 使用实际的Linked Art API端点进行测试
2. 验证Getty词汇解析功能仍然正常
3. 检查YAML输出格式保持有效
4. 确保与现有JSON示例的向后兼容性
5. 测试控制台和文件输出模式

## 注意事项

- 没有自动化测试套件 - 需要手动验证
- 单文件架构使修改相对简单
- 错误处理专注于数据质量验证
- 日志记录跟踪紧凑ID使用和版本差异等问题