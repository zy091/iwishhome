<template>
  <div class="common-layout">
    <el-container direction="vertical" style="height: 100vh;">
      <Header />
      <el-container style="margin-top: 84px;">
        <el-aside width="240px">
          <InstructorAside />
        </el-aside>
        <el-container>
          <el-main>
            <div class="page-container">
              <Suspense>
                <template #default>
                  <RouterView></RouterView>
                </template>
                <template #fallback>
                  <div class="loading-container">
                    <el-skeleton :rows="3" animated />
                  </div>
                </template>
              </Suspense>
            </div>
          </el-main>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/system/Header.vue'
import InstructorAside from './InstructorAside.vue'
</script>

<style scoped>
.loading-container {
  padding: 20px 0;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.page-container {
  min-height: calc(100vh - 84px);
}
.el-main {
      background: #f5f7fa;
}
</style>
