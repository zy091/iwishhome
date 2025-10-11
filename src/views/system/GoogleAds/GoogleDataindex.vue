<template>
    <WordDocumentViewer 
        :document-url="documentUrl"
        :title="title"
        :show-back-button="false"
        :show-download-button="false"
    />
</template>

<script setup lang="ts">
import WordDocumentViewer from '@/components/WordDocumentViewer.vue'

// 文档配置
const documentUrl = 'https://oziqjzzrouoclocfgoub.supabase.co/storage/v1/object/public/documents/word-files/Google%20AdsDataIndex.docx'
const title = 'Google Ads常用广告指标解读与优化'
</script>

<style scoped>
/* 组件样式由WordDocumentViewer组件内部处理 */
</style>