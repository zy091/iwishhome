<template>
    <el-footer class="footer">
        <div class="footer-content">
            <div class="footer-grid">
                <div class="footer-column" style="min-width: 400px;">
                    <img src="../assets/home-image/logo2.png" alt="IWISH" class="footer-logo"
                        style="margin-bottom: 30px;" />
                    <p>电话：13692204062</p>
                    <p>邮箱：marketing@iwishweb.com</p>
                    <p>友情链接：<a href="">谷歌SEO优化</a></p>
                    <div class="social-icons">
                        <a href=""><img src="../assets/home-image/youtube.png" alt=""></a>
                        <a href=""><img src="../assets/home-image/facebook2.png" alt=""></a>
                        <a href=""><img src="../assets/home-image/tiktok.png" alt=""></a>
                        <a href=""><img src="../assets/home-image/zhihu.png" alt=""></a>
                        <a href=""><img src="../assets/home-image/bili.png" alt=""></a>
                        <a href=""><img src="../assets/home-image/xiaochengxu.png" alt=""></a>
                        <a href=""><img src="../assets/home-image/wechat.png" alt=""></a>
                    </div>
                </div>

                <div class="footer-column">
                    <h3>艾维服务</h3>
                    <ul>
                        <li><a href="#">内容运营服务</a></li>
                        <li><a href="#">流量运营服务</a></li>
                        <li><a href="#">网站运营服务</a></li>
                        <li><a href="#">品牌塑造服务</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3>知识分享</h3>
                    <ul>
                        <li><a href="#">网站SEO</a></li>
                        <li><a href="#">网站建设</a></li>
                        <li><a href="#">内容营销</a></li>
                        <li><a href="#">沙龙讲座</a></li>
                        <li><a href="#">公司案例</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3>关于我们</h3>
                    <ul>
                        <li><a href="#">公司简介</a></li>
                        <li><a href="#">最新动态</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3>添加客服</h3>
                    <div class="qr-code">
                        <!-- QR Code image -->
                        <img src="../assets/home-image/scan.png" alt="QR Code" />
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>深圳艾维品牌营销有限公司 © Copyright 2024 All Rights Reserved. 粤ICP备19019201号-1</p>
            </div>
        </div>
    </el-footer>
</template>

<script setup lang="ts">

</script>

<style scoped>
.footer {
    background: #fff;
    padding: 60px 0 20px;
}

.footer-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px 30px;
}

.footer-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 30px;
    margin-bottom: 40px;
}

.footer-column p {
    margin-bottom: 10px;
}

.footer-column h3 {
    font-size: 18px;
    margin-bottom: 20px;
    color: #00367C;
}

.footer-column ul {
    list-style: none;
    padding: 0;
}

.footer-column ul li {
    margin-bottom: 10px;
    color: #666;
    cursor: pointer;
}

.footer-column ul li a:hover {
    color: #1E88E5;
}

.social-icons {
    display: flex;
    gap: 5px;
    margin-top: 20px;
}

.qr-code img {
    width: 120px;
    margin-bottom: 15px;
}

.contact-buttons p {
    margin-bottom: 10px;
    color: #666;
    cursor: pointer;
}

.footer-bottom {
    border-top: 1px solid #ddd;
    padding-top: 20px;
    text-align: center;
    color: #999;
}
</style>