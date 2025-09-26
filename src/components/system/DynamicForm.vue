<template>
    <el-form v-loading="!questions.length" element-loading-text="Loading..." :model="form" label-width="auto"
        style="width: 100%; max-width: 800px;" class="responsive-form">

        <el-form-item v-for="(question, index) in questions" :key="question.id"
            :label="question.question_type === 'reading' ? '' : `${index + 1}. ${question.text}`" label-position="left"
            style=" flex-direction: column;">
            <template v-if="question.question_type === 'select'">
                <!-- 多选题 -->
                <template v-if="question.is_multiple">
                    <el-checkbox-group v-model="userAnswers[question.id]" :disabled="showReAnswer">
                        <el-checkbox v-for="(option, i) in question.options" :key="i"
                            :value="`第${index + 1}题-${String.fromCharCode(65 + i)}.${option}`"
                            :class="getOptionClass(question, option, i)"
                            :style="getOptionStyle(question, option, i)">
                            {{ `${String.fromCharCode(65 + i)}. ${option}` }}
                        </el-checkbox>
                    </el-checkbox-group>

                </template>
                <!-- 单选题 -->
                <template v-else>
                    <el-radio-group v-model="userAnswers[question.id]" :disabled="showReAnswer">
                        <el-radio v-for="(option, i) in question.options" :key="i"
                            :value="`第${index + 1}题-${String.fromCharCode(65 + i)}.${option}`"
                            :class="getOptionClass(question, option, i)"
                            :style="getOptionStyle(question, option, i)">
                            {{ `${String.fromCharCode(65 + i)}. ${option}` }}
                        </el-radio>
                    </el-radio-group>
                </template>

                <!-- 显示正确答案 -->
                <div v-if="showReAnswer && answerResults[question.id] && !answerResults[question.id].isCorrect"
                    class="correct-answer-hint">
                    <el-text type="success">正确答案：{{ formatCorrectAnswer(question.correct_answer) }}</el-text>
                </div>
            </template>

            <template v-else-if="question.question_type === 'judge'">
                <el-radio-group v-model="userAnswers[question.id]">
                    <el-radio value="是">对</el-radio>
                    <el-radio value="否">错</el-radio>
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
            <el-button style="margin-left: 0;margin-right: 50px;" type="primary" @click="submitAnswers"
                :disabled="showReAnswer">提交答案</el-button>
            <el-tooltip class="box-item" effect="dark" content="点击后将清空所有答案" placement="top-start">
                <el-button type="warning" plain v-show="showReAnswer" @click="ReAnswer">重新作答</el-button>
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
    questions: {
        id: number; text: string; options: string[]; correct_answer: string; question_type: string; platform: string; chapter: string,
        is_multiple: boolean;
    }[];
    testId: string; // 添加测试ID属性
    testName: string; // 添加测试名称属性
    type: string;
    scoreWeight: number;
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
const maxAttempts = 2; // 最大尝试次数限制
const answerResults = ref<Record<number, { userAnswer: string; isCorrect: boolean }>>({});

// 格式化正确答案显示
const formatCorrectAnswer = (correctAnswer: string) => {
    const answers = correctAnswer.split(';');
    if (answers.length > 1) {
        // 多选题：显示为带编号的格式
        return answers.map((answer, index) => `${index + 1}.${answer}`).join(';');
    } else {
        // 单选题：直接显示
        return correctAnswer;
    }
};

// 获取选项的CSS类名
const getOptionClass = (question: any, option: string, optionIndex: number) => {
    
    if (!showReAnswer.value || !answerResults.value[question.id]) {
        return '';
    }

    const optionText = `${option}`;
    const userResult = answerResults.value[question.id];
    const correctAnswers = question.correct_answer.split(';'); // 支持多选题的多个正确答案

    // 如果用户答对了，不显示任何特殊样式
    if (userResult.isCorrect) {
        return '';
    }

    // 只有在用户答错的情况下才显示样式
    const isCorrectOption = correctAnswers.includes(optionText);

    // 检查是否是用户选择的错误答案
    let isUserWrongChoice = false;
    if (question.is_multiple) {
        // 多选题：检查用户选择的答案中是否包含此选项
        const userAnswers = userResult.userAnswer.split(';');
        isUserWrongChoice = userAnswers.includes(optionText) && !isCorrectOption;
    } else {
        // 单选题：检查是否是用户选择的错误答案
        isUserWrongChoice = userResult.userAnswer === optionText && !isCorrectOption;
    }

    if (isUserWrongChoice) {
        return 'wrong-option';
    } else if (isCorrectOption) {
        return 'correct-option';
    }
    return '';
};

// 获取选项的动态样式
const getOptionStyle = (question: any, option: string, optionIndex: number) => {
    const className = getOptionClass(question, option, optionIndex);
    
    if (className === 'wrong-option') {
        return {
            color: '#f56c6c !important',
            backgroundColor: '#fef0f0 !important',
            borderColor: '#f56c6c !important'
        };
    } else if (className === 'correct-option') {
        return {
            color: '#67c23a !important',
            backgroundColor: '#f0f9ff !important',
            borderColor: '#67c23a !important'
        };
    }
    
    return {};
};

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
    const allAnswered = props.questions.every(question => {
        if (question.question_type == 'select') {
            const answer = userAnswers.value[question.id];
            if (question.is_multiple) {
                // 多选题：检查是否为非空数组
                return Array.isArray(answer) && answer.length > 0;
            } else {
                // 单选题：检查是否不为undefined且不为空字符串
                return answer !== undefined && answer !== '';
            }
        } else {
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
            let userAnswer, questionIndex;

            if (question.question_type === 'select') {
                if (question.is_multiple) {
                    // 多选题：答案是数组，需要提取每个选项的内容部分
                    const answers = userAnswers.value[question.id];
                    if (Array.isArray(answers) && answers.length > 0) {
                        userAnswer = answers.map(answer => answer.split('.')[1]).join(';');
                        questionIndex = answers[0].split('-')[0];
                    } else {
                        userAnswer = '';
                        questionIndex = `第${props.questions.indexOf(question) + 1}题`;
                    }
                } else {
                    // 单选题：答案是字符串
                    const answer = userAnswers.value[question.id];
                    if (answer && typeof answer === 'string') {
                        userAnswer = answer.split('.')[1] || '';
                        questionIndex = answer.split('-')[0] || `第${props.questions.indexOf(question) + 1}题`;
                    } else {
                        userAnswer = '';
                        questionIndex = `第${props.questions.indexOf(question) + 1}题`;
                    }
                }
            } else {
                userAnswer = userAnswers.value[question.id] || '';
                questionIndex = `第${props.questions.indexOf(question) + 1}题`;
            }

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
                // 判断答案是否正确（支持多选题顺序不同的情况）
                let isAnswerCorrect = false;
                if (question.is_multiple) {
                    // 多选题：比较选项内容，忽略顺序
                    const userOptions = userAnswer.split(';').sort();
                    const correctOptions = question.correct_answer.split(';').sort();
                    isAnswerCorrect = userOptions.length === correctOptions.length &&
                        userOptions.every((option, index) => option === correctOptions[index]);
                } else {
                    // 单选题：直接比较
                    isAnswerCorrect = userAnswer === question.correct_answer;
                }

                if (isAnswerCorrect) {
                    totalScore += parseFloat((props.scoreWeight / props.questions.length).toFixed(2));
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
            score: Math.min(parseFloat(totalScore.toFixed(2)), props.scoreWeight),
            is_passed: totalScore >= 60,
            submitted_at: new Date().toISOString(),
            completion_status: 'completed' as const,
            is_graded: props.type === 'select',
            type: props.type,
        };

        // 创建答案详情数组
        const answerDetails = props.questions.map((question, index) => {
            let userAnswer = '';
            let isCorrect = false;
            let score = 0;

            if (question.question_type === 'select') {
                if (question.is_multiple) {
                    // 多选题处理
                    const answers = userAnswers.value[question.id];
                    if (Array.isArray(answers) && answers.length > 0) {
                        userAnswer = answers.map(answer => answer.split('.')[1]).join(';');
                        // 多选题正确性判断：比较选项内容，忽略顺序
                        const userOptions = answers.map(answer => answer.split('.')[1]).sort();
                        const correctOptions = question.correct_answer.split(';').sort();
                        isCorrect = userOptions.length === correctOptions.length &&
                            userOptions.every((option, index) => option === correctOptions[index]);
                    }
                } else {
                    // 单选题处理
                    const answer = userAnswers.value[question.id];
                    if (answer && typeof answer === 'string') {
                        userAnswer = answer.split('.')[1] || '';
                        isCorrect = userAnswer === question.correct_answer;
                    }
                }

                // 计算分数
                if (isCorrect) {
                    score = props.type === 'select' ? parseFloat((props.scoreWeight / props.questions.length).toFixed(2)) : 5;
                }
            } else if (question.question_type === 'reading') {
                userAnswer = userAnswers.value[question.id] || '';
                isCorrect = null; // 案例分析题不判断正确性
                score = 0;
            } else {
                userAnswer = userAnswers.value[question.id] || '';
                isCorrect = userAnswer === question.correct_answer;
                score = isCorrect ? 5 : 0;
            }

            // 保存答题结果到本地状态
            if (question.question_type === 'select') {
                answerResults.value[question.id] = {
                    userAnswer: userAnswer,
                    isCorrect: isCorrect
                };
            }

            return {
                test_result_id: '', // 将在服务端填充
                question_id: String(question.id) || '',
                question_type: question.question_type || '',
                question_text: question.text,
                answer: userAnswer,
                is_correct: isCorrect,
                score: Math.min(parseFloat(score.toFixed(2)), props.scoreWeight),
                question_order: index + 1
            };
        });

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
            score: Math.min(parseFloat(totalScore.toFixed(2)), props.scoreWeight),
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
    answerResults.value = {}; // 清空答题结果
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
:deep(.el-form-item__label-wrap) {
    width: 100%;
}
.responsive-form :deep(.el-form-item:last-child .el-form-item__label-wrap) {
    display: none;
}
:deep(.el-form-item__label) {
    flex:1 !important;
    height: auto;
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

/* 错误选项样式 */
.wrong-option {
    color: #f56c6c !important;
    background-color: #fef0f0 !important;
    border-color: #f56c6c !important;
}

.wrong-option :deep(.el-radio__label),
.wrong-option :deep(.el-checkbox__label) {
    color: #f56c6c !important;
}

/* 正确答案样式 */
.correct-option {
    color: #67c23a !important;
    background-color: #f0f9ff !important;
    border-color: #67c23a !important;
}

.correct-option :deep(.el-radio__label),
.correct-option :deep(.el-checkbox__label) {
    color: #67c23a !important;
}

/* 正确答案提示样式 */
.correct-answer-hint {
    margin-top: 10px;
    padding: 8px 12px;
    background-color: #f0f9ff;
    border-left: 4px solid #67c23a;
    border-radius: 4px;
}

/* 响应式表单样式 */
.responsive-form {
    width: 100%;
}

.responsive-form :deep(.el-form-item__label) {
    word-wrap: break-word;
    white-space: normal;
    line-height: 1.4;
    padding-right: 12px;
}

/* 移动端适配 */
@media (max-width: 768px) {
    .responsive-form :deep(.el-form-item__label) {
        margin-bottom: 8px;
    }
}
</style>