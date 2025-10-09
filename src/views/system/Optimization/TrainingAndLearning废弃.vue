<template>
    <div class="layout">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="layout-title">
            <h1 class="title">考试内容---------------待重新开发</h1>
        </div>

        <div class="training-content test-grid">
            <RouterLink :to="{ name: 'study-material-folder', query: { platform: platform, chapter: 'base' } }">
                <el-card style="width: 480px" shadow="hover">
                    <el-image style="width: 50px; height: 50px" :src="logo" fit="fill" />
                    <h3><el-image style="width: 90px; height: auto ;display: flex;" :src="title" fit="fill" />优化
                        <el-text type="primary">基础</el-text>
                        学习
                    </h3>
                </el-card>
            </RouterLink>
            <RouterLink :to="{ name: 'study-material-folder', query: { platform: platform, chapter: 'middle' } }">
                <el-card style="width: 480px" shadow="hover">
                    <el-image style="width: 50px; height: 50px" :src="logo" fit="fill" />
                    <h3><el-image style="width: 90px; height: auto ;display: flex;" :src="title" fit="fill" />优化
                        <el-text class="mx-1" type="success">中级</el-text>
                        学习
                    </h3>
                </el-card>
            </RouterLink>
            <RouterLink :to="{ name: 'study-material-folder', query: { platform: platform, chapter: 'advanced' } }">
                <el-card style="width: 480px" shadow="hover">
                    <el-image style="width: 50px; height: 50px" :src="logo" fit="fill" />
                    <h3><el-image style="width: 90px; height: auto ;display: flex;" :src="title" fit="fill" />优化
                        <el-text type="warning">高级</el-text>
                        学习
                    </h3>
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
        path: '/system/optimize?platform='+platform.value
    },
    {
        name: '培训学习',
        path: '/system/exam-content'
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

:deep(.el-card__body) h3 {
    margin-top: 20px;
    display: flex;
    align-items: center;
}

:deep(.el-text) {
    font-size: 20px;
    font-weight: bold;
}
</style>