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
const documentUrl = 'https://oziqjzzrouoclocfgoub.supabase.co/storage/v1/object/public/documents/word-files/AboutGoogle3.docx'
const title = '了解Google'
</script>

<style scoped>
/* 组件样式由WordDocumentViewer组件内部处理 */
</style>