<template>
    <div class="layout">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="layout-title">
            <h1 class="title">{{platformName}}培训过程考核</h1>
        </div>

        <div class="training-content test-grid">
            <RouterLink :to="{ name: 'exam-content', query: { platform: platform } }">
                <el-card style="width: 480px" shadow="hover">
                    <el-image style="width: 50px; height: 50px" :src="logo" fit="fill" />
                    <h2>考试内容
                    </h2>
                </el-card>
            </RouterLink>
            <RouterLink :to="{ name: 'personal-assignments', query: { platform: platform } }">
                <el-card style="width: 480px" shadow="hover">
                    <el-image style="width: 50px; height: 50px" :src="logo" fit="fill" />
                    <h2>日常作业
                    </h2>
                </el-card>
            </RouterLink>
            <RouterLink :to="{ name: 'study-notes', query: { platform: platform } }">
                <el-card style="width: 480px" shadow="hover">
                    <el-image style="width: 50px; height: 50px" :src="logo" fit="fill" />
                    <h2>学习心得
                    </h2>
                </el-card>
            </RouterLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import Breadcrumb from '@/components/system/Breadcrumb.vue'
import { useRoute } from 'vue-router'
//获取路由参数/exam-content?platform=google
const route = useRoute()
const platform = ref(route.query.platform || 'google')
//监听路由参数的变化
watch(() => route.query.platform, (newPlatform) => {
    platform.value = newPlatform || 'google'
}, { immediate: true })
const platformName = computed(() => {
    switch(platform.value){
        case 'google':
            return 'Google'
        case 'facebook':
            return 'FaceBook'
        default:
            return 'Google'
    }
})
const breadcrumb = reactive([
    {
        name: `${platformName.value}培训过程考核`,
        path: '/system/optimize?platform='+platform.value
    }
])

// 导入图片
import googleLogoImg from '@/assets/logo/google-logo.png'
import facebookLogoImg from '@/assets/logo/Facebook-logo.png'
import googleTitleImg from '@/assets/logo/google-title-red.png'
import facebookTitleImg from '@/assets/logo/Facebook-title.png'

const googleLogo = ref(googleLogoImg)
const facebookLogo = ref(facebookLogoImg)
const googleTitle = ref(googleTitleImg)
const facebookTitle = ref(facebookTitleImg)

const logo = computed(() => {
    if (platform.value == 'google') {
        return googleLogo.value
    } else if (platform.value == 'facebook') {
        return facebookLogo.value
    }
    // 添加默认值
    return googleLogo.value
})
const title = computed(() => {
    if (platform.value == 'google') {
        return googleTitle.value || 'Google'
    } else if (platform.value == 'facebook') {
        return facebookTitle.value || 'FaceBook'
    }
    // 添加默认值
    return 'Google'
})
</script>

<style scoped>
.test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

:deep(.el-card__body) {
    padding: 40px;
    min-height: 200px;
}

:deep(.el-card__body) h2 {
    margin-top: 20px;
    display: flex;
    align-items: center;
    color: #333;
}

:deep(.el-text) {
    font-size: 20px;
    font-weight: bold;
}
</style>