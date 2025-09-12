<template>
    <PDFDocumentViewer 
        :document-url="documentUrl"
        :title="title"
        :show-back-button="false"
    />
</template>

<script setup lang="ts">
import PDFDocumentViewer from '@/components/PDFDocumentViewer.vue'

// 文档配置
const documentUrl = 'https://oziqjzzrouoclocfgoub.supabase.co/storage/v1/object/public/documents/word-files/2025Website-layout-training_compressed%20(1).pdf'
const title = '2025网站布局培训'
</script>

<style scoped>
/* 组件样式由PDFDocumentViewer组件内部处理 */
</style>