<template>
    <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item :to="{ path: '/system/' }">首页</el-breadcrumb-item>
        <template v-for="(bread, index) in breadbcrum" :key="index">
            <el-breadcrumb-item v-if="index === breadbcrum.length - 1">{{ bread.name }}</el-breadcrumb-item>
            <el-breadcrumb-item v-else >
                <RouterLink :to="bread.path">
                    {{ bread.name }}
                </RouterLink>
            </el-breadcrumb-item>
        </template>

    </el-breadcrumb>
</template>

<script lang="ts" setup>
import { ArrowRight } from '@element-plus/icons-vue'
import { RouterLink } from 'vue-router';

const props = defineProps<{
    breadbcrum: Array<{ name: string, path: string }>;
}>();
console.log(props.breadbcrum)
</script>
<style scoped>
.el-breadcrumb {
    font-size: 14px;
}
</style>