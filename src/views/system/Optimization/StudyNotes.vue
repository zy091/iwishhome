<template>
    <div class="study-notes">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="study-notes-title">
            <h1 class="title">学习心得</h1>
        </div>
        <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect" :router="true">
            <el-menu-item index="/system/study-notes/list">我的心得</el-menu-item>
            <el-menu-item index="/system/study-notes/create">添加心得</el-menu-item>
        </el-menu>
        <div class="study-notes-content">
            <RouterView></RouterView>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumb from '@/components/system/Breadcrumb.vue'

const route = useRoute()
const activeIndex = ref('/system/study-notes/list')

onMounted(() => {
    activeIndex.value = route.path
})

const handleSelect = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}

const platform = ref(route.query.platform || 'google')

// 监听路由参数的变化
watch(() => route.query.platform, (newPlatform) => {
    platform.value = newPlatform || 'google'
}, { immediate: true })

const platformName = computed(() => {
    switch(platform.value) {
        case 'google':
            return '谷歌'
        case 'facebook':
            return 'FaceBook'
        default:
            return '谷歌'
    }
})

const breadcrumb = reactive([
    {
        name: `${platformName.value}优化`,
        path: `/system/optimize?platform=${platform.value}`
    },
    {
        name: '学习心得',
        path: '/system/study-notes'
    }
])
</script>

<style scoped>
.study-notes {
    padding: 10px 0;
}

.study-notes-title {
    margin: 20px 0;
}

.study-notes-content {
    margin-top: 20px;
}

/* 参考日常作业的样式 */
:deep(.el-menu--horizontal) {
    border-bottom: 1px solid #e4e7ed;
}

:deep(.el-menu-item) {
    font-size: 14px;
    padding: 0 20px;
}

:deep(.el-menu-item.is-active) {
    color: #409eff;
    border-bottom: 2px solid #409eff;
}

/* 标题样式 */
.title {
    /* font-size: 24px;
    
    */
    font-weight: 600;
    color: #303133;
    margin: 0;
}
</style> 