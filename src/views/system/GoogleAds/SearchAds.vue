<template>
    <div class="search-ads">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="search-ads-title">
            <h1 class="title">搜索广告学习指南</h1>
            <p class="subtitle">全面掌握Google搜索广告的核心知识与实践技能</p>
        </div>
        <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect" :router="true">
            <el-menu-item index="/system/google-search-ads/principle">搜索广告原理</el-menu-item>
            <el-menu-item index="/system/google-search-ads/core-elements">搜索广告核心要素</el-menu-item>
            <el-menu-item index="/system/google-search-ads/bidding-strategy">搜索广告出价策略</el-menu-item>
            <el-menu-item index="/system/google-search-ads/creation">搜索广告的创建</el-menu-item>
            <el-menu-item index="/system/google-search-ads/optimization">搜索广告数据分析与优化</el-menu-item>
        </el-menu>
        <div class="search-ads-content">
            <RouterView></RouterView>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumb from '@/components/system/Breadcrumb.vue'

const route = useRoute()

const activeIndex = ref('/system/google-search-ads/principle')
onMounted(() => {
    activeIndex.value = route.path // 获取当前路由的路径
    console.log(activeIndex.value)
})

const handleSelect = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}

const breadcrumb = reactive([
    {
        name: 'Google广告形式学习',
        path: '/system/google-ads'
    },
    {
        name: '搜索广告',
        path: '/system/google-search-ads'
    }
])
</script>

<style scoped>
.search-ads {
    padding: 10px 0;
    
    .search-ads-title {
        margin: 20px 0;
        /* text-align: center; */
        
        .title {
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
        }
        
        .subtitle {
            color: #64748b;
            font-size: 1rem;
            margin: 0;
        }
    }
    
    .search-ads-content {
        margin-top: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        min-height: 500px;
    }
}

.el-menu-demo {
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: 20px;
}
</style>