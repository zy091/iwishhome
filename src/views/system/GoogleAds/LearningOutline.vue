<template>
    <div class="learning-outline-container">
        <div class="outline-header">
            <h1>Google学习大纲</h1>
        </div>
        
        <div class="outline-content">
            <!-- 中心节点 -->
            <div class="central-node">
                <div class="central-title">Google学习大纲</div>
            </div>
            
            <!-- 连接线 -->
            <div class="connection-line"></div>
            
            <!-- 分支节点 -->
            <div class="branch-nodes">
                <div 
                    v-for="(topic, index) in learningTopics" 
                    :key="index"
                    class="topic-node"
                    :class="`topic-${index + 1}`"
                    @click="selectTopic(topic)"
                >
                    <div class="node-content">
                        <div class="node-icon">{{ topic.icon }}</div>
                        <div class="node-title">{{ topic.title }}</div>
                        <div class="node-desc">{{ topic.description }}</div>
                    </div>
                    <div class="node-connector"></div>
                </div>
            </div>
        </div>
        
        <!-- 详细信息面板 -->
        <div class="detail-panel" v-if="selectedTopic">
            <div class="panel-header">
                <h3>{{ selectedTopic.title }}</h3>
                <button @click="closeDetail" class="close-btn">×</button>
            </div>
            <div class="panel-content">
                <div class="topic-details">
                    <h4>学习内容：</h4>
                    <ul class="detail-list">
                        <li v-for="item in selectedTopic.details" :key="item">{{ item }}</li>
                    </ul>
                </div>
                <div class="learning-objectives">
                    <h4>学习目标：</h4>
                    <p>{{ selectedTopic.objectives }}</p>
                </div>
                <!-- <div class="duration-info">
                    <span class="duration">预计学习时间：{{ selectedTopic.duration }}</span>
                </div> -->
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

// 学习主题数据
const learningTopics = ref([
    {
        title: '数字营销与品牌独立站',
        description: '了解数字营销基础概念和独立站建设',
        icon: '🌐',
        details: [
            '数字营销基础概念与趋势',
            '品牌独立站的重要性',
            '独立站与平台电商的区别',
            '独立站建设流程与要点',
            '用户体验优化策略',
            '转化率优化技巧'
        ],
        objectives: '掌握数字营销基础理论，了解独立站运营的核心要素，能够独立分析和优化网站用户体验。',
        duration: '2-3天'
    },
    {
        title: '了解Google',
        description: '深入理解Google生态系统',
        icon: '🔍',
        details: [
            'Google公司发展历程',
            'Google产品生态体系',
            'Google Ads平台介绍',
            'Google Analytics 4 (GA4)',
            'Google Search Console',
            'Google Merchant Center',
            'Google Tag Manager'
        ],
        objectives: '全面了解Google生态系统，掌握各个平台的功能和用途，为后续广告投放打下坚实基础。',
        duration: '1-2天'
    },
    {
        title: 'Google广告形式及数据分析',
        description: '掌握各种Google广告类型和数据分析方法',
        icon: '📊',
        details: [
            '搜索广告 (Search Ads)',
            '购物广告 (Shopping Ads)',
            '展示广告 (Display Ads)',
            '视频广告 (Video Ads)',
            '应用广告 (App Ads)',
            '智能购物广告 (Smart Shopping)',
            'Performance Max广告',
            '数据分析基础概念',
            '关键指标解读',
            '数据报告制作'
        ],
        objectives: '熟练掌握各种Google广告形式的特点和适用场景，具备独立进行数据分析和报告制作的能力。',
        duration: '3-4天'
    },
    {
        title: 'Google广告账户前期设置与关联',
        description: '学习账户创建和平台关联',
        icon: '⚙️',
        details: [
            'Google Ads账户创建',
            '账户结构规划',
            '支付方式设置',
            '账户权限管理',
            'Google Analytics关联',
            'Google Search Console关联',
            'Google Merchant Center关联',
            '转化跟踪设置',
            '目标受众设置',
            '账户安全设置'
        ],
        objectives: '能够独立完成Google广告账户的创建和配置，建立完整的账户体系，确保各平台间的有效关联。',
        duration: '1-2天'
    },
    {
        title: 'Google广告结构搭建',
        description: '学习广告账户结构设计和搭建',
        icon: '🏗️',
        details: [
            '账户层级结构设计',
            '广告系列创建与设置',
            '广告组规划与管理',
            '关键词策略制定',
            '广告文案撰写',
            '着陆页优化',
            '出价策略选择',
            '预算分配策略',
            '投放时间设置',
            '地理位置定位'
        ],
        objectives: '掌握Google广告账户的完整搭建流程，能够根据业务需求设计合理的账户结构，制定有效的投放策略。',
        duration: '2-3天'
    },
    {
        title: 'Google报表制作逻辑梳理',
        description: '学习数据报表的制作和分析逻辑',
        icon: '📈',
        details: [
            '报表制作基础原则',
            '关键指标选择与计算',
            '数据可视化技巧',
            '日报制作流程',
            '周报分析框架',
            '月报总结方法',
            '异常数据识别',
            '优化建议提出',
            '客户汇报技巧',
            '数据驱动决策'
        ],
        objectives: '具备独立制作各类数据报表的能力，能够通过数据分析发现问题并提出有效的优化建议，为客户提供专业的汇报服务。',
        duration: '2-3天'
    }
])

// 选中的主题
const selectedTopic = ref(null)

// 选择主题
const selectTopic = (topic) => {
    selectedTopic.value = topic
}

// 关闭详情面板
const closeDetail = () => {
    selectedTopic.value = null
}
</script>

<style scoped>
.learning-outline-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 20px;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.outline-header {
    text-align: center;
    margin-bottom: 40px;
}

.outline-header h1 {
    color: #2c3e50;
    font-size: 2.5em;
    font-weight: 600;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.outline-content {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    min-height: 600px;
}

.central-node {
    position: absolute;
    left: 50px;
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    padding: 20px 30px;
    border-radius: 15px;
    box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
    z-index: 10;
    min-width: 200px;
    text-align: center;
}

.central-title {
    font-size: 1.4em;
    font-weight: 600;
    margin: 0;
}

.connection-line {
    position: absolute;
    left: 250px;
    top: 50%;
    transform: translateY(-50%);
    width: 100px;
    height: 4px;
    background: linear-gradient(90deg, #3498db, #e74c3c);
    border-radius: 2px;
    z-index: 5;
}

.branch-nodes {
    position: absolute;
    right: 0;
    top: 0;
    width: 60%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding: 20px 0;
}

.topic-node {
    position: relative;
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin: 10px 0;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    border-left: 5px solid #3498db;
}

.topic-node:hover {
    transform: translateX(-10px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-left-color: #e74c3c;
}

.topic-node::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 50%;
    transform: translateY(-50%);
    width: 15px;
    height: 15px;
    background: #3498db;
    border-radius: 50%;
    z-index: 5;
}

.topic-1 { border-left-color: #e74c3c; }
.topic-2 { border-left-color: #f39c12; }
.topic-3 { border-left-color: #27ae60; }
.topic-4 { border-left-color: #9b59b6; }
.topic-5 { border-left-color: #e67e22; }
.topic-6 { border-left-color: #1abc9c; }

.node-content {
    display: flex;
    align-items: center;
    gap: 15px;
}

.node-icon {
    font-size: 2em;
    flex-shrink: 0;
}

.node-title {
    font-size: 1.2em;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 5px;
}

.node-desc {
    font-size: 0.9em;
    color: #7f8c8d;
    line-height: 1.4;
}

.detail-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    background: white;
    box-shadow: -5px 0 25px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    overflow-y: auto;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
    }
    to {
        transform: translateX(0);
    }
}

.panel-header {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-header h3 {
    margin: 0;
    font-size: 1.3em;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.5em;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 50%;
    transition: background 0.3s ease;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.panel-content {
    padding: 20px;
}

.topic-details h4,
.learning-objectives h4 {
    color: #2c3e50;
    font-size: 1.1em;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 2px solid #3498db;
}

.detail-list {
    list-style: none;
    padding: 0;
    margin: 0 0 20px 0;
}

.detail-list li {
    padding: 8px 0;
    color: #495057;
    position: relative;
    padding-left: 20px;
    line-height: 1.5;
}

.detail-list li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #3498db;
    font-size: 16px;
    font-weight: bold;
}

.learning-objectives p {
    color: #495057;
    line-height: 1.6;
    margin: 0 0 20px 0;
}

.duration-info {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
}

.duration {
    color: #27ae60;
    font-weight: 600;
    font-size: 1.1em;
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .outline-content {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .central-node {
        position: static;
        transform: none;
        margin-bottom: 30px;
    }
    
    .connection-line {
        display: none;
    }
    
    .branch-nodes {
        position: static;
        width: 100%;
        max-width: 800px;
    }
    
    .detail-panel {
        width: 100%;
        height: 70vh;
        top: auto;
        bottom: 0;
        right: 0;
        border-radius: 15px 15px 0 0;
    }
}

@media (max-width: 768px) {
    .learning-outline-container {
        padding: 10px;
    }
    
    .outline-header h1 {
        font-size: 2em;
    }
    
    .central-node {
        padding: 15px 20px;
        min-width: 150px;
    }
    
    .central-title {
        font-size: 1.2em;
    }
    
    .topic-node {
        padding: 15px;
        margin: 8px 0;
    }
    
    .node-content {
        flex-direction: column;
        text-align: center;
        gap: 10px;
    }
    
    .node-icon {
        font-size: 1.5em;
    }
    
    .node-title {
        font-size: 1.1em;
    }
    
    .node-desc {
        font-size: 0.85em;
    }
}
</style>