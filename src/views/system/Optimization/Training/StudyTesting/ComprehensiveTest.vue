<template>
    <el-card style="min-height: 400px;margin-top: 30px;padding:0 20px;">
        <el-page-header @back="goBack" :icon="ArrowLeft">
            <template #content>
                <span class="text-large font-600 mr-3"> 综合测验 </span>
            </template>
            <div class="subtitle">共{{ questions.length }}道题目，包含选择题和案例分析题，满分100分。</div>
        </el-page-header>
        
        <DynamicForm  
            :questions="questions" 
            :testId="testId" 
            :testName="testName" 
            type="comprehensive"
            @submitAnswers="submitAnswers" 
        />
    </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router';
import DynamicForm from '@/components/system/DynamicForm.vue';
import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'
import { testResultService } from '@/stores/testResultService'

const questions = ref<{ id: number; text: string; options: string[]; correct_answer: string; question_type: string; platform: string; chapter: string }[]>([]);

//接收路由参数
const route = useRoute();
const router = useRouter();

const testId = ref(route.query.testId?.toString() || 'comprehensive-test'); 
const testName = ref(route.query.testName?.toString() || '未命名测试'); 
const platform = ref(route.query.platform?.toString()); 
const chapter = ref(route.query.chapter?.toString()); 

const goBack = () => {
    router.back();
}

const fetchQuestions = async () => {
    const { data, error } = await supabase
        .rpc('get_comprehensive_questions', {
            p_platform: platform.value,
            p_chapter: chapter.value
        });

    if (error) {
        ElMessage.error(`获取问题时出错:${error}, 请检查网络连接或联系管理员`);
    } else {
        questions.value = data;
        console.log(questions.value);
    }
};

onMounted(() => {
    fetchQuestions();
});

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
};
</script>

<style scoped></style> 