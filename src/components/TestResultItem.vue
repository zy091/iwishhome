<template>
  <div class="test-result-item" @click="onClick">
    <div class="test-info">
      <h3 class="test-title">{{ testTitle }}</h3>
      <div class="test-details">
        <div class="date">
          <el-icon><Calendar /></el-icon>
          <span>{{ formatDate(testResult.submitted_at) }}</span>
        </div>
      </div>
    </div>
    
    <div class="test-score">
      <div class="score-value" :class="getScoreClass(testResult.score)">
        {{ testResult.score }}
      </div>
      <div class="score-label">分数</div>
      <el-tag 
        class="status-tag" 
        :type="testResult.is_passed ? 'success' : 'danger'"
      >
        {{ testResult.is_passed ? '通过' : '未通过' }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Calendar } from '@element-plus/icons-vue';
import type { TestResult } from '@/stores/testResultService';

const props = defineProps<{
  testResult: TestResult;
  testTitle?: string;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

// 计算属性：测试标题
const testTitle = computed(() => {
  return props.testTitle || `测试 #${props.testResult.test_id.substring(0, 8)}`;
});

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取分数样式类
const getScoreClass = (score: number) => {
  if (score >= 80) return 'high-score';
  if (score >= 60) return 'medium-score';
  return 'low-score';
};

// 点击事件
const onClick = () => {
  emit('click');
};
</script>

<style scoped>
.test-result-item {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
  transition: all 0.3s;
  cursor: pointer;
}

.test-result-item:hover {
  box-shadow: 0 4px 15px 0 rgba(0, 0, 0, 0.15);
  transform: translateY(-3px);
}

.test-info {
  flex: 1;
}

.test-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
}

.test-details {
  display: flex;
  color: #909399;
  font-size: 14px;
}

.date {
  display: flex;
  align-items: center;
  gap: 5px;
}

.test-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}

.score-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}

.high-score {
  color: #67c23a;
}

.medium-score {
  color: #e6a23c;
}

.low-score {
  color: #f56c6c;
}

.score-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.status-tag {
  font-size: 12px;
}
</style> 