<template>
  <div class="error-page">
    <div class="error-content">
      <h1>403</h1>
      <h2>Forbidden</h2>
      <p>Sorry, you don't have permission to access this page.</p>
      <el-button type="primary" @click="$router.push('/')">Back to Home</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// No additional setup needed
</script>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.error-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 72px;
  color: #409EFF;
  margin: 0;
}

h2 {
  font-size: 24px;
  color: #606266;
  margin: 20px 0;
}

p {
  color: #909399;
  margin-bottom: 30px;
}
</style>
