<template>
    <el-form v-loading="!questions.length" element-loading-text="Loading..." :model="form" label-width="auto" style="width: 100%; max-width: 800px;">

        <el-form-item v-for="(question, index) in questions" :key="question.id"
            :label="question.question_type === 'reading' ? '' : `${index + 1}. ${question.text}`" label-position="left"
            style=" flex-direction: column;">
            <template v-if="question.question_type === 'select'">
                <el-radio-group v-model="userAnswers[question.id]">
                    //在option前面加个A. B. C. D. E.
                    <el-radio v-for="(option, i) in question.options" :key="i"
                        :value="`第${index + 1}题-${String.fromCharCode(65 + i)}.${option}`">{{ `${String.fromCharCode(65 +
                        i)}. ${option}`}}</el-radio>

                </el-radio-group>
            </template>

            <template v-else-if="question.question_type === 'judge'">
                <el-radio-group v-model="userAnswers[question.id]">
                    <el-radio value="是">是</el-radio>
                    <el-radio value="否">否</el-radio>
                </el-radio-group>
            </template>

            <template v-else-if="question.question_type === 'fill'">
                <el-input v-model="userAnswers[question.id]" placeholder="请填写答案" />
            </template>

            <template v-else-if="question.question_type === 'question'">
                <el-input v-model="userAnswers[question.id]" type="textarea" placeholder="请简要描述" />
            </template>

            <template v-else-if="question.question_type === 'reading'">
                <div class="reading-lable" style="margin-bottom: 20px;"><el-text class="mx-1" size="large"
                        style="line-height: 1;">{{ index + 1 }}. {{ question.text }}</el-text></div>
                <el-input v-model="userAnswers[question.id]" type="textarea" placeholder="请阅读并回答"
                    :autosize="{ minRows: 6, maxRows: 15 }" />
            </template>
        </el-form-item>

        <el-form-item label-position="left">
            <el-button style="margin-left: 0;margin-right: 50px;" type="primary" @click="submitAnswers" :disabled="showReAnswer">提交答案</el-button>
            <el-tooltip
                class="box-item"
                effect="dark"
                content="点击后将清空所有答案"
                placement="top-start"
            >
                <el-button  type="warning" plain v-show="showReAnswer"  @click="ReAnswer">重新作答</el-button>
            </el-tooltip>
            <!-- <el-button  type="danger" plain v-show="showReAnswer"  @click="submitAnswers">清空答案</el-button> -->
        </el-form-item>
        <el-empty v-if="!questions.length" description="暂无数据" />
    </el-form>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus'
import { testResultService, type TestResult, type TestAnswerDetail } from '@/stores/testResultService';
import { useUserStore } from '@/stores/user';
import { supabase } from '@/lib/supabaseClient';

const props = defineProps<{
    questions: { id: number; text: string; options: string[]; correct_answer: string; question_type: string; platform: string; chapter: string }[];
    testId: string; // 添加测试ID属性
    testName: string; // 添加测试名称属性
    type: string;
}>();

const emit = defineEmits<{
    (e: 'submitAnswers', data: { 
        answers: Record<number, string>;
        score: number;
        incorrectAnswers: Array<{
            questionIndex: string;
            questionId: number;
            userAnswer: string;
            correctAnswer: string;
        }>;
    }): void;
    (e: 'limitReached'): void;
}>();

const userAnswers = ref<Record<number, string>>({});
const form = ref({}); // {{ edit_1 }} Define the form object
const showReAnswer = ref(false);
const isSubmitting = ref(false);
const maxAttempts = 3; // 最大尝试次数限制

// 检查尝试次数
const checkAttemptCount = async () => {
    try {
        const userStore = useUserStore();
        const userId = userStore.user?.user_id;
        
        if (!userId) {
            throw new Error('用户未登录');
        }
        
        // 查询该用户对该测试的尝试记录
        const { data, error, count } = await supabase
            .from('test_results')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .eq('test_id', props.testId);
            
        if (error) {
            throw error;
        }
        
        return { count: count || 0, hasReachedLimit: (count || 0) >= maxAttempts };
    } catch (error) {
        console.error('检查尝试次数失败:', error);
        return { count: 0, hasReachedLimit: false }; // 出错时允许继续
    }
};

const submitAnswers = async () => {
    // 所有题目必须全部作答，否则无法提交
    const allAnswered = props.questions.every(question =>{
        if(question.question_type=='select'){
            return userAnswers.value[question.id] !== undefined;
        }else {
            return userAnswers.value[question.id] !== undefined && userAnswers.value[question.id].trim() !== '';
        }
    });

    if (!allAnswered) {
        ElMessage.error('请将所有题目作答完毕后再提交');
        return;
    }
    
    // 检查尝试次数
    const { count, hasReachedLimit } = await checkAttemptCount();
    
    if (hasReachedLimit) {
        ElMessage.error(`您已达到最大尝试次数(${maxAttempts}次)，不能再次作答`);
        return;
    }

    isSubmitting.value = true;
    
    try {
        const userStore = useUserStore();
        const userId = userStore.user?.user_id;
        
        if (!userId) {
            throw new Error('用户未登录');
        }

        // 计算分数
        let totalScore = 0;
        const incorrectAnswers = [];
        
        for (const question of props.questions) {
            const userAnswer = question.question_type === 'select' 
                ? userAnswers.value[question.id].split('.')[1] 
                : userAnswers.value[question.id];
            const questionIndex = question.question_type === 'select'
                ? userAnswers.value[question.id].split('-')[0]
                : `第${props.questions.indexOf(question) + 1}题`;
            
            // 对于案例分析题，不判断正确性，直接给0分
            if (question.question_type === 'reading') {
                totalScore += 0;

                incorrectAnswers.push({
                    questionIndex: questionIndex,   
                    questionId: question.id,
                    userAnswer: userAnswer,
                    correctAnswer: '待批改'
                });
            } else {
                if (userAnswer === question.correct_answer) {
                    totalScore += 10;
                } else {
                    incorrectAnswers.push({
                        questionIndex: questionIndex,   
                        questionId: question.id,
                        userAnswer: userAnswer,
                        correctAnswer: question.correct_answer
                    });
                }
            }
        }
        
        // 创建测试结果对象
        const testResult = {
            user_id: userId,
            test_id: props.testId,
            test_title: props.testName,
            score: totalScore,
            is_passed: totalScore >= 60,
            submitted_at: new Date().toISOString(),
            completion_status: 'completed' as const,
            is_graded: props.type === 'select',
            type: props.type,
        };

        // 创建答案详情数组
        const answerDetails = props.questions.map((question, index) => ({
            test_result_id: '', // 将在服务端填充
            question_id: String(question.id) || '',
            question_type: question.question_type || '',
            question_text: question.text,
            answer: userAnswers.value[question.id] || '',
            is_correct: question.question_type === 'reading' ? null : userAnswers.value[question.id].split('.')[1] === question.correct_answer,
            score: question.question_type == 'select' && userAnswers.value[question.id].split('.')[1] === question.correct_answer ? (props.type === 'select'? 10 : 5 ): 0,
            question_order: index + 1
        }));
        
        await testResultService.submitTestResult(testResult, answerDetails);

        // 根据测试类型显示不同的提示信息
        if (props.type === 'select') {
            ElMessage.success('测试答案提交成功！');
            showReAnswer.value = true;
        } else {
            ElMessage.success('答案已提交，请等待管理员批改！');
            showReAnswer.value = true;
        }
        
        // 触发事件，传递分数和错误答案
        emit('submitAnswers', {
            answers: userAnswers.value,
            score: totalScore,
            incorrectAnswers: incorrectAnswers
        });
    } catch (error) {
        console.error('提交测试结果失败:', error);
        ElMessage.error('提交测试结果失败，请稍后重试');
    } finally {
        isSubmitting.value = false;
    }
};

const ReAnswer = () => {
    showReAnswer.value = false;
    userAnswers.value = {};
    // form.value = {};
}

// Check attempts when component is mounted
onMounted(async () => {
    const { hasReachedLimit } = await checkAttemptCount();
    if (hasReachedLimit) {
        ElMessage.warning(`您已达到最大尝试次数(${maxAttempts}次)，不能再次作答`);
        emit('limitReached');
    }
});
</script>

<style scoped>
/* 添加样式 */
.el-form-item {
    margin-bottom: 30px;
}

.reading-lable {
    font-weight: bold;
    margin-bottom: 15px;
}

/* 添加提交按钮样式 */
.submit-btn {
    min-width: 120px;
}

.reset-btn {
    min-width: 120px;
}
</style>