<template>
    <div style="margin-top: 20px;">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :page-sizes="[10, 20, 50, 100]"
            size="default" :disabled="disabled" :background="background" layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total" @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-size-text="'条/页'"
            :total-text="'共'">
        </el-pagination>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PaginationType } from '@/types/pagination'

const disabled = ref(false)
const background = ref(true)

const props = defineProps<{
    pagination: PaginationType
}>()

const emit = defineEmits<{
    (e: 'update:pagination', value: PaginationType): void
}>()
const handleSizeChange = (val: number) => {
    console.log(`${val} items per page`)
    emit('update:pagination', { ...props.pagination, pageSize: val })
}

const handleCurrentChange = (val: number) => {
    console.log(`current page: ${val}`)
    emit('update:pagination', { ...props.pagination, page: val })
}
</script>

<style scoped></style>