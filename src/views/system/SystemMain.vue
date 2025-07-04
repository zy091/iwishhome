<template>
    <div class="common-layout">
        <el-container direction="vertical" style="height: 100vh;">
            <Header />
            <el-container style="margin-top: 84px;">
                <el-aside width="240px">
                    <Aside />
                </el-aside>
                <el-container>
                    <el-main>
                        <div class="page-container">
                            <Suspense>
                                <template #default>
                                    <RouterView></RouterView>
                                </template>
                                <template #fallback>
                                    <div class="loading-container">
                                        <el-skeleton :rows="3" animated />
                                    </div>
                                </template>
                            </Suspense>
                        </div>
                        <!-- <ul>
                        <li v-for="instrument in instruments" :key="instrument.id">{{ instrument.name }}</li>
                        </ul> -->
                    </el-main>
                    <!-- <el-footer>Footer</el-footer> -->
                </el-container>
            </el-container>
        </el-container>
    </div>
</template>

<script setup lang="ts">
import Header from '@/components/system/Header.vue'
import Aside from '@/components/system/Aside.vue'


import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

const instruments = ref<{ id: number; name: string }[]>([])

async function getInstruments() {
    const { data } = await supabase.from('instruments').select()
    instruments.value = data || []
}

// onMounted(() => {
//     getInstruments()
// })
</script>

<style scoped>
.loading-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>