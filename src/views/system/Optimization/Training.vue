<template>
    <div class="training">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="training-title">
            <h1 class="title">{{ platformName }}优化{{ levelName }}学习</h1>
        </div>
        <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect" :router="true">
            <!-- <el-menu-item :index="`/system/training/study-materials?platform=${platform}&chapter=${chapter}`">学习资料</el-menu-item> -->
            <el-menu-item :index="`/system/training/study-material-folder?platform=${platform}`">学习资料</el-menu-item>
            <el-menu-item :index="`/system/training/testing?platform=${platform}&chapter=${chapter}`" >学习测试</el-menu-item>
            <el-menu-item index="/system/training/learn-experience">学习心得</el-menu-item>
        </el-menu>
        <div class="training-content" >
            <RouterView></RouterView>
            
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref ,onMounted,reactive,watch,computed} from 'vue'
import { useRoute } from 'vue-router'
import Breadbcrum from '@/components/system/Breadcrumb.vue'

//activeIndex的值需要和路由的path对应，首次进入获取路由的path，然后赋值给activeIndex
const route = useRoute()
const platform = ref(route.query.platform || 'google')
const chapter = ref(route.query.chapter || 'base')
//监听路由参数的变化
watch(() => route.query.platform, (newPlatform) => {
    platform.value = newPlatform || 'google'
}, { immediate: true })
watch(() => route.query.chapter, (newchapter) => {
    chapter.value = newchapter || 'base'
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

const levelName = computed(() => {
    switch(chapter.value){
        case 'base':
            return '基础'
        case 'middle':
            return '中级'
        case 'advanced':
            return '高级'
        default:
            return '基础'
    }
})


const activeIndex = ref('/system/training/study-materials')
onMounted(() => {
    activeIndex.value = route.path // 获取当前路由的路径
    console.log(activeIndex.value)
})

const handleSelect = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
const breadbcrum = reactive([
    {
        name: `${platformName.value}优化`,
        path: `/system/optimize?platform=${platform.value}`
    },
    {
        name: `${platformName.value}培训学习`,
        path: `/system/training-and-learning?platform=${platform.value}`
    },
    {
        name: `${platformName.value}优化${levelName.value}学习`,
        path: '/system/training/study-materials'
    }
])
</script>

<style scoped>
.training {
    padding: 10px 0;
    & .training-title {
        margin: 20px 0;
    }
}
</style>