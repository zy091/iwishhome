<template>
    <div class="training">
        <Breadbcrum :breadbcrum="breadbcrum" />
        <div class="training-title">
            <h1 class="title">{{ testName }}</h1>
        </div>
        <!-- <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect" :router="true">
            <el-menu-item :index="`/system/training/study-material-folder?platform=${platform}`">学习资料</el-menu-item>
            <el-menu-item :index="`/system/training/testing?platform=${platform}&chapter=${chapter}`" >学习测试</el-menu-item>
            <el-menu-item index="/system/training/learn-experience">学习心得</el-menu-item>
        </el-menu> -->
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
const testName = ref(route.query.testName || '测试')
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
            return 'Google'
        case 'facebook':
            return 'FaceBook'
        default:
            return 'Google'
    }
})



const breadbcrum = reactive([
    {
        name: `${platformName.value}培训过程考核`,
        path: `/system/optimize?platform=${platform.value}`
    },
    {
        name: `${platformName.value}考试内容`,
        path: `/system/exam-content?platform=${platform.value}`
    },
    {
        name: `${testName.value}`,
        path: ''
    },
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