<template>
    <div class="study">
        <el-card class="study-search" style="margin-bottom: 20px;">
            <el-space alignment="start" :size="30">

                <el-select v-model="selectedType" placeholder="选择文件类型" clearable size="large" style="width: 240px">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>

                <el-input v-model="searchKeyword" clearable style="width: 240px" placeholder="请输入文件标题"
                    suffix-icon="Search" size="large" />

                <el-button type="primary" size="large" @click="fetchData()">搜索</el-button>
            </el-space>
        </el-card>

        <el-card v-loading="loading" style="min-height: 400px;">
            <el-row :gutter="40" style="row-gap: 30px;">
                <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="(item, index) in tableData">
                    <div class="grid-content-column" @click="fetchMaterialWithContents(item.id)">
                        <el-image style="width: 120px; height: 120px" :src="getIconSrc(item.type)" fit="fill" />
                        <div class="study-content-title hide-text-2">{{ item.title }}</div>
                    </div>
                </el-col>
            </el-row>
            <el-empty v-if="!loading && tableData.length === 0" description="暂无数据" />
        </el-card>
        <Pagination :pagination="pagination" @update="handlePaginationUpdate" />
    </div>
</template>

<script setup lang="ts">
import Pagination from '@/components/system/Pagination.vue'
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabaseClient'
import type { PaginationType } from '@/types/pagination'
import { useRoute } from 'vue-router'
// 响应式数据
const tableData = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const selectedType = ref('')
const sortOrder = ref('desc')
const route = useRoute()
const platform = ref(route.query.platform || 'google')
const chapter = ref(route.query.chapter || 'base')
const pagination = reactive<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0
});
const handlePaginationUpdate = (newPagination: PaginationType) => {
    pagination.page = newPagination.page
    pagination.pageSize = newPagination.pageSize
    fetchData();
}
// 获取数据
const fetchData = async () => {
    try {
        loading.value = true

        // 构建基础查询
        let query = supabase
            .from('study_materials')
            .select('*', { count: 'exact' })
            .eq('platform', platform.value)
            .eq('chapter', chapter.value)

        // 添加搜索条件
        if (searchKeyword.value) {
            query = query.ilike('title', `%${searchKeyword.value}%`)
        }

        // 添加类型筛选
        if (selectedType.value) {
            query = query.eq('type', selectedType.value)
        }

        // 添加排序和分页
        const { data, error, count } = await query
            .order('created_at', { ascending: sortOrder.value === 'asc' })
            .range((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize - 1)

        if (error) throw error

        tableData.value = data
        pagination.total = count !== null ? count : 0
    } catch (err) {
        ElMessage.error(`数据加载失败: ${err}`)
    } finally {
        loading.value = false
    }
}

// 同时获取学习资料及其所有内容项
const fetchMaterialWithContents = async (materialId: string) => {
    try {
        const { data, error } = await supabase
            .from('material_contents')
            .select('*')
            .in('material_id', [materialId])

        if (error) throw error
        console.log(data[0].content)
        // 使用 window.open 在新窗口中打开链接
        window.open(data[0].content, '_blank')

    } catch (err) {
        console.error('查询失败:', err)
        return null
    }
}


onMounted(() => {
    fetchData()
})

const getIconSrc = (type: string) => {
    const icon = iconList.find(icon => icon.icon === type);
    return icon ? icon.src : iconList[0].src; // 返回匹配的图标src，或默认图标
}
const options = [
    {
        value: 'image',
        label: '图片',
    },
    {
        value: 'video',
        label: '视频',
    },
    {
        value: 'txt',
        label: '文本',
    },
    {
        value: 'pdf',
        label: 'PDF',
    },
    {
        value: 'ppt',
        label: 'PPT',
    },
    {
        value: 'link',
        label: '链接',
    },
    {
        value: 'word',
        label: 'Word',
    },
    {
        value: 'excel',
        label: 'Excel',
    },
    {
        value: 'zip',
        label: '压缩包',
    },
]
// env.d.ts
declare module '*.png' {
    const src: string;
    // export default src;
}
// 使用 new URL 动态构建路径
const getIconUrl = (name: string) => {
    return new URL(`/src/assets/icons/${name}.png`, import.meta.url).href;
};

const iconList = [
    { icon: 'image', label: '图片', src: getIconUrl('image') },
    { icon: 'pdf', label: 'PDF', src: getIconUrl('pdf') },
    { icon: 'word', label: 'Word 文档', src: getIconUrl('word') },
    { icon: 'excel', label: 'Excel 表格', src: getIconUrl('excel') },
    { icon: 'txt', label: '文本文件', src: getIconUrl('txt') },
    { icon: 'link', label: '链接', src: getIconUrl('link') },
    { icon: 'video', label: '视频', src: getIconUrl('video') },
    { icon: 'zip', label: 'ZIP 压缩文件', src: getIconUrl('zip') },
    { icon: 'ppt', label: 'PPT 演示文稿', src: getIconUrl('ppt') }
];

</script>

<style scoped>
.study-search {
    margin: 20px 0 10px;
}

.study-content {
    padding: 32px;
}

.grid-content-column {
    width: 100%;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    padding: 10px 0;
    cursor: pointer;
    position: relative;
}

.grid-content-column a {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.grid-content-column:hover {
    box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09);
    color: #46a2ff;

}

.study-content-title {
    font-size: 14px;
    margin: 5px 0 0;
    padding: 0 5px;
    line-height: 1.2;
}
</style>