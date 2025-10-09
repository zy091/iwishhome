<template>
    <template v-for="adsForm in adsFormList" :key="adsForm.id">
    <div class="search-ads" v-if="adsForm.adsform === adsFormName">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="search-ads-title">
            <h1 class="title">{{ adsForm.title }}</h1>
        </div>
        <el-tabs v-model="activeTab" class="demo-tabs">
            <el-tab-pane v-for="tab in adsForm.tabs" :label="tab.label" :name="tab.name" :key="tab.name"></el-tab-pane>
        </el-tabs>
        <div class="search-ads-content">
            <!-- Content will be displayed based on activeTab -->
            <template v-for="tab in adsForm.tabs" :key="tab.name">
                <div v-if="activeTab === tab.name">
                    <WordDocumentViewer 
                        :document-url="tab.document_url"
                        :title="tab.label"
                        :show-back-button="false"
                        :show-download-button="false"
                    />
                </div>
            </template>
        </div>
    </div>
    </template>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import Breadcrumb from '@/components/system/Breadcrumb.vue'
import WordDocumentViewer from '@/components/WordDocumentViewer.vue'

interface Props {
  adsForm?: string
}

const route = useRoute()
const adsFormName = computed(() => {
  // 使用query参数
  const val = route.query.adsForm
  if (Array.isArray(val)) {
    return val[0]
  }
  return val
})
console.log(adsFormName.value,'adsFormName')
const activeTab = ref('principle')
const loading = ref(false)
const adsFormList = ref<any[]>([])
const breadcrumb = ref<any[]>([])

// 获取广告形式和课程数据
const fetchAdsData = async () => {
  loading.value = true
  try {
    // 获取所有广告形式及其对应的课程
    const { data: adFormats, error: formatsError } = await supabase
      .from('ad_formats')
      .select('*')
      .order('created_at', { ascending: false })

    if (formatsError) throw formatsError

    // 获取所有广告课程
    const { data: adCourses, error: coursesError } = await supabase
      .from('ad_courses')
      .select('*')
      .order('created_at', { ascending:  true })

    if (coursesError) throw coursesError

    // 组合数据：每个广告形式对应其课程
    adsFormList.value = adFormats.map(format => ({
      id: format.id,
      title: format.title,
      adsform: format.adsform,
      tabs: adCourses
        .filter(course => course.ad_format_id === format.id)
        .map(course => ({
          id: course.id,
          label: course.label,
          name: course.name,
          document_url: course.document_url
        }))
    }))
    console.log(adsFormList.value,'adsFormList')

    // 动态设置面包屑
    updateBreadcrumb()
    
    // 设置默认激活的tab
    setDefaultActiveTab()

  } catch (error: any) {
    console.error('获取广告数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 动态更新面包屑
const updateBreadcrumb = () => {
  const currentAdsForm = adsFormList.value.find(form => form.adsform === adsFormName.value)
  
  if (currentAdsForm) {
    breadcrumb.value = [
      {
        name: 'Google广告形式学习',
        path: '/system/google-ads'
      },
      {
        name: currentAdsForm.title,
        path: `/system/google-search-ads?adsForm=${currentAdsForm.adsform}`
      }
    ]
  } else {
    // 默认面包屑
    breadcrumb.value = [
      {
        name: 'Google广告形式学习',
        path: '/system/google-ads'
      },
      {
        name: '广告学习',
        path: '/system/google-search-ads'
      }
    ]
  }
}

// 设置默认激活的tab
const setDefaultActiveTab = () => {
  const currentAdsForm = adsFormList.value.find(form => form.adsform === adsFormName.value)
  if (currentAdsForm && currentAdsForm.tabs.length > 0) {
    activeTab.value = currentAdsForm.tabs[0].name
  }
}

// 监听adsFormName变化，动态更新面包屑和内容
watch(adsFormName, () => {
  updateBreadcrumb()
  setDefaultActiveTab()
})

onMounted(() => {
  fetchAdsData()
})
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
        padding: 20px;
    }
}

.demo-tabs {
    margin-bottom: 20px;
}

/* Remove the default bottom border from the header to avoid double lines */
:deep(.demo-tabs .el-tabs__header) {
    border-bottom: none;
    margin: 0;
}

/* Style the nav-wrap to have the full-width bottom border */
:deep(.demo-tabs .el-tabs__nav-wrap) {
    border-bottom: 1px solid #e4e7ed;
}

/* Remove the default transition on the nav-wrap border */
:deep(.demo-tabs .el-tabs__nav-wrap::after) {
    display: none;
}

/* Style each tab item for consistent height and padding */
:deep(.demo-tabs .el-tabs__item) {
    height: 48px;
    line-height: 48px;
    padding: 0 15px !important;
    font-size: 16px;
}

/* Style the active tab specifically */
:deep(.demo-tabs .el-tabs__item.is-active) {
    color: var(--el-color-primary);
    background-color: #ecf5ff; /* Light blue background */
}

/* Style the active tab indicator bar */
:deep(.demo-tabs .el-tabs__active-bar) {
    height: 3px;
    background-color: var(--el-color-primary);
}
</style>