<template>
  <div class="home">
    <!-- Header -->
    <el-header class="header">
      <div class="header-icon"><img src="../assets/home-image/element1.png" width="auto" height="40px" alt=""></div>
      <div class="header-content">

        <div class="contact-info">
          <span style="    margin-right: 50px;">Tel: 13692204062</span>
          <span>Email: marketing@iwishweb.com</span>
        </div>
        <div class="header-subtitle">
          <span>专注中国品牌出海运营服务</span>
        </div>
      </div>
    </el-header>
    <!-- Hero Section -->
    <div class="hero">
      <!-- <div class="logo"><img src="../assets/home-image/logo white.png" width="auto" height="80px" alt=""></div>
      <div class="hero-content">
        <h1 class="hero-title" style="    margin: 0;">专注品牌独立站</h1>
        <h2 class="hero-subtitle">出海运营服务</h2>
        <p class="hero-description">专注帮助出海品牌实现品效合一的高效增长</p>
      </div> -->
    </div>

    <!-- Services Section -->
    <div class="services">
      <h2 class="section-title">
        <div class="en">TRAINING SYSTEM</div>
        <div class="cn">培训体系</div>
      </h2>

      <el-row :gutter="30">
        <template v-for="(service, index) in services" :key="index">
        <el-col :span="12"  >
          <el-card class="service-card">
            <div class="service-icon">
              <img :src="service.icon" alt="" width="100%">
            </div>
            <div class="service-text">
              <h3 style="margin-bottom: 20px;">{{ service.title }}</h3>
              <p style="margin-bottom: 20px;max-width: 350px;">{{ service.description }}</p>
              <el-link :href="service.link" @click="setCategory(service.category)" >查看详情</el-link>
            </div>
          </el-card>
        </el-col>
        </template>
      </el-row>
    </div>

    <!-- Footer -->
    <Footer></Footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
//引入Footer文件
import Footer from '@/components/Footer.vue'
// 导入图片
import trainingImg from '@/assets/home-image/training.png'
import fileImg from '@/assets/home-image/file.png'
import googleImg from '@/assets/home-image/google.png'
import facebookImg from '@/assets/home-image/facebook.png'

// 获取用户 store
const userStore = useUserStore()

// 定义角色ID常量（根据您提供的表格）
const ROLE_IDS = {
  ADMIN: 0,                    // 管理员
  OPERATIONS_MANAGER: 1,       // 运营管理员
  PROJECT_MANAGER: 11,         // 项目经理
  GOOGLE_OPTIMIZER: 12,        // 谷歌优化师
  META_OPTIMIZER: 14,          // Facebook/Meta优化师
  TEACHER: 15,                 // 带教
  CRITEO_OPTIMIZER: 17         // Criteo优化师
}

// 所有服务卡片
const allServices = ref([
  {
    title: '致员工的一封信',
    icon: trainingImg,
    link:'/system/training-letter',
    description: '',
    category:'',
    roleIds: [] // 空数组表示所有用户可见
  },
  {
    title: '行业知识&网站分析',
    icon: fileImg,
    link:'/system/training-marketing',
    description: '',
    category:'',
    roleIds: [] // 空数组表示所有用户可见
  },
  {
    title: 'Google广告',
    icon: googleImg,
    link:'/system/',
    description: '',
    category:'google',
    roleIds: [
      ROLE_IDS.ADMIN,
      ROLE_IDS.OPERATIONS_MANAGER,
      ROLE_IDS.PROJECT_MANAGER,
      ROLE_IDS.TEACHER,
      ROLE_IDS.GOOGLE_OPTIMIZER
    ]
  },
  {
    title: 'Meta广告',
    icon: facebookImg,
    link:'/system/',
    description: '',
    category:'meta',
    roleIds: [
      ROLE_IDS.ADMIN,
      ROLE_IDS.OPERATIONS_MANAGER,
      ROLE_IDS.PROJECT_MANAGER,
      ROLE_IDS.TEACHER,
      ROLE_IDS.META_OPTIMIZER
    ]
  },
  {
    title: 'Criteo广告',
    icon: facebookImg,
    link:'/system/',
    description: '',
    category:'criteo',
    roleIds: [
      ROLE_IDS.ADMIN,
      ROLE_IDS.OPERATIONS_MANAGER,
      ROLE_IDS.PROJECT_MANAGER,
      ROLE_IDS.TEACHER,
      ROLE_IDS.CRITEO_OPTIMIZER
    ]
  },
  {
    title: '管理员入口',
    icon: facebookImg,
    link:'/system/',
    description: '',
    category:'admin',
    roleIds: [
      ROLE_IDS.ADMIN,
      ROLE_IDS.OPERATIONS_MANAGER,
      ROLE_IDS.PROJECT_MANAGER,
      ROLE_IDS.TEACHER
    ]
  },
])

// 计算属性：根据用户角色过滤服务
const services = computed(() => {
  const userRoleId = userStore.roleId
  
  return allServices.value.filter(service => {
    // 如果 roleIds 为空数组，表示所有用户可见
    if (service.roleIds.length === 0) {
      return true
    }
    // 检查用户角色是否在允许的角色列表中
    return userRoleId !== null && service.roleIds.includes(Number(userRoleId))
  })
})

const setCategory=(category:string)=>{
  localStorage.setItem('category',category)
}

// 组件挂载时加载用户角色
onMounted(() => {
  userStore.loadRoleId()
})
</script>

<style scoped>
.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* position: fixed; */
  width: 100%;
  height: 40px;
  padding: 0;
  /* top: 0;
  z-index: 1000; */
  position: relative;
  font-size: 12px;
}

.header-icon {
  position: absolute;
  height: 40px;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: #00367C;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 69%;
    width: 30px;
    height: 40px;
    background-color: #0047A2;
    z-index: -1;
  }
}

.header-content {
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;

  & .contact-info {
    background-color: #00367C;
  }

  & .header-subtitle {
    background-color: #0047A2;
  }
}

.header-content>div {
  width: 50%;
  height: 100%;
  text-align: center;
  color: white;
  line-height: 40px;
}

.home {
  width: 100%;
}

.hero {
  background: linear-gradient(135deg, #0046BE 0%, #1E88E5 100%);
  height: 250px;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 10%;
  position: relative;
  background-image: url(../assets/home-image/output.png);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.logo img {
  width: 165px;
  /* height: 40px; */
  position: absolute;
  top: 5%;
  left: 10%;
}

.hero-content {
  max-width: 600px;
}

.hero-title {
  font-size: 58px;
  margin-bottom: 20px;
}

.hero-subtitle {
  font-size: 58px;
  margin-bottom: 20px;
}

.hero-description {
  font-size: 18px;
  opacity: 0.8;
}

.services {
  padding: 80px 10%;
  background-color: #F5F7FA;
}

.section-title {
  text-align: center;
  margin-bottom: 60px;
}

.section-title .en {
  color: #00367C;
  font-size: 24px;
  margin-bottom: 10px;
  font-weight: 700;
}

.section-title .cn {
  color: #333;
  font-size: 42px;
  font-weight: 700;
}

.service-card {
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient( 134deg, #F3F5F8 0%, #FEFEFE 100%);
box-shadow: 0px 0px 18px 1px rgba(188,197,214,0.16);
border: 2px solid #FFFFFF;
}
:deep(.el-card__body)  {
  display: flex;
  gap: 45px;
}

.service-icon {
  width: 66px;
  height: 66px;
  margin-bottom: 20px;
}

.contact {
  background: linear-gradient(135deg, #003399 0%, #0066CC 100%);
  background-image: url(../assets/home-image/bg3.png);
  padding: 60px 10%;
  color: white;
  text-align: center;
}
.contact-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  text-align: left;
}
.contact-content h2 {
  font-size: 32px;
  margin-bottom: 20px;
}


:deep(.el-link) {
  padding: 6px 12px;
  border-radius: 4px;
  text-decoration: none;
  color: #fff;background-color: #00367C;border: none;
}
:deep(.el-link:hover) {
  background-color: #004db1;
  text-decoration: none;
  border: none;
}

:deep(.el-card) {
  transition: all 0.3s;
}

:deep(.el-card:hover) {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}


</style>