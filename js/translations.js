/**
 * Translations for Linked Art Analysis Tool
 * Supports Chinese (Simplified) and English
 */

export const translations = {
    zh: {
        // Header
        title: 'Linked Art 数据分析工具',
        subtitle: '分析来自博物馆收藏 API 的文化遗产数据',

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

        // Footer
        footerText: '用于分析文化遗产机构的 Linked Art 数据',
        linkedArtApi: 'Linked Art API',
        github: 'GitHub'
    },
    en: {
        // Header
        title: 'Linked Art Analysis Tool',
        subtitle: 'Analyze and explore cultural heritage data from museum collections APIs',

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
