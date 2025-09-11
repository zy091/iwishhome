<template>
    <div class="register-container">
        <div class="register-header">
            <h1>申请企业邮箱、注册飞书账号</h1>
        </div>

        <div class="register-content">
            <!-- 企业邮箱申请 -->
            <div class="register-section">
                <div class="section-header">
                    <div class="section-number">1</div>
                    <h2>企业邮箱申请</h2>
                </div>
                <div class="section-content">
                    <p class="highlight-text">
                        入职当天找Helen开通企业邮箱
                    </p>
                </div>
            </div>

            <!-- 飞书账号注册 -->
            <div class="register-section">
                <div class="section-header">
                    <div class="section-number">2</div>
                    <h2>注册飞书账号</h2>
                </div>
                <div class="section-content">
                    <p class="description">
                        入职当天注册并加入到公司企业飞书（深圳艾维品牌营销有限公司）
                    </p>

                    <div class="steps-container">
                        <div class="step-item">
                            <h3>a. 下载和安装飞书客户端</h3>
                            <p>
                                官方参考链接：
                                <a href="https://www.feishu.cn/hc/zh-CN/articles/360025035993-%E4%B8%8B%E8%BD%BD%E5%92%8C%E5%AE%89%E8%A3%85%E9%A3%9E%E4%B9%A6%E5%AE%A2%E6%88%B7%E7%AB%AF"
                                    target="_blank" class="link-button">
                                    点击进入
                                </a>
                            </p>
                        </div>

                        <div class="step-item">
                            <h3>b. 加入企业飞书</h3>
                            <p class="description">
                                以下为深圳艾维品牌营销有限公司飞书二维码，请参考学习链接中 "方式 2：通过企业二维码" 加入
                            </p>

                            <!-- 飞书二维码 -->
                            <div class="qr-code-container">
                                <div class="qr-code">
                                    <div class="qr-placeholder">
                                            <img width="300px" src="@/assets/home-image/feishu.png" alt="飞书">
                                    </div>
                                </div>


                            </div>

                            <div class="learning-links">
                                <p>
                                    新用户入门：
                                    <a href="https://www.feishu.cn/hc/zh-CN/category/7303381511270072348-%E6%96%B0%E7%94%A8%E6%88%B7%E5%85%A5%E9%97%A8"
                                        target="_blank" class="link-button">
                                        官方学习链接
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

</script>

<style scoped>
.register-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.register-header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 3px solid #3498db;
}

.register-header h1 {
    color: #2c3e50;
    font-size: 2.5em;
    font-weight: 600;
    margin: 0;
}

.register-content {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.register-section {
    border-bottom: 1px solid #e9ecef;

    &:last-child {
        border-bottom: none;
    }
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

.highlight-text {
    font-size: 1.2em;
    color: #e74c3c;
    font-weight: 600;
    background: #fff5f5;
    padding: 15px 20px;
    border-radius: 8px;
    border-left: 4px solid #e74c3c;
    margin: 0;
}

.description {
    font-size: 1.1em;
    color: #495057;
    line-height: 1.6;
    margin-bottom: 25px;
}

.steps-container {
    margin-top: 20px;
}

.step-item {
    margin-bottom: 30px;

    &:last-child {
        margin-bottom: 0;
    }
}

.step-item h3 {
    color: #2c3e50;
    font-size: 1.3em;
    font-weight: 600;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 2px solid #3498db;
    display: inline-block;
}

.step-item p {
    color: #495057;
    line-height: 1.6;
    margin-bottom: 15px;
}

.link-button {
    display: inline-block;
    background: #3498db;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s ease;
    margin-left: 8px;

    &:hover {
        background: #2980b9;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }
}

.qr-code-container {
    margin: 25px 0;
    display: flex;
    justify-content: center;
}

.qr-code-card {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    max-width: 300px;
    width: 100%;
}

.company-info {
    display: flex;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e9ecef;
}

.company-icon {
    margin-right: 15px;
}

.icon-placeholder {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #3498db, #2980b9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
}

.company-details {
    text-align: left;
}

.company-name {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 5px;
}

.company-name-full {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
}

.qr-code {
    margin-bottom: 20px;
}

.qr-placeholder {
    background: #f8f9fa;
    border: 2px solid #dee2e6;
    /* border-radius: 8px; */
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    position: relative;
}


.feishu-logo {
    color: #1890ff;
    font-weight: bold;
    font-size: 14px;
}

.qr-info {
    color: #6c757d;
}

.qr-text {
    margin: 5px 0;
    font-size: 14px;
}

.learning-links {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e9ecef;
}

.learning-links p {
    margin: 0;
    font-size: 1em;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .register-container {
        padding: 15px;
    }

    .register-header h1 {
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

    .qr-code-card {
        padding: 20px;
        max-width: 280px;
    }

    .qr-placeholder {
        width: 180px;
        height: 180px;
    }

    .company-info {
        flex-direction: column;
        text-align: center;
    }

    .company-icon {
        margin-right: 0;
        margin-bottom: 10px;
    }

    .company-details {
        text-align: center;
    }
}
</style>