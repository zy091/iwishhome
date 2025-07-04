<template>
    <div>
        <h1>测试题页面</h1>
        <div v-for="(question, index) in questions" :key="index" class="question">
            <p>{{ index + 1 }}. {{ question.text }}</p>
            <div v-for="(option, i) in question.options" :key="i">
                <input type="radio" :name="'question' + index" :value="option"  v-model="userAnswers[question.id]" />
                <label>{{ option }}</label>
            </div>
        </div>
        <button @click="submitAnswers">提交答案</button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    questions: { id: number; text: string; options: string[]; correct_answer: string; question_type: string }[];
}>();

const emit = defineEmits<{
    (e: 'submitAnswers', answers: Record<number, string>): void; // 使用 Record 类型
}>();

// 使用对象来存储用户答案
const userAnswers = ref<Record<number, string>>({});

const submitAnswers = () => {
    emit('submitAnswers', userAnswers.value); // 触发事件并传递用户答案

    // 比较用户答案和正确答案
    props.questions.forEach((question) => {
        const correctAnswer = question.correct_answer;
        const userAnswer = userAnswers.value[question.id];

        if (userAnswer === correctAnswer) {
            console.log(`问题 ${question.id} 答对了！`);
        } else {
            console.log(`问题 ${question.id} 答错了，正确答案是: ${correctAnswer}`);
        }
    });
};
</script>

<style scoped>
.question {
    margin-bottom: 20px;
}
</style>