/**
 * Translations for Linked Art Analysis Tool
 * Supports Chinese (Simplified) and English
 */

export const translations = {
    zh: {
        // Header
        title: 'Linked Art 数据分析工具',
        subtitle: '解析来自GLAM的Linked Art 数据',

        // Input section
        urlLabel: 'Linked Art URL',
        urlPlaceholder: 'https://lux.collections.yale.edu/data/object/...',
        urlHint: '请输入支持机构的 Linked Art JSON 端点 URL',

        // Options
        optionsTitle: '显示选项',
        conciseMode: '简洁模式',
        foundOnly: '仅显示找到的条目',
        showLogs: '显示所有日志',

        // Buttons
        analyze: '分析',
        exportYaml: '导出 YAML',
        cancel: '取消',
        clear: '清除',

        // Loading
        loading: '正在获取和分析数据...',

        // Error
        error: '错误',

        // Results
        resultsTitle: '分析结果',
        fieldsFound: '个字段',

        // Result field labels
        fieldTitle: '标题',
        fieldExhibitedTitle: '展览标题',
        fieldFormerTitle: '曾用名',
        fieldAccessionNumber: '登录号',
        fieldCreators: '创作者',
        fieldWorkTypeClassification: '作品类型（分类）',
        fieldWorkTypeStatement: '作品类型（陈述）',
        fieldWorkType: '作品类型',
        fieldTimespanName: '时间跨度（名称）',
        fieldTimespanStructured: '时间跨度（结构化）',
        fieldTimespan: '时间跨度',
        fieldDimensionsStatement: '尺寸陈述',
        fieldDimensionsStructured: '尺寸（结构化）',
        fieldDimensions: '尺寸',
        fieldMaterialsStatement: '材料陈述',
        fieldMaterialsStructured: '材料（结构化）',
        fieldMaterials: '材料',
        fieldLocation: '位置',
        fieldOwner: '所有者',
        fieldSet: '集合',
        fieldSocialMedia: '社交媒体',
        fieldCreditLine: '信誉来源',
        fieldCitations: '引用',
        fieldAccessStatement: '访问说明',
        fieldDescription: '描述',
        fieldProvenanceDescription: '来源描述',
        fieldWebPages: '网页',
        fieldIiifManifest: 'IIIF 清单',
        fieldPrimaryImage: '主图像',
        fieldPrimaryThumbnail: '主缩略图',
        fieldAllImages: '所有图像',
        fieldAllThumbnails: '所有缩略图',
        fieldLogMessages: '日志消息',

        // Common
        notFound: '未找到',
        multipleCreators: '发现多个创作者，请验证。',

        // JSON-LD Structure View
        viewStandard: '标准视图',
        viewJsonLd: 'JSON-LD 结构',
        viewComplete: '完整实体',
        viewStory: '故事视图',
        entityType: '实体类型',
        properties: '属性数量',
        vocabularies: '词表来源',
        vocabReferences: '词表引用',
        propertyTree: '属性结构树',
        nestedEntities: '嵌套实体',
        arrays: '数组',
        references: '引用',
        maxDepth: '最大深度',
        depth: '深度',
        resolveRefs: '解析引用',
        reanalyze: '重新分析',
        searchProperties: '搜索属性...',

        // Story View / 故事视图
        coreInfo: '📦 核心信息',
        showMore: '展开更多',
        showLess: '收起',
        showTechnical: '查看技术细节',
        hideTechnical: '隐藏技术细节',

        // Story Card Questions / 故事卡片问题
        storyWhat: '这是什么？',
        storyWhatContext: '了解这个物品的基本身份',
        storyWho: '谁创作的？',
        storyWhoContext: '探索创作者的信息',
        storyWhen: '什么时候制作的？',
        storyWhenContext: '了解制作时期',
        storyWhere: '现在在哪里？',
        storyWhereContext: '查看收藏位置',
        storyMaterial: '什么材料制作的？',
        storyMaterialContext: '了解使用的材料',
        storySize: '有多大？',
        storySizeContext: '查看尺寸信息',
        storyImage: '有什么图像？',
        storyImageContext: '查看相关图像',
        storyType: '这是什么类型的物品？',
        storyTypeContext: '了解物品分类',

        // Story Card Answers / 故事卡片答案模板
        storyObject: '这是一件<span class="story-card-value">{type}</span>。',
        storyObjectNamed: '这是一件<span class="story-card-value">{type}</span>，名称是"<span class="story-card-value">{name}</span>"。',
        storyCreator: '由<span class="story-card-value">{creator}</span>创作。',
        storyCreators: '由<span class="story-card-value">{creators}</span>共同创作。',
        storyCreatorUnknown: '创作者未知或佚名。',
        storyTimespan: '制作于<span class="story-card-value">{timespan}</span>。',
        storyTimespanRange: '制作于<span class="story-card-value">{begin}</span>至<span class="story-card-value">{end}</span>期间。',
        storyClassification: '它属于<span class="story-card-value">{classification}</span>类别。',
        storyMaterial: '使用<span class="story-card-value">{material}</span>制作。',
        storyMaterials: '使用多种材料制作，包括<span class="story-card-value">{materials}</span>等。',
        storyLocation: '现收藏于<span class="story-card-value">{location}</span>。',
        storyDimension: '尺寸为<span class="story-card-value">{dimension}</span>。',
        storyImage: '共有<span class="story-card-value">{count}</span>张图像。',

        // Story Card Actions / 故事卡片操作
        viewDetails: '查看详情',
        viewJsonLd: '查看 JSON-LD 数据',

        // Empty States / 空状态
        noCoreInfo: '没有找到核心信息',
        noSecondaryInfo: '没有找到详细信息',
        noTechnicalInfo: '没有找到技术信息',

        // Footer
        footerText: '用于分析文化遗产机构的 Linked Art 数据',
        linkedArtApi: 'Linked Art API',
        github: 'GitHub'
    },
    en: {
        // Header
        title: 'Linked Art Analysis Tool',
        subtitle: 'Parse Linked Art data from GLAM institutions',

        // Input section
        urlLabel: 'Linked Art URL',
        urlPlaceholder: 'https://lux.collections.yale.edu/data/object/...',
        urlHint: 'Enter a Linked Art JSON endpoint URL from supported institutions',

        // Options
        optionsTitle: 'Display Options',
        conciseMode: 'Concise mode',
        foundOnly: 'Found entries only',
        showLogs: 'Show all logs',

        // Buttons
        analyze: 'Analyze',
        exportYaml: 'Export YAML',
        cancel: 'Cancel',
        clear: 'Clear',

        // Loading
        loading: 'Fetching and analyzing data...',

        // Error
        error: 'Error',

        // Results
        resultsTitle: 'Analysis Results',
        fieldsFound: 'fields found',

        // Result field labels
        fieldTitle: 'Title',
        fieldExhibitedTitle: 'Exhibited Title',
        fieldFormerTitle: 'Former Title',
        fieldAccessionNumber: 'Accession Number',
        fieldCreators: 'Creators',
        fieldWorkTypeClassification: 'Work Type (Classification)',
        fieldWorkTypeStatement: 'Work Type (Statement)',
        fieldWorkType: 'Work Type',
        fieldTimespanName: 'Timespan (Name)',
        fieldTimespanStructured: 'Timespan (Structured)',
        fieldTimespan: 'Timespan',
        fieldDimensionsStatement: 'Dimensions Statement',
        fieldDimensionsStructured: 'Dimensions (Structured)',
        fieldDimensions: 'Dimensions',
        fieldMaterialsStatement: 'Materials Statement',
        fieldMaterialsStructured: 'Materials (Structured)',
        fieldMaterials: 'Materials',
        fieldLocation: 'Location',
        fieldOwner: 'Owner',
        fieldSet: 'Set',
        fieldSocialMedia: 'Social Media',
        fieldCreditLine: 'Credit Line',
        fieldCitations: 'Citations',
        fieldAccessStatement: 'Access Statement',
        fieldDescription: 'Description',
        fieldProvenanceDescription: 'Provenance Description',
        fieldWebPages: 'Web Pages',
        fieldIiifManifest: 'IIIF Manifest',
        fieldPrimaryImage: 'Primary Image',
        fieldPrimaryThumbnail: 'Primary Thumbnail',
        fieldAllImages: 'All Images',
        fieldAllThumbnails: 'All Thumbnails',
        fieldLogMessages: 'Log Messages',

        // Common
        notFound: 'Not found',
        multipleCreators: 'Multiple creators found. Please verify.',

        // JSON-LD Structure View
        viewStandard: 'Standard',
        viewJsonLd: 'JSON-LD Structure',
        viewComplete: 'Complete Entity',
        viewStory: 'Story View',
        entityType: 'Entity Type',
        properties: 'Properties',
        vocabularies: 'Vocabularies',
        vocabReferences: 'Vocabulary References',
        propertyTree: 'Property Structure',
        nestedEntities: 'Nested Entities',
        arrays: 'Arrays',
        references: 'References',
        maxDepth: 'Max Depth',
        depth: 'Depth',
        resolveRefs: 'Resolve refs',
        reanalyze: 'Re-analyze',
        searchProperties: 'Search properties...',

        // Story View
        coreInfo: '📦 Core Information',
        showMore: 'Show More',
        showLess: 'Show Less',
        showTechnical: 'View Technical Details',
        hideTechnical: 'Hide Technical Details',

        // Story Card Questions
        storyWhat: 'What is this?',
        storyWhatContext: 'Learn about this object',
        storyWho: 'Who created it?',
        storyWhoContext: 'Explore the creator',
        storyWhen: 'When was it made?',
        storyWhenContext: 'Learn about the time period',
        storyWhere: 'Where is it now?',
        storyWhereContext: 'View current location',
        storyMaterial: 'What materials?',
        storyMaterialContext: 'Learn about the materials used',
        storySize: 'How big is it?',
        storySizeContext: 'View dimensions',
        storyImage: 'What images exist?',
        storyImageContext: 'View related images',
        storyType: 'What type of object?',
        storyTypeContext: 'Learn about the classification',

        // Story Card Answer Templates
        storyObject: 'This is a <span class="story-card-value">{type}</span>.',
        storyObjectNamed: 'This is a <span class="story-card-value">{type}</span> named "<span class="story-card-value">{name}</span>".',
        storyCreator: 'Created by <span class="story-card-value">{creator}</span>.',
        storyCreators: 'Created by <span class="story-card-value">{creators}</span>.',
        storyCreatorUnknown: 'Creator unknown or anonymous.',
        storyTimespan: 'Made in <span class="story-card-value">{timespan}</span>.',
        storyTimespanRange: 'Made between <span class="story-card-value">{begin}</span> and <span class="story-card-value">{end}</span>.',
        storyClassification: 'It belongs to the <span class="story-card-value">{classification}</span> category.',
        storyMaterial: 'Made of <span class="story-card-value">{material}</span>.',
        storyMaterials: 'Made of multiple materials including <span class="story-card-value">{materials}</span>.',
        storyLocation: 'Currently held at <span class="story-card-value">{location}</span>.',
        storyDimension: 'Dimensions: <span class="story-card-value">{dimension}</span>.',
        storyImage: 'Has <span class="story-card-value">{count}</span> images.',

        // Story Card Actions
        viewDetails: 'View Details',
        viewJsonLd: 'View JSON-LD Data',

        // Empty States
        noCoreInfo: 'No core information found',
        noSecondaryInfo: 'No detailed information found',
        noTechnicalInfo: 'No technical information found',

        // Footer
        footerText: 'Built for analyzing Linked Art data from cultural heritage institutions',
        linkedArtApi: 'Linked Art API',
        github: 'GitHub'
    }
};

// Field label mapping for result cards
export const fieldLabelMapping = {
    'Title': 'fieldTitle',
    'Exhibited Title': 'fieldExhibitedTitle',
    'Former Title': 'fieldFormerTitle',
    'Accession Number': 'fieldAccessionNumber',
    'Creators': 'fieldCreators',
    'Work Type (Classification)': 'fieldWorkTypeClassification',
    'Work Type (Statement)': 'fieldWorkTypeStatement',
    'Work Type': 'fieldWorkType',
    'Timespan (Name)': 'fieldTimespanName',
    'Timespan (Structured)': 'fieldTimespanStructured',
    'Timespan': 'fieldTimespan',
    'Dimensions Statement': 'fieldDimensionsStatement',
    'Dimensions (Structured)': 'fieldDimensionsStructured',
    'Dimensions': 'fieldDimensions',
    'Materials Statement': 'fieldMaterialsStatement',
    'Materials (Structured)': 'fieldMaterialsStructured',
    'Materials': 'fieldMaterials',
    'Location': 'fieldLocation',
    'Owner': 'fieldOwner',
    'Set': 'fieldSet',
    'Social Media': 'fieldSocialMedia',
    'Credit Line': 'fieldCreditLine',
    'Citations': 'fieldCitations',
    'Access Statement': 'fieldAccessStatement',
    'Description': 'fieldDescription',
    'Provenance Description': 'fieldProvenanceDescription',
    'Web Pages': 'fieldWebPages',
    'IIIF Manifest': 'fieldIiifManifest',
    'Primary Image': 'fieldPrimaryImage',
    'Primary Thumbnail': 'fieldPrimaryThumbnail',
    'All Images': 'fieldAllImages',
    'All Thumbnails': 'fieldAllThumbnails',
    'Log Messages': 'fieldLogMessages'
};
