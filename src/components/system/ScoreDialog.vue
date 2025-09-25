<template>
    <!-- <el-button plain @click="centerDialogVisible = true">
        Click to open the Dialog
    </el-button> -->

    <el-dialog v-model="localDialogVisible" title="你的测试成绩" width="500" align-center center @close="ClickCloseDialog"
        @open="setText(Score)" class="score-dialog">
        <h3>{{ Score }}</h3>
        <p>Open the dialog from the center from the screen</p>
        <div v-if="localIncorrectAnswers.length > 0" style="margin-top: 10px; font-size: 14px; color: #606266;">
            <el-text type="info">错误题目已在答题区域标红显示，正确答案显示在题目下方</el-text>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="ClickCloseDialog">
                    确定
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>
<script lang="ts" setup>
import { ref, watch, onMounted ,nextTick} from 'vue'

const props = withDefaults(defineProps<{
    Score?: number, // Make Score optional
    centerDialogVisible?: boolean,
    incorrectAnswers: { questionIndex: string; questionId: number; userAnswer: string; correctAnswer: string }[]; // 接收的类型
}>(), {
    Score: 0// Provide a default value
})
//赋值错误答案props.incorrectAnswers
const localIncorrectAnswers = ref(props.incorrectAnswers);


// 创建一个本地响应式变量来管理对话框的可见性
const localDialogVisible = ref(props.centerDialogVisible)

onMounted(() => {
    // 选择元素
    const pElement = document.querySelector('.score-dialog p') as HTMLElement;
    const h3Element = document.querySelector('.score-dialog h3') as HTMLElement;

    // 确保在弹窗打开时调用 setText
    if (localDialogVisible.value) {
        setText(props.Score);
    }
});
//初次加载时，根据Score的值设置颜色
const setText = (newValue: number) => {
    nextTick(() => { // 确保在访问元素之前 DOM 已更新
        const pElement = document.querySelector('.score-dialog p') as HTMLElement;
        const h3Element = document.querySelector('.score-dialog h3') as HTMLElement;
        if (newValue >= 100) {
            h3Element.setAttribute('style', 'color: #67c23a')
            if (pElement) {
                pElement.setAttribute('style', 'color: #606266');
                pElement.innerText = '太棒了！你拿到了满分！';
            }

        } else {
            h3Element.setAttribute('style', 'color: #606266')
            if (pElement) {
                pElement.setAttribute('style', 'color: #606266');
                pElement.innerText = '继续努力吧！';
            }

        }
    });
}
watch(() => props.incorrectAnswers, (newValue) => {
    localIncorrectAnswers.value = newValue;
});

//监听Score的变化
watch(() => props.Score, (newValue) => {
    console.log(newValue)
    if (localDialogVisible.value) {
        setText(props.Score);
    }
})

// 监听属性变化以更新本地变量
watch(() => props.centerDialogVisible, (newValue) => {
    localDialogVisible.value = newValue
})
const emit = defineEmits<{
    (e: 'update:centerDialogVisible', value: boolean): void;
}>();
//弹窗点击事件
const ClickCloseDialog = () => {
    localDialogVisible.value = false

    // 触发事件将值传递给父组件
    emit('update:centerDialogVisible', localDialogVisible.value)
    console.log('props.centerDialogVisible:', props.centerDialogVisible,localIncorrectAnswers.value)
}

</script>
<style scoped>
.score-dialog {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    & h3 {
        text-align: center;
        font-size: 50px;
        font-weight: 700;
        /* color: #67c23a; */
    }

    & p {
        text-align: center;
        width: 100%;
        margin-top: 20px;
    }
}
</style>