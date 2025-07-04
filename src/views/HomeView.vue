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
      <div class="logo"><img src="../assets/home-image/logo white.png" width="auto" height="80px" alt=""></div>
      <div class="hero-content">
        <h1 class="hero-title" style="    margin: 0;">专注品牌独立站</h1>
        <h2 class="hero-subtitle">出海运营服务</h2>
        <p class="hero-description">专注帮助出海品牌实现品效合一的高效增长</p>
      </div>
    </div>

    <!-- Services Section -->
    <div class="services">
      <h2 class="section-title">
        <div class="en">SERVICES</div>
        <div class="cn">我们的服务</div>
      </h2>

      <el-row :gutter="30">
        <el-col :span="12" v-for="(service, index) in services" :key="index">
          <el-card class="service-card">
            <div class="service-icon">
              <img :src="service.icon" alt="" width="100%">
            </div>
            <div class="service-text">
              <h3 style="margin-bottom: 20px;">{{ service.title }}</h3>
              <p style="margin-bottom: 20px;max-width: 350px;">{{ service.description }}</p>
              <el-button style="background-color: #00367C;border: none;" type="primary"><el-link :href="service.link" target="_blank" style="color: #fff;">查看详情</el-link></el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Contact Section -->
    <div class="contact">
      <div class="contact-content">
        <h2>深入了解艾维<br>专注品牌独立站出海运营服务</h2>
        <el-button style="background-color: #fff;border: none;padding: 20px;border-radius: 0;color: #00367C;" type="primary">联系我们 →</el-button>
      </div>
    </div>
    <!-- Footer -->
    <el-footer class="footer">
      <div class="footer-content">
        <div class="footer-grid">
          <div class="footer-column" style="min-width: 400px;">
            <img src="../assets/home-image/logo2.png" alt="IWISH" class="footer-logo" style="margin-bottom: 30px;" />
            <p>电话：13692204062</p>
            <p>邮箱：marketing@iwishweb.com</p>
            <p>友情链接：<a href="">谷歌SEO优化</a></p>
            <div class="social-icons">
              <a href="" ><img src="../assets/home-image/youtube.png" alt=""></a>
              <a href="" ><img src="../assets/home-image/facebook2.png" alt=""></a>
              <a href="" ><img src="../assets/home-image/tiktok.png" alt=""></a>
              <a href="" ><img src="../assets/home-image/zhihu.png" alt=""></a>
              <a href="" ><img src="../assets/home-image/bili.png" alt=""></a>
              <a href="" ><img src="../assets/home-image/xiaochengxu.png" alt=""></a>
              <a href="" ><img src="../assets/home-image/wechat.png" alt=""></a>
            </div>
          </div>

          <div class="footer-column">
            <h3>艾维服务</h3>
            <ul>
              <li><a href="#">内容运营服务</a></li>
              <li><a href="#">流量运营服务</a></li>
              <li><a href="#">网站运营服务</a></li>
              <li><a href="#">品牌塑造服务</a></li>
            </ul>
          </div>

          <div class="footer-column">
            <h3>知识分享</h3>
            <ul>
              <li><a href="#">网站SEO</a></li>
              <li><a href="#">网站建设</a></li>
              <li><a href="#">内容营销</a></li>
              <li><a href="#">沙龙讲座</a></li>
              <li><a href="#">公司案例</a></li>
            </ul>
          </div>

          <div class="footer-column">
            <h3>关于我们</h3>
            <ul>
              <li><a href="#">公司简介</a></li>
              <li><a href="#">最新动态</a></li>
            </ul>
          </div>

          <div class="footer-column">
            <h3>添加客服</h3>
            <div class="qr-code">
              <!-- QR Code image -->
              <img src="../assets/home-image/scan.png" alt="QR Code" />
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>深圳艾维品牌营销有限公司 © Copyright 2024 All Rights Reserved. 粤ICP备19019201号-1</p>
        </div>
      </div>
    </el-footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const services = ref([
  {
    title: '员工培训',
    icon: '/src/assets/home-image/training.png',
    link:'/system/training',
    description: '提供完整解决方案，主站化营销、资源整合等，为企业提供全球化市场拓展的全程解决方案'
  },
  {
    title: '客户资料',
    icon: '/src/assets/home-image/file.png',
    link:'/system/training',
    description: '提供完整解决方案，主站化营销、资源整合等，为企业提供全球化市场拓展的全程解决方案'
  },
  {
    title: 'google学习',
    icon: '/src/assets/home-image/google.png',
    link:'/system/training',
    description: '提供完整解决方案，主站化营销、资源整合等，为企业提供全球化市场拓展的全程解决方案'
  },
  {
    title: 'Facebook学习',
    icon: '/src/assets/home-image/facebook.png',
    link:'/system/training',
    description: '提供完整解决方案，主站化营销、资源整合等，为企业提供全球化市场拓展的全程解决方案'
  }
])
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
  height: 1000px;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 10%;
  position: relative;
  background-image: url(../assets/home-image/banner.png);
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


:deep(.el-button) {
  padding: 12px 24px;
  border-radius: 4px;
}

:deep(.el-card) {
  transition: all 0.3s;
}

:deep(.el-card:hover) {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.footer {
  background: #fff;
  padding: 60px 0 20px;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px 30px;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 30px;
  margin-bottom: 40px;
}
.footer-column p {
  margin-bottom: 10px;
}
.footer-column h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: #00367C;
}

.footer-column ul {
  list-style: none;
  padding: 0;
}

.footer-column ul li {
  margin-bottom: 10px;
  color: #666;
  cursor: pointer;
}

.footer-column ul li a:hover {
  color: #1E88E5;
}

.social-icons {
  display: flex;
  gap: 5px;
  margin-top: 20px;
}

.qr-code img {
  width: 120px;
  margin-bottom: 15px;
}

.contact-buttons p {
  margin-bottom: 10px;
  color: #666;
  cursor: pointer;
}

.footer-bottom {
  border-top: 1px solid #ddd;
  padding-top: 20px;
  text-align: center;
  color: #999;
}
</style>