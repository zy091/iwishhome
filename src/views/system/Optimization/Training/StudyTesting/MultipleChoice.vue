<template>
    <el-card style="min-height: 400px;margin-top: 30px;padding:0 20px;">
        <el-page-header @back="goBack" :icon="ArrowLeft">
            <template #content>
                <span class="text-large font-600 mr-3"> 选择题 </span>
            </template>
            <div class="subtitle">共{{ questions.length }}道选择题，每题{{ parseFloat((score_weight/questions.length).toFixed(2)) }}分，满分{{  score_weight}}分。</div>
        </el-page-header>
        
        <DynamicForm :scoreWeight="score_weight" :questions="questions" :testId="testId" :testName="testName" :type="type" @submitAnswers="submitAnswers" />
        <ScoreDialog :Score="Score" :centerDialogVisible="centerDialogVisible" :incorrectAnswers="incorrectAnswers"
        @update:centerDialogVisible="(value) => centerDialogVisible = value" />
    </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router';
import DynamicForm from '@/components/system/DynamicForm.vue';
import ScoreDialog from '@/components/system/ScoreDialog.vue';
import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'
import { testResultService } from '@/stores/testResultService'

const questions = ref<{ id: number;is_multiple: boolean;text: string; options: string[]; correct_answer: string; question_type: string; platform: string; chapter: string }[]>([]); // Update type definition

//接收路由参数
const route = useRoute();
const router = useRouter();

const testId = ref(route.query.testId?.toString() || 'multiple-choice-test'); 
const testName = ref(route.query.testName?.toString() || '未命名测试'); 
const type = ref(route.query.type?.toString() || 'select'); // 添加默认值 'select'
const score_weight = ref( route.query.score_weight ? Number(route.query.score_weight) : 100); // 添加默认值 '1'
const goBack = () => {
    router.back();
}

const fetchQuestions = async () => {
    const { data, error } = await supabase
        .from('googlequestions')
        .select('*')
        .eq('tests_id', testId.value);

    if (error) {
        ElMessage.error(`获取问题时出错:${error.message}, 请检查网络连接或联系管理员`);
    } else {
        questions.value = data || [];
        console.log('获取到的题目:', questions.value);
    }
};

onMounted(() => {
    fetchQuestions();
});
//弹窗事件
const Score = ref(0)
const centerDialogVisible = ref(false)
const incorrectAnswers = ref<{ questionIndex: string; questionId: number; userAnswer: string; correctAnswer: string }[]>([]); // 用于存储错误答案

const submitAnswers = async (data: { 
    answers: Record<number, string>;
    score: number;
    incorrectAnswers: Array<{
        questionIndex: string;
        questionId: number;
        userAnswer: string;
        correctAnswer: string;
    }>;
}) => {
    console.log('用户答案:', data.answers);
    //计算分数
    Score.value = data.score;
    //清空incorrectAnswers
    incorrectAnswers.value = data.incorrectAnswers;
    //将centerDialogVisible的结果改为true
    centerDialogVisible.value = true;
    console.log('得分:', Score.value, centerDialogVisible.value, incorrectAnswers.value);
};

</script>

<style scoped>

.el-form-item__label-wrap {
    width: 100%;
}
.el-form-item__label {
    flex:1 !important;
}
</style>