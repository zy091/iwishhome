<template>
    <div class="layout">
        <Breadcrumb :breadcrumb="breadcrumb" />
        <div class="layout-title">
            <h1 class="title">广告内容管理</h1>
        </div>

        <el-tabs v-model="activeTab" class="tabs-container">
            <!-- 广告形式管理 -->
            <el-tab-pane label="广告形式管理" name="formats">
                <el-card shadow="always" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <el-button type="primary" size="large" @click="openFormatDialog()">新建广告形式</el-button>
                        <el-input v-model="searchFormatQuery" placeholder="按标题或标识符搜索" style="width: 300px;" clearable />
                    </div>
                </el-card>

                <el-card>
                    <template #header>
                        <div class="card-header">广告形式列表</div>
                    </template>
                    <el-table v-loading="loading.formats" :data="filteredAdFormats">
                        <el-table-column prop="title" label="标题" />
                        <el-table-column prop="adsform" label="标识符 (adsform)" />
                        <el-table-column prop="created_at" label="创建时间">
                            <template #default="{ row }">
                                {{ new Date(row.created_at).toLocaleString() }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="180" fixed="right">
                            <template #default="{ row }">
                                <el-button-group>
                                    <el-button type="primary" @click="openFormatDialog(row)">编辑</el-button>
                                    <el-button type="danger" @click="deleteFormat(row)">删除</el-button>
                                </el-button-group>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-tab-pane>

            <!-- 广告课程管理 -->
            <el-tab-pane label="广告课程管理" name="courses">
                <el-card shadow="always" style="margin-bottom: 20px;">
                     <div style="display: flex; justify-content: space-between; align-items: center;">
                        <el-button type="primary" size="large" @click="openCourseDialog()">新建课程</el-button>
                        <el-input v-model="searchCourseQuery" placeholder="按课程标题或标识搜索" style="width: 300px;" clearable />
                    </div>
                </el-card>

                <el-card>
                    <template #header>
                        <div class="card-header">广告课程列表</div>
                    </template>
                    <el-table v-loading="loading.courses" :data="filteredAdCourses">
                        <el-table-column prop="label" label="课程标题 (label)" />
                        <el-table-column prop="name" label="课程标识 (name)" />
                        <el-table-column label="所属广告形式">
                            <template #default="{ row }">
                                {{ row.ad_formats?.title || 'N/A' }}
                            </template>
                        </el-table-column>
                        <el-table-column label="文件">
                            <template #default="{ row }">
                                <el-button v-if="row.document_url" type="primary" size="small" @click="viewAttachment(row)">预览</el-button>
                                <span v-else>未上传</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="180" fixed="right">
                            <template #default="{ row }">
                                <el-button-group>
                                    <el-button type="primary" @click="openCourseDialog(row)">编辑</el-button>
                                    <el-button type="danger" @click="deleteCourse(row)">删除</el-button>
                                </el-button-group>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-tab-pane>
        </el-tabs>

        <!-- 广告形式对话框 -->
        <el-dialog v-model="dialog.formatVisible" :title="isEditMode.format ? '编辑广告形式' : '新建广告形式'" width="500px">
            <el-form :model="currentFormat" label-width="120px">
                <el-form-item label="标题">
                    <el-input v-model="currentFormat.title" placeholder="例如：搜索广告" />
                </el-form-item>
                <el-form-item label="标识符">
                    <el-input v-model="currentFormat.adsform" placeholder="例如：google-search-ads" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialog.formatVisible = false">取消</el-button>
                <el-button type="primary" @click="saveFormat" :loading="saving.format">保存</el-button>
            </template>
        </el-dialog>

        <!-- 广告课程对话框 -->
        <el-dialog v-model="dialog.courseVisible" :title="isEditMode.course ? '编辑课程' : '新建课程'" width="500px">
            <el-form :model="currentCourse" label-width="120px">
                <el-form-item label="课程标题">
                    <el-input v-model="currentCourse.label" placeholder="例如：搜索广告原理" />
                </el-form-item>
                <el-form-item label="课程标识">
                    <el-input v-model="currentCourse.name" placeholder="例如：principle" />
                </el-form-item>
                <el-form-item label="所属广告形式">
                    <el-select v-model="currentCourse.ad_format_id" placeholder="请选择" style="width: 100%">
                        <el-option v-for="format in adFormats" :key="format.id" :label="format.title" :value="format.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="课程文件">
                    <el-upload
                        ref="uploadRef"
                        drag
                        action="#"
                        :auto-upload="false"
                        :limit="1"
                        :on-exceed="handleUploadExceed"
                        :on-change="handleUploadChange"
                        :file-list="fileList"
                    >
                        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                        <div class="el-upload__text">
                            将文件拖到此处，或<em>点击上传</em>
                        </div>
                        <template #tip>
                            <div class="el-upload__tip">
                                <div v-if="!fileList.length && currentCourse.document_url" style="margin-bottom: 5px;">
                                    当前文件: <el-link :href="currentCourse.document_url" type="primary" target="_blank">{{ getFileName(currentCourse.document_url) }}</el-link>
                                </div>
                                <span>支持所有文本型、图片、视频等文件, 且不超过100MB</span>
                            </div>
                        </template>
                    </el-upload>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialog.courseVisible = false">取消</el-button>
                <el-button type="primary" @click="saveCourse" :loading="saving.course">保存</el-button>
            </template>
        </el-dialog>

        <!-- 附件预览对话框 -->
        <el-dialog v-model="attachmentDialogVisible" title="附件预览" width="80%" destroy-on-close>
            <div class="attachment-preview">
                <template v-if="isImageAttachment">
                    <img :src="previewUrl" class="attachment-image" @click="openFullscreen" />
                </template>
                <template v-else-if="isPdfAttachment">
                    <iframe :src="previewUrl" class="attachment-frame"></iframe>
                </template>
                <template v-else-if="isWordAttachment">
                    <iframe :src="wordPreviewUrl" class="word-preview-frame"></iframe>
                </template>
                <template v-else>
                    <div class="attachment-download">
                        <p>无法预览此类型的文件，请下载后查看</p>
                        <el-button type="primary" @click="downloadAttachment">下载附件</el-button>
                    </div>
                </template>
            </div>
            <template #footer>
                <el-button @click="attachmentDialogVisible = false">关闭</el-button>
                <el-button v-if="isImageAttachment || isPdfAttachment" type="primary" @click="openFullscreen">
                    全屏查看
                </el-button>
            </template>
        </el-dialog>

        <!-- 全屏预览对话框 -->
        <el-dialog v-model="fullscreenVisible" title="全屏预览" width="100%" top="0" :show-close="true" destroy-on-close class="fullscreen-dialog">
            <div class="fullscreen-preview">
                <template v-if="isImageAttachment">
                    <img :src="previewUrl" class="fullscreen-image" />
                </template>
                <template v-else-if="isPdfAttachment">
                    <iframe :src="previewUrl" class="fullscreen-frame"></iframe>
                </template>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { supabase } from '@/lib/supabaseClient';
import Breadcrumb from '@/components/system/Breadcrumb.vue';

const breadcrumb = reactive([
    {
        name: '数据管理',
        path: ''
    },
    {
        name: '广告内容管理',
        path: '/system/admin-ads-management'
    }
])

const activeTab = ref('formats');
const loading = reactive({ formats: false, courses: false });
const saving = reactive({ format: false, course: false });
const dialog = reactive({ formatVisible: false, courseVisible: false });
const isEditMode = reactive({ format: false, course: false });

// 广告形式
const adFormats = ref<any[]>([]);
const currentFormat = ref<any>({});
const searchFormatQuery = ref('');

const filteredAdFormats = computed(() => {
    if (!searchFormatQuery.value) {
        return adFormats.value;
    }
    return adFormats.value.filter(format =>
        (format.title && format.title.toLowerCase().includes(searchFormatQuery.value.toLowerCase())) ||
        (format.adsform && format.adsform.toLowerCase().includes(searchFormatQuery.value.toLowerCase()))
    );
});

// 广告课程
const adCourses = ref<any[]>([]);
const currentCourse = ref<any>({});
const searchCourseQuery = ref('');

const filteredAdCourses = computed(() => {
    if (!searchCourseQuery.value) {
        return adCourses.value;
    }
    return adCourses.value.filter(course =>
        (course.label && course.label.toLowerCase().includes(searchCourseQuery.value.toLowerCase())) ||
        (course.name && course.name.toLowerCase().includes(searchCourseQuery.value.toLowerCase()))
    );
});

// 文件上传
const uploadRef = ref<UploadInstance>();
const fileList = ref<any[]>([]);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const uploadProgress = ref(0);

// 预览相关
const attachmentDialogVisible = ref(false);
const fullscreenVisible = ref(false);
const previewUrl = ref('');
const wordPreviewUrl = ref('');

const getFileExtension = (url: string) => {
    if (!url) return '';
    return url.split('.').pop()?.toLowerCase() || '';
};

const isImageAttachment = computed(() => {
    const ext = getFileExtension(previewUrl.value);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
});

const isPdfAttachment = computed(() => getFileExtension(previewUrl.value) === 'pdf');

const isWordAttachment = computed(() => {
    const ext = getFileExtension(previewUrl.value);
    return ['doc', 'docx'].includes(ext);
});

const viewAttachment = (course: any) => {
    if (course.document_url) {
        previewUrl.value = course.document_url;
        if (isWordAttachment.value) {
            wordPreviewUrl.value = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl.value)}`;
        }
        attachmentDialogVisible.value = true;
    }
};

const downloadAttachment = () => {
    if (previewUrl.value) {
        window.open(previewUrl.value, '_blank');
    }
};

const openFullscreen = () => {
    fullscreenVisible.value = true;
};


const getFileName = (url: string) => {
    if (!url) return '';
    try {
        const urlObject = new URL(url);
        const pathParts = urlObject.pathname.split('/');
        return decodeURIComponent(pathParts[pathParts.length - 1]);
    } catch (e) {
        return url; // fallback to showing the full url
    }
};

// 获取所有广告形式
const fetchAdFormats = async () => {
    loading.formats = true;
    try {
        const { data, error } = await supabase.from('ad_formats').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        adFormats.value = data;
    } catch (error: any) {
        ElMessage.error('获取广告形式失败: ' + error.message);
    } finally {
        loading.formats = false;
    }
};

// 获取所有广告课程
const fetchAdCourses = async () => {
    loading.courses = true;
    try {
        const { data, error } = await supabase.from('ad_courses').select('*, ad_formats(title)').order('created_at', { ascending: false });
        if (error) throw error;
        adCourses.value = data;
    } catch (error: any) {
        ElMessage.error('获取广告课程失败: ' + error.message);
    } finally {
        loading.courses = false;
    }
};

// 打开广告形式对话框
const openFormatDialog = (format: any = null) => {
    isEditMode.format = !!format;
    currentFormat.value = format ? { ...format } : { title: '', adsform: '' };
    dialog.formatVisible = true;
};

// 保存广告形式
const saveFormat = async () => {
    saving.format = true;
    try {
        // 在upsert时，如果是更新操作，则需要包含id。
        const { created_at, ...upsertData } = currentFormat.value;
        const { error } = await supabase.from('ad_formats').upsert(upsertData);
        if (error) throw error;
        ElMessage.success('广告形式保存成功');
        dialog.formatVisible = false;
        fetchAdFormats();
    } catch (error: any) {
        ElMessage.error('保存失败: ' + error.message);
    } finally {
        saving.format = false;
    }
};

// 删除广告形式
const deleteFormat = async (format: any) => {
    try {
        await ElMessageBox.confirm(`确定要删除广告形式 "${format.title}" 吗？其下的所有课程也将被删除。`, '警告', { type: 'warning' });
        const { error } = await supabase.from('ad_formats').delete().eq('id', format.id);
        if (error) throw error;
        ElMessage.success('删除成功');
        fetchAdFormats();
        fetchAdCourses(); // 重新加载课程
    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败: ' + error.message);
        }
    }
};

// 打开广告课程对话框
const openCourseDialog = (course: any = null) => {
    isEditMode.course = !!course;
    currentCourse.value = course ? { ...course } : { label: '', name: '', ad_format_id: null, document_url: null };
    selectedFile.value = null;
    fileList.value = []; // Clear file list
    dialog.courseVisible = true;
};

// 处理文件选择
const handleUploadChange: UploadProps['onChange'] = (uploadFile) => {
    if (uploadFile.raw) {
        selectedFile.value = uploadFile.raw;
    }
};

const handleUploadExceed: UploadProps['onExceed'] = (files) => {
    uploadRef.value!.clearFiles();
    const file = files[0] as UploadRawFile;
    uploadRef.value!.handleStart(file);
};

// 上传文件
const uploadFile = async () => {
    if (!selectedFile.value) return null;

    uploading.value = true;
    uploadProgress.value = 0;

    try {
        const fileExt = selectedFile.value.name.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `word-files/${uniqueFileName}`;

        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, selectedFile.value, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(data.path);
        return urlData.publicUrl;
    } catch (error: any) {
        ElMessage.error('文件上传失败: ' + error.message);
        return null;
    } finally {
        uploading.value = false;
    }
};


// 保存课程
const saveCourse = async () => {
    saving.course = true;
    try {
        let documentUrl = currentCourse.value.document_url;

        // 如果有新文件被选中，则上传
        if (selectedFile.value) {
            const newUrl = await uploadFile();
            if (newUrl) {
                documentUrl = newUrl;
            } else {
                // 上传失败，终止保存
                saving.course = false;
                return;
            }
        }

        // 在upsert时，如果是更新操作，则需要包含id。
        const { created_at, ad_formats, ...upsertData } = currentCourse.value;
        upsertData.document_url = documentUrl;

        const { error } = await supabase.from('ad_courses').upsert(upsertData);
        if (error) throw error;

        ElMessage.success('课程保存成功');
        dialog.courseVisible = false;
        fetchAdCourses();
    } catch (error: any) {
        ElMessage.error('保存失败: ' + error.message);
    } finally {
        saving.course = false;
    }
};

// 删除课程
const deleteCourse = async (course: any) => {
    try {
        await ElMessageBox.confirm(`确定要删除课程 "${course.label}" 吗？`, '警告', { type: 'warning' });
        const { error } = await supabase.from('ad_courses').delete().eq('id', course.id);
        if (error) throw error;
        ElMessage.success('删除成功');
        fetchAdCourses();
    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败: ' + error.message);
        }
    }
};

onMounted(() => {
    fetchAdFormats();
    fetchAdCourses();
});

watch(activeTab, (newTab) => {
    if (newTab === 'formats') {
        fetchAdFormats();
    } else if (newTab === 'courses') {
        fetchAdCourses();
    }
});
</script>

<style scoped>
.attachment-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
}
.attachment-image {
    max-width: 100%;
    max-height: 60vh;
    cursor: pointer;
}
.attachment-frame, .word-preview-frame {
    width: 100%;
    height: 70vh;
    border: none;
}
.attachment-download {
    text-align: center;
}
.fullscreen-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
}
.fullscreen-image {
    max-width: 100%;
    max-height: 100%;
}
.fullscreen-frame {
    width: 100%;
    height: 100%;
    border: none;
}
:deep(.fullscreen-dialog .el-dialog__body) {
    height: calc(100vh - 54px); /* 54px is header height */
    padding: 0;
}
:deep(.fullscreen-dialog .el-dialog__header) {
    padding: 10px 20px;
}
.layout {
    /* padding: 20px; */
}
.layout-title {
    margin-bottom: 20px;
}
.title {
    font-size: 24px;
    font-weight: bold;
}
.tabs-container {
    margin-bottom: 20px;
}
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 500;
}
</style>