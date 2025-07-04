<template>
    <div class="daily-work">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="daily-work-title">
            <h1 class="title">日常作业</h1>
        </div>
        <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect" :router="true">
            <el-menu-item index="/system/daily-work/personal-assignments">我的作业</el-menu-item>
            <el-menu-item index="/system/daily-work/self-assignment">自行添加</el-menu-item>
        </el-menu>
        <div class="daily-work-content">
            <RouterView></RouterView>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref ,onMounted,reactive,watch,computed} from 'vue'
import { useRoute } from 'vue-router'

import Breadbcrum from '@/components/system/Breadcrumb.vue'

const route = useRoute()
const activeIndex = ref('/system/daily-work/personal-assignments')

onMounted(() => {
    activeIndex.value = route.path
})

const handleSelect = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}

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
const breadbcrum = reactive([
    {
        name: `${platformName.value}优化`,
        path: `/system/optimize?platform=${platform.value}`
    },
    {
        name: '日常作业',
        path: '/system/daily-work/self-assignment'
    }
])
</script>

<style scoped>
.daily-work {
    padding: 10px 0;
    & .daily-work-title {
        margin: 20px 0;
    }
}
</style>
