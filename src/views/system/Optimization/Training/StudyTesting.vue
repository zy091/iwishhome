<template>
    <div class="testing">
        <el-card class="testing-search" style="margin-bottom: 20px;">
            <el-space wrap alignment="start" :size="30">

                <el-select v-model="value" placeholder="选择题型" size="large" style="width: 240px">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>

                <el-input v-model="input" style="width: 240px" placeholder=" 请输入内容" suffix-icon="Search" size="large" />

                <el-button type="primary" size="large">搜索</el-button>

            </el-space>
        </el-card>
        <el-card v-if="true" style="min-height: 400px;">
            <el-row :gutter="40" style="row-gap: 30px;">
                <el-col :xs="12" :sm="8" :md="6" :lg="4">
                    <div class="grid-content-column">
                        <el-image style="width: 120px; height: 120px;" :src="iconList[0].src" fit="fill"  :class="`testing-content-${iconList[0].icon}`" />
                        <RouterLink :to="{name:'multiple-choice'}">
                        </RouterLink>
                            <div class="testing-content-title hide-text-2">选择题</div>
                    </div>
                </el-col>
                <el-col :xs="12" :sm="8" :md="6" :lg="4">
                    <div class="grid-content-column ">
                        <el-image style="width: 120px; height: 120px"
                        :src="iconList[1].src" fit="fill" />
                        <RouterLink :to="{name:'case-study'}">
                        </RouterLink>
                        <div class="testing-content-title">案例分析题</div>
                    </div>
                </el-col>
                <el-col :xs="12" :sm="8" :md="6" :lg="4">
                    <div class="grid-content-column ">
                        <el-image style="width: 120px; height: 120px"
                            :src="iconList[2].src" fit="fill" />
                        <div class="testing-content-title">标题</div>
                    </div>
                </el-col>

            </el-row>
        </el-card>
        <el-empty v-else description="暂无数据" />

    </div>
</template>

<script setup lang="ts">
import Pagination from '@/components/system/Pagination.vue'
import { ref } from 'vue'
const input = ref('')
const value = ref('')
const options = [
    {
        value: 'image',
        label: '图片',
    },
    {
        value: 'video',
        label: '视频    ',
    },
    {
        value: 'document',
        label: '文档',
    },
    {
        value: 'pdf',
        label: 'PDF',
    },
    {
        value: 'other',
        label: '其他',
    }
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
    { icon: 'select', label: '选择题', src: getIconUrl('select') },
    { icon: 'reading', label: '案例分析', src: getIconUrl('reading') },
    { icon: 'reading', label: '案例分析', src: getIconUrl('reading') },
];

</script>

<style scoped>
.testing-search {
    margin: 30px 0 10px;
}

.testing-content {
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
.grid-content-column:hover .testing-content-title {
    color: #46a2ff;
}
.testing-content-title {
    font-size: 14px;
    margin: 5px 0 0;
    padding: 0 5px;
    line-height: 1.2;
}


</style>