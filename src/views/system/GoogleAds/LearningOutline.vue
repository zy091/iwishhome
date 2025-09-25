<template>
    <div class="mindmap-container">
        <div class="mindmap-header">
            <h1>Google基本知识框架</h1>
            <p>点击节点展开/收起内容</p>
        </div>
        
        <div class="mindmap-content">
            <!-- 中心节点 -->
            <div class="center-node">
                <div class="node-content">
                    <div class="node-title">Google Ads</div>
                </div>
            </div>
            
            <!-- 主要分支 - 垂直布局 -->
            <div class="main-branches">
                <!-- 分支1: Google广告形式 -->
                <div class="branch-container">
                    <div class="center-line"></div>
                    <div class="main-branch-node" @click="toggleBranch('googleAds')">
                        <div class="expand-icon" :class="{ 'expanded': expandedBranches.googleAds }">
                            {{ expandedBranches.googleAds ? '−' : '+' }}
                        </div>
                        <div class="node-title">Google广告形式</div>
                        <div class="node-count">(6)</div>
                    </div>
                    
                    <!-- 子分支 -->
                    <div class="sub-branches" v-if="expandedBranches.googleAds">
                        <!-- 搜索广告 -->
                        <div class="sub-branch-container">
                            <div class="sub-line"></div>
                            <div class="sub-branch-node" @click="toggleSubBranch('searchAds')">
                                <div class="expand-icon" :class="{ 'expanded': expandedSubBranches.searchAds }">
                                    {{ expandedSubBranches.searchAds ? '−' : '+' }}
                                </div>
                                <div class="node-title">搜索广告</div>
                                <div class="node-count">(4)</div>
                            </div>
                            
                            <div class="third-level" v-if="expandedSubBranches.searchAds">
                                <!-- 关键字 -->
                                <div class="third-level-container">
                                    <div class="third-line"></div>
                                    <div class="third-level-node" @click="toggleThirdLevel('keywords')">
                                        <div class="expand-icon" :class="{ 'expanded': expandedThirdLevel.keywords }">
                                            {{ expandedThirdLevel.keywords ? '−' : '+' }}
                                        </div>
                                        <div class="node-title">关键字</div>
                                        <div class="node-count">(4)</div>
                                    </div>
                                    
                                    <div class="fourth-level" v-if="expandedThirdLevel.keywords">
                                        <div class="fourth-level-container">
                                            <div class="fourth-line"></div>
                                            <div class="fourth-level-node" @click="toggleFourthLevel('keywordTypes')">
                                                <div class="expand-icon" :class="{ 'expanded': expandedFourthLevel.keywordTypes }">
                                                    {{ expandedFourthLevel.keywordTypes ? '−' : '+' }}
                                                </div>
                                                <div class="node-title">关键字分类</div>
                                                <div class="node-count">(5)</div>
                                            </div>
                                            
                                            <div class="fifth-level" v-if="expandedFourthLevel.keywordTypes">
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">品牌词</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">品类词</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">长尾词</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">竞品词</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">促销词</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="fourth-level-container">
                                            <div class="fourth-line"></div>
                                            <div class="fourth-level-node" @click="toggleFourthLevel('matchTypes')">
                                                <div class="expand-icon" :class="{ 'expanded': expandedFourthLevel.matchTypes }">
                                                    {{ expandedFourthLevel.matchTypes ? '−' : '+' }}
                                                </div>
                                                <div class="node-title">匹配方式</div>
                                                <div class="node-count">(4)</div>
                                            </div>
                                            
                                            <div class="fifth-level" v-if="expandedFourthLevel.matchTypes">
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">广泛匹配</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">词组匹配</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">完全匹配</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">否定关键字</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="fourth-level-container">
                                            <div class="fourth-line"></div>
                                            <div class="fourth-level-node" @click="toggleFourthLevel('qualityScore')">
                                                <div class="expand-icon" :class="{ 'expanded': expandedFourthLevel.qualityScore }">
                                                    {{ expandedFourthLevel.qualityScore ? '−' : '+' }}
                                                </div>
                                                <div class="node-title">质量得分</div>
                                                <div class="node-count">(3)</div>
                                            </div>
                                            
                                            <div class="fifth-level" v-if="expandedFourthLevel.qualityScore">
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">广告相关性</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">预估点击率</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">着陆页体验</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="fourth-level-container">
                                            <div class="fourth-line"></div>
                                            <div class="fourth-level-node" @click="toggleFourthLevel('biddingStrategy')">
                                                <div class="expand-icon" :class="{ 'expanded': expandedFourthLevel.biddingStrategy }">
                                                    {{ expandedFourthLevel.biddingStrategy ? '−' : '+' }}
                                                </div>
                                                <div class="node-title">出价方式</div>
                                                <div class="node-count">(3)</div>
                                            </div>
                                            
                                            <div class="fifth-level" v-if="expandedFourthLevel.biddingStrategy">
                                                <div class="fifth-level-container">
                                                    <div class="fifth-line"></div>
                                                    <div class="fifth-level-node" @click="toggleFifthLevel('manualBidding')">
                                                        <div class="expand-icon" :class="{ 'expanded': expandedFifthLevel.manualBidding }">
                                                            {{ expandedFifthLevel.manualBidding ? '−' : '+' }}
                                                        </div>
                                                        <div class="node-title">手动出价</div>
                                                        <div class="node-count">(1)</div>
                                                    </div>
                                                    
                                                    <div class="sixth-level" v-if="expandedFifthLevel.manualBidding">
                                                        <div class="sixth-level-node">
                                                            <div class="sixth-line"></div>
                                                            <div class="node-title">CPC</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="fifth-level-container">
                                                    <div class="fifth-line"></div>
                                                    <div class="fifth-level-node" @click="toggleFifthLevel('autoBidding')">
                                                        <div class="expand-icon" :class="{ 'expanded': expandedFifthLevel.autoBidding }">
                                                            {{ expandedFifthLevel.autoBidding ? '−' : '+' }}
                                                        </div>
                                                        <div class="node-title">自动出价</div>
                                                        <div class="node-count">(2)</div>
                                                    </div>
                                                    
                                                    <div class="sixth-level" v-if="expandedFifthLevel.autoBidding">
                                                        <div class="sixth-level-node">
                                                            <div class="sixth-line"></div>
                                                            <div class="node-title">尽可能提高转化价值 (Troas可选)</div>
                                                        </div>
                                                        <div class="sixth-level-node">
                                                            <div class="sixth-line"></div>
                                                            <div class="node-title">尽可能提高点击化次数 (TCPA可选)</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">组合出价</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 广告语 -->
                                <div class="third-level-container">
                                    <div class="third-line"></div>
                                    <div class="third-level-node" @click="toggleThirdLevel('adCopy')">
                                        <div class="expand-icon" :class="{ 'expanded': expandedThirdLevel.adCopy }">
                                            {{ expandedThirdLevel.adCopy ? '−' : '+' }}
                                        </div>
                                        <div class="node-title">广告语</div>
                                        <div class="node-count">(3)</div>
                                    </div>
                                    
                                    <div class="fourth-level" v-if="expandedThirdLevel.adCopy">
                                        <div class="fourth-level-container">
                                            <div class="fourth-line"></div>
                                            <div class="fourth-level-node" @click="toggleFourthLevel('headlines')">
                                                <div class="expand-icon" :class="{ 'expanded': expandedFourthLevel.headlines }">
                                                    {{ expandedFourthLevel.headlines ? '−' : '+' }}
                                                </div>
                                                <div class="node-title">标题</div>
                                                <div class="node-count">(2)</div>
                                            </div>
                                            
                                            <div class="fifth-level" v-if="expandedFourthLevel.headlines">
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">插入关键字、倒计时、地理位置</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">优化轮播</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="fourth-level-container">
                                            <div class="fourth-line"></div>
                                            <div class="fourth-level-node" @click="toggleFourthLevel('descriptions')">
                                                <div class="expand-icon" :class="{ 'expanded': expandedFourthLevel.descriptions }">
                                                    {{ expandedFourthLevel.descriptions ? '−' : '+' }}
                                                </div>
                                                <div class="node-title">描述</div>
                                                <div class="node-count">(1)</div>
                                            </div>
                                            
                                            <div class="fifth-level" v-if="expandedFourthLevel.descriptions">
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">关键字匹配度</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="fourth-level-container">
                                            <div class="fourth-line"></div>
                                            <div class="fourth-level-node" @click="toggleFourthLevel('landingPages')">
                                                <div class="expand-icon" :class="{ 'expanded': expandedFourthLevel.landingPages }">
                                                    {{ expandedFourthLevel.landingPages ? '−' : '+' }}
                                                </div>
                                                <div class="node-title">着陆页</div>
                                                <div class="node-count">(2)</div>
                                            </div>
                                            
                                            <div class="fifth-level" v-if="expandedFourthLevel.landingPages">
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">加载速度</div>
                                                </div>
                                                <div class="fifth-level-node">
                                                    <div class="fifth-line"></div>
                                                    <div class="node-title">文本内容匹配</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 受众信号 -->
                                <div class="third-level-container">
                                    <div class="third-line"></div>
                                    <div class="third-level-node" @click="toggleThirdLevel('audienceSignals')">
                                        <div class="expand-icon" :class="{ 'expanded': expandedThirdLevel.audienceSignals }">
                                            {{ expandedThirdLevel.audienceSignals ? '−' : '+' }}
                                        </div>
                                        <div class="node-title">受众信号</div>
                                        <div class="node-count">(2)</div>
                                    </div>
                                    
                                    <div class="fourth-level" v-if="expandedThirdLevel.audienceSignals">
                                        <div class="fourth-level-node">
                                            <div class="fourth-line"></div>
                                            <div class="node-title">购买意向类</div>
                                        </div>
                                        <div class="fourth-level-node">
                                            <div class="fourth-line"></div>
                                            <div class="node-title">兴趣相关类</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 搜索广告数据维度与优化 -->
                                <div class="third-level-container">
                                    <div class="third-line"></div>
                                    <div class="third-level-node">
                                        <div class="node-title">搜索广告数据维度与优化</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 其他广告类型 -->
                        <div class="sub-branch-container">
                            <div class="sub-line"></div>
                            <div class="sub-branch-node" @click="toggleSubBranch('shoppingAds')">
                                <div class="expand-icon" :class="{ 'expanded': expandedSubBranches.shoppingAds }">
                                    {{ expandedSubBranches.shoppingAds ? '−' : '+' }}
                                </div>
                                <div class="node-title">购物广告</div>
                                <div class="node-count">(3)</div>
                            </div>
                            
                            <div class="third-level" v-if="expandedSubBranches.shoppingAds">
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">Feed设置</div>
                                </div>
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">标题优化</div>
                                </div>
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">图片管理</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sub-branch-container">
                            <div class="sub-line"></div>
                            <div class="sub-branch-node" @click="toggleSubBranch('pmaxAds')">
                                <div class="expand-icon" :class="{ 'expanded': expandedSubBranches.pmaxAds }">
                                    {{ expandedSubBranches.pmaxAds ? '−' : '+' }}
                                </div>
                                <div class="node-title">PMax广告</div>
                                <div class="node-count">(3)</div>
                            </div>
                            
                            <div class="third-level" v-if="expandedSubBranches.pmaxAds">
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">系列结构</div>
                                </div>
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">受众信号</div>
                                </div>
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">素材内容</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sub-branch-container">
                            <div class="sub-line"></div>
                            <div class="sub-branch-node" @click="toggleSubBranch('demandGenAds')">
                                <div class="expand-icon" :class="{ 'expanded': expandedSubBranches.demandGenAds }">
                                    {{ expandedSubBranches.demandGenAds ? '−' : '+' }}
                                </div>
                                <div class="node-title">Demand Gen广告</div>
                                <div class="node-count">(3)</div>
                            </div>
                            
                            <div class="third-level" v-if="expandedSubBranches.demandGenAds">
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">广告类型</div>
                                </div>
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">素材内容</div>
                                </div>
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">受众分层</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sub-branch-container">
                            <div class="sub-line"></div>
                            <div class="sub-branch-node" @click="toggleSubBranch('videoAds')">
                                <div class="expand-icon" :class="{ 'expanded': expandedSubBranches.videoAds }">
                                    {{ expandedSubBranches.videoAds ? '−' : '+' }}
                                </div>
                                <div class="node-title">视频广告</div>
                                <div class="node-count">(2)</div>
                            </div>
                            
                            <div class="third-level" v-if="expandedSubBranches.videoAds">
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">广告类型</div>
                                </div>
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">内容要素</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sub-branch-container">
                            <div class="sub-line"></div>
                            <div class="sub-branch-node" @click="toggleSubBranch('remarketingAds')">
                                <div class="expand-icon" :class="{ 'expanded': expandedSubBranches.remarketingAds }">
                                    {{ expandedSubBranches.remarketingAds ? '−' : '+' }}
                                </div>
                                <div class="node-title">再营销广告</div>
                                <div class="node-count">(2)</div>
                            </div>
                            
                            <div class="third-level" v-if="expandedSubBranches.remarketingAds">
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">受众列表</div>
                                </div>
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">广告类型</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 分支2: 网站优化排查 -->
                <div class="branch-container">
                    <div class="center-line"></div>
                    <div class="main-branch-node">
                        <div class="node-title">网站优化排查</div>
                    </div>
                </div>
                
                <!-- 分支3: 新账户前期设置与关联 -->
                <div class="branch-container">
                    <div class="center-line"></div>
                    <div class="main-branch-node">
                        <div class="node-title">新账户前期设置与关联 (ads、ga4、gmc)</div>
                    </div>
                </div>
                
                <!-- 分支4: Google广告账户结构框架 -->
                <div class="branch-container">
                    <div class="center-line"></div>
                    <div class="main-branch-node">
                        <div class="node-title">Google广告账户结构框架</div>
                    </div>
                </div>
                
                <!-- 分支5: Google报表创建逻辑 -->
                <div class="branch-container">
                    <div class="center-line"></div>
                    <div class="main-branch-node" @click="toggleBranch('reportCreation')">
                        <div class="expand-icon" :class="{ 'expanded': expandedBranches.reportCreation }">
                            {{ expandedBranches.reportCreation ? '−' : '+' }}
                        </div>
                        <div class="node-title">Google报表创建逻辑</div>
                        <div class="node-count">(2)</div>
                    </div>
                    
                    <div class="sub-branches" v-if="expandedBranches.reportCreation">
                        <div class="sub-branch-container">
                            <div class="sub-line"></div>
                            <div class="sub-branch-node">
                                <div class="node-title">数据整理(新客户)</div>
                            </div>
                        </div>
                        <div class="sub-branch-container">
                            <div class="sub-line"></div>
                            <div class="sub-branch-node" @click="toggleSubBranch('advertising')">
                                <div class="expand-icon" :class="{ 'expanded': expandedSubBranches.advertising }">
                                    {{ expandedSubBranches.advertising ? '−' : '+' }}
                                </div>
                                <div class="node-title">广告</div>
                                <div class="node-count">(2)</div>
                            </div>
                            
                            <div class="third-level" v-if="expandedSubBranches.advertising">
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">客户数据分析表-datastudio</div>
                                </div>
                                <div class="third-level-node">
                                    <div class="third-line"></div>
                                    <div class="node-title">客户数据汇总表-google sheet</div>
                                </div>
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

// 展开状态管理
const expandedBranches = ref({
    googleAds: false,
    websiteOptimization: false,
    accountSetup: false,
    accountStructure: false,
    reportCreation: false
})

const expandedSubBranches = ref({
    searchAds: false,
    shoppingAds: false,
    pmaxAds: false,
    demandGenAds: false,
    videoAds: false,
    remarketingAds: false,
    advertising: false
})

const expandedThirdLevel = ref({
    keywords: false,
    adCopy: false,
    audienceSignals: false
})

const expandedFourthLevel = ref({
    keywordTypes: false,
    matchTypes: false,
    qualityScore: false,
    biddingStrategy: false,
    headlines: false,
    descriptions: false,
    landingPages: false
})

const expandedFifthLevel = ref({
    manualBidding: false,
    autoBidding: false
})

// 切换主分支展开状态
const toggleBranch = (branchKey) => {
    expandedBranches.value[branchKey] = !expandedBranches.value[branchKey]
}

// 切换子分支展开状态
const toggleSubBranch = (subBranchKey) => {
    expandedSubBranches.value[subBranchKey] = !expandedSubBranches.value[subBranchKey]
}

// 切换三级分支展开状态
const toggleThirdLevel = (thirdLevelKey) => {
    expandedThirdLevel.value[thirdLevelKey] = !expandedThirdLevel.value[thirdLevelKey]
}

// 切换四级分支展开状态
const toggleFourthLevel = (fourthLevelKey) => {
    expandedFourthLevel.value[fourthLevelKey] = !expandedFourthLevel.value[fourthLevelKey]
}

// 切换五级分支展开状态
const toggleFifthLevel = (fifthLevelKey) => {
    expandedFifthLevel.value[fifthLevelKey] = !expandedFifthLevel.value[fifthLevelKey]
}
</script>

<style scoped>
.mindmap-container {
    min-height: 100vh;
    background: #ffffff;
    padding: 30px;
    font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
    overflow: auto;
}

.mindmap-header {
    text-align: center;
    margin-bottom: 50px;
    color: #333;
}

.mindmap-header h1 {
    font-size: 2.5em;
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-weight: 600;
}

.mindmap-header p {
    font-size: 1.1em;
    color: #666;
    margin: 0;
}

.mindmap-content {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
}

/* 中心节点 */
.center-node {
    background: #4a90e2;
    color: white;
    padding: 25px 35px;
    border-radius: 15px;
    box-shadow: 0 8px 25px rgba(74, 144, 226, 0.3);
    z-index: 10;
    min-width: 150px;
    text-align: center;
    border: 3px solid #357abd;
    margin-bottom: 20px;
}

.center-node .node-title {
    font-size: 1.4em;
    font-weight: 600;
    margin: 0;
}

/* 主分支容器 */
.main-branches {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 60px;
    width: 100%;
}

.branch-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

/* 主分支节点 */
.main-branch-node {
    background: #f8f9fa;
    color: #333;
    padding: 15px 20px;
    border-radius: 12px;
    border: 2px solid #4a90e2;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    min-width: 250px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.main-branch-node:hover {
    background: #e3f2fd;
    transform: scale(1.02);
}

.main-branch-node .node-title {
    font-size: 1.1em;
    font-weight: 600;
    margin: 0;
    line-height: 1.3;
    flex: 1;
}

/* 展开图标 */
.expand-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4a90e2;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.expand-icon:hover {
    background: #357abd;
    transform: scale(1.1);
}

.expand-icon.expanded {
    background: #e74c3c;
}

/* 节点数量样式 */
.node-count {
    background: #f0f0f0;
    color: #666;
    font-size: 0.8em;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 8px;
    font-weight: 500;
    border: 1px solid #ddd;
    flex-shrink: 0;
}

.main-branch-node .node-count {
    background: #e3f2fd;
    color: #1976d2;
    border-color: #bbdefb;
}

.sub-branch-node .node-count {
    background: #f3e5f5;
    color: #7b1fa2;
    border-color: #ce93d8;
}

.third-level-node .node-count {
    background: #e8f5e8;
    color: #388e3c;
    border-color: #a5d6a7;
    font-size: 0.75em;
}

.fourth-level-node .node-count {
    background: #fff3e0;
    color: #f57c00;
    border-color: #ffcc02;
    font-size: 0.7em;
}

.fifth-level-node .node-count {
    background: #fce4ec;
    color: #c2185b;
    border-color: #f8bbd9;
    font-size: 0.65em;
}

/* 连接线到中心 */
.center-line {
    position: absolute;
    left: 50%;
    top: -30px;
    width: 2px;
    height: 30px;
    background: #4a90e2;
    transform: translateX(-50%);
    z-index: 1;
}

/* 子分支 */
.sub-branches {
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    animation: slideDown 0.3s ease;
    width: 100%;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.sub-branch-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.sub-branch-node {
    background: #ffffff;
    color: #333;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #ddd;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    min-width: 200px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.sub-branch-node:hover {
    background: #f0f8ff;
    border-color: #4a90e2;
    transform: scale(1.02);
}

.sub-branch-node .node-title {
    font-size: 0.95em;
    font-weight: 500;
    margin: 0;
    line-height: 1.3;
    flex: 1;
}

/* 子分支连接线 */
.sub-line {
    position: absolute;
    left: 50%;
    top: -15px;
    width: 2px;
    height: 15px;
    background: #4a90e2;
    transform: translateX(-50%);
}

/* 三级分支 */
.third-level {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    animation: slideDown 0.3s ease;
    width: 100%;
}

.third-level-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.third-level-node {
    background: #fafafa;
    color: #444;
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    min-width: 180px;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.third-level-node:hover {
    background: #f5f5f5;
    border-color: #4a90e2;
}

.third-level-node .node-title {
    font-size: 0.9em;
    font-weight: 400;
    margin: 0;
    line-height: 1.2;
    flex: 1;
}

.third-level-node .expand-icon {
    width: 16px;
    height: 16px;
    font-size: 12px;
}

/* 三级连接线 */
.third-line {
    position: absolute;
    left: 50%;
    top: -12px;
    width: 2px;
    height: 12px;
    background: #bbb;
    transform: translateX(-50%);
}

/* 四级分支 */
.fourth-level {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    animation: slideDown 0.3s ease;
    width: 100%;
}

.fourth-level-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.fourth-level-node {
    background: #f5f5f5;
    color: #555;
    padding: 8px 10px;
    border-radius: 5px;
    border: 1px solid #ddd;
    min-width: 160px;
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.fourth-level-node:hover {
    background: #f0f0f0;
    border-color: #4a90e2;
}

.fourth-level-node .node-title {
    font-size: 1.1em;
    font-weight: 500;
    margin: 0;
    line-height: 1.2;
    flex: 1;
}

.fourth-level-node .expand-icon {
    width: 14px;
    height: 14px;
    font-size: 10px;
}

.fourth-line {
    position: absolute;
    left: 50%;
    top: -10px;
    width: 2px;
    height: 10px;
    background: #ccc;
    transform: translateX(-50%);
}

/* 五级分支 */
.fifth-level {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    animation: slideDown 0.3s ease;
    width: 100%;
}

.fifth-level-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.fifth-level-node {
    background: #f9f9f9;
    color: #666;
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid #eee;
    min-width: 140px;
    font-size: 0.8em;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.fifth-level-node:hover {
    background: #f0f0f0;
    border-color: #4a90e2;
}

.fifth-level-node .node-title {
    font-size: 1em;
    font-weight: 500;
    margin: 0;
    line-height: 1.2;
    flex: 1;
}

.fifth-level-node .expand-icon {
    width: 12px;
    height: 12px;
    font-size: 8px;
}

.fifth-line {
    position: absolute;
    left: 50%;
    top: -8px;
    width: 2px;
    height: 8px;
    background: #ddd;
    transform: translateX(-50%);
}

/* 六级分支 */
.sixth-level {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    animation: slideDown 0.3s ease;
    width: 100%;
}

.sixth-level-node {
    background: #fcfcfc;
    color: #777;
    padding: 5px 6px;
    border-radius: 3px;
    border: 1px solid #f0f0f0;
    min-width: 120px;
    font-size: 0.75em;
    text-align: center;
}

.sixth-level-node .node-title {
    font-size: 0.75em;
    font-weight: 400;
    margin: 0;
    line-height: 1.1;
}

.sixth-line {
    position: absolute;
    left: 50%;
    top: -6px;
    width: 2px;
    height: 6px;
    background: #eee;
    transform: translateX(-50%);
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .mindmap-content {
        max-width: 100%;
        padding: 0 20px;
    }
}

@media (max-width: 768px) {
    .mindmap-container {
        padding: 15px;
    }
    
    .main-branch-node {
        min-width: 200px;
        font-size: 0.9em;
    }
    
    .sub-branch-node {
        min-width: 150px;
    }
}
</style>