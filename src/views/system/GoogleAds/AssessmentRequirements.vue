<template>
    <div class="assessment-container">
        <div class="assessment-header">
            <h1>了解工作岗位</h1>
        </div>
        
        <div class="assessment-content">
            <!-- Google优化师岗位技能要求 -->
            <div class="section">
                <div class="section-header">
                    <div class="section-number">1</div>
                    <h2>Google优化师的岗位技能要求</h2>
                </div>
                <div class="section-content">
                    <div class="trial-period">
                        <div class="trial-badge">
                            <span class="trial-text">试用期：3个月</span>
                        </div>
                    </div>
                    
                    <div class="requirements-grid">
                        <div class="requirement-card">
                            <div class="card-header">
                                <div class="skill-icon">🔍</div>
                                <h3>学会Google的相关知识应用及优化</h3>
                            </div>
                            <div class="card-content">
                                <ul class="skill-list">
                                    <li>搜索广告的使用及优化</li>
                                    <li>购物广告的使用及优化</li>
                                    <li>Pmax广告的使用及优化</li>
                                    <li>Demand Gen广告的使用及优化</li>
                                    <li>视频广告广告的应用</li>
                                    <li>GA4学习与应用</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="requirement-card">
                            <div class="card-header">
                                <div class="skill-icon">🛠️</div>
                                <h3>熟练掌握网站诊断及问题排查</h3>
                            </div>
                            <div class="card-content">
                                <ul class="skill-list">
                                    <li>符合网站政策要求</li>
                                    <li>网站功能要求</li>
                                    <li>用户体验优化</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="requirement-card">
                            <div class="card-header">
                                <div class="skill-icon">📊</div>
                                <h3>具备广告的数据分析能力</h3>
                            </div>
                            <div class="card-content">
                                <ul class="skill-list">
                                    <li>熟练日报数据分析及问题排查</li>
                                    <li>熟练周报数据分析及报告总结</li>
                                    <li>熟练月报数据分析及报告总结</li>
                                    <li>结合阶段投放目标进行分析并给出优化建议</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="requirement-card">
                            <div class="card-header">
                                <div class="skill-icon">💬</div>
                                <h3>客户沟通能力</h3>
                            </div>
                            <div class="card-content">
                                <ul class="skill-list">
                                    <li>参与客户线上/线下沟通</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 培训考核要求 -->
            <div class="section">
                <div class="section-header">
                    <div class="section-number">2</div>
                    <h2>培训考核要求</h2>
                </div>
                <div class="section-content">
                    <div class="training-requirements">
                        <div class="requirement-item">
                            <h3 class="requirement-title">学习要求：</h3>
                            <p class="requirement-desc">
                                按照培训流程学习每一部分的内容，掌握核心内容的应用，完成基本知识学习》模拟练习》实操运用》考试合格；完成项目负责人安排的日常工作。
                            </p>
                        </div>
                        
                        <div class="requirement-item">
                            <h3 class="requirement-title">考核要求：</h3>
                            <ul class="requirement-list">
                                <li>通过艾维的阶段测试及日常的实践作业，学习期内每个章节的测试至少为80分以上；</li>
                                <li>执行并高质量完成项目负责人分配的工作内容；</li>
                                <li>满足公司对岗基本要求：较强的责任心、认真严谨的学习工作态度。</li>
                            </ul>
                        </div>
                        
                        <div class="success-rate">
                            <div class="rate-badge">
                                <span class="rate-text">艾维优化师试用期通过比例为85%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 岗位晋升通道 -->
            <div class="section">
                <div class="section-header">
                    <div class="section-number">3</div>
                    <h2>岗位晋升通道</h2>
                </div>
                <div class="section-content">
                    <div class="promotion-path">
                        <div class="path-title">
                            <h3>优化师晋升通道：</h3>
                        </div>
                        <div class="path-flow">
                            <div class="path-step" v-for="(step, index) in promotionSteps" :key="index">
                                <div class="step-circle">{{ index + 1 }}</div>
                                <div class="step-content">
                                    <div class="step-title">{{ step.title }}</div>
                                    <div class="step-desc">{{ step.desc }}</div>
                                </div>
                                <div class="step-arrow" v-if="index < promotionSteps.length - 1">→</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

// 晋升通道数据
const promotionSteps = ref([
    { title: '试用期', desc: '3个月试用期' },
    { title: '优化师', desc: '初级优化师' },
    { title: '中级优化师', desc: '中级水平' },
    { title: '高级优化师', desc: '高级水平' },
    { title: '资深优化师', desc: '资深专家' },
    { title: '广告策略专家', desc: '策略制定' },
    { title: '项目经理', desc: '项目管理' },
    { title: '效果营销经理', desc: '营销管理' },
    { title: '效果营销总监', desc: '总监级别' }
])
</script>

<style scoped>
.assessment-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.assessment-header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 3px solid #3498db;
}

.assessment-header h1 {
    color: #2c3e50;
    font-size: 2.5em;
    font-weight: 600;
    margin: 0;
}

.assessment-content {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.section {
    border-bottom: 1px solid #e9ecef;
}

.section:last-child {
    border-bottom: none;
}

.section-header {
    display: flex;
    align-items: center;
    padding: 30px 40px 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #dee2e6;
}

.section-number {
    width: 40px;
    height: 40px;
    background: #3498db;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    margin-right: 20px;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.section-header h2 {
    color: #2c3e50;
    font-size: 1.8em;
    font-weight: 600;
    margin: 0;
}

.section-content {
    padding: 30px 40px;
}

.trial-period {
    text-align: center;
    margin-bottom: 30px;
}

.trial-badge {
    display: inline-block;
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    color: white;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 18px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
}

.requirements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.requirement-card {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.requirement-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #3498db;
}

.card-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f8f9fa;
}

.skill-icon {
    font-size: 24px;
    margin-right: 12px;
}

.card-header h3 {
    color: #2c3e50;
    font-size: 1.2em;
    font-weight: 600;
    margin: 0;
}

.skill-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.skill-list li {
    padding: 8px 0;
    color: #495057;
    position: relative;
    padding-left: 20px;
}

.skill-list li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #27ae60;
    font-weight: bold;
}

.training-requirements {
    background: #f8f9fa;
    padding: 25px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.requirement-item {
    margin-bottom: 25px;
}

.requirement-item:last-child {
    margin-bottom: 0;
}

.requirement-title {
    color: #2c3e50;
    font-size: 1.3em;
    font-weight: 600;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 2px solid #3498db;
    display: inline-block;
}

.requirement-desc {
    color: #495057;
    line-height: 1.6;
    font-size: 1.1em;
    margin: 0;
}

.requirement-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.requirement-list li {
    padding: 10px 0;
    color: #495057;
    position: relative;
    padding-left: 25px;
    line-height: 1.5;
}

.requirement-list li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #3498db;
    font-size: 20px;
    font-weight: bold;
}

.success-rate {
    text-align: center;
    margin-top: 20px;
}

.rate-badge {
    display: inline-block;
    background: linear-gradient(135deg, #27ae60, #2ecc71);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
}

.promotion-path {
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    padding: 30px;
    border-radius: 12px;
    border: 2px solid #dee2e6;
}

.path-title h3 {
    color: #2c3e50;
    font-size: 1.4em;
    font-weight: 600;
    margin-bottom: 20px;
    text-align: center;
}

.path-flow {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.path-step {
    display: flex;
    align-items: center;
    background: white;
    padding: 15px 20px;
    border-radius: 25px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    margin: 5px;
}

.path-step:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.step-circle {
    width: 30px;
    height: 30px;
    background: #3498db;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    margin-right: 12px;
    flex-shrink: 0;
}

.step-content {
    flex: 1;
}

.step-title {
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
}

.step-desc {
    font-size: 12px;
    color: #6c757d;
    margin-top: 2px;
}

.step-arrow {
    color: #3498db;
    font-size: 18px;
    font-weight: bold;
    margin: 0 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .assessment-container {
        padding: 15px;
    }
    
    .assessment-header h1 {
        font-size: 2em;
    }
    
    .section-header {
        padding: 20px 20px 15px;
    }
    
    .section-content {
        padding: 20px;
    }
    
    .section-number {
        width: 35px;
        height: 35px;
        font-size: 18px;
        margin-right: 15px;
    }
    
    .section-header h2 {
        font-size: 1.5em;
    }
    
    .requirements-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    
    .path-flow {
        flex-direction: column;
        align-items: stretch;
    }
    
    .path-step {
        margin: 5px 0;
    }
    
    .step-arrow {
        transform: rotate(90deg);
        margin: 10px 0;
    }
}
</style>