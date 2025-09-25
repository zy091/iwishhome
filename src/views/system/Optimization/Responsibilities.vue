<template>
    <div class="layout">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="layout-title">
            <h1 class="title">岗位职责</h1>
        </div>

        <div class="training-content">


        </div>
    </div>
</template>

<script setup lang="ts">
import Breadbcrum from '@/components/system/Breadcrumb.vue'
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
//获取路由参数/exam-content?platform=google
const route = useRoute()
const platform = ref(route.query.platform || 'google')
//监听路由参数的变化
watch(() => route.query.platform, (newPlatform) => {
    platform.value = newPlatform || 'google'
}, { immediate: true })
const platformName = computed(() => {
    switch (platform.value) {
        case 'google':
            return '谷歌'
        case 'facebook':
            return 'FaceBook'
        default:
            return '谷歌'
    }
})
const breadbcrum = reactive([
    {
        name: `${platformName.value}优化`,
        path: '/system/optimize?platform=' + platform.value
    },
    {
        name: '岗位职责',
        path: '/system/responsibilities'
    }
])



</script>

<style scoped></style>