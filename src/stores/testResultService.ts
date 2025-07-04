import { defineStore } from 'pinia';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/user';
import { hasViewAllNotesPermission } from '@/stores/studyNoteService';

// 定义测试结果类型
export interface TestResult {
    id?: string;
    user_id: string;
    test_id: string;
    test_title: string;
    score: number;
    is_passed: boolean;
    submitted_at: string;
    completion_status: 'not_started' | 'in_progress' | 'completed';
    is_graded: boolean;
    type: string;
    grader_id?: string;
    grader_full_name?: string;
    grader_email?: string;
    full_name?: string;
    email?: string;
    feedback_text?: string;
    grade_level?: string;
}

// 定义测试答案详情类型
export interface TestAnswerDetail {
    id?: string;
    test_result_id: string;
    question_id: string;
    question_type: string;
    question_text: string;
    answer: string;
    is_correct: boolean | null;
    score?: number;
    question_order: number;
}

// 定义分页请求参数类型
export interface PaginationParams {
    page: number;
    pageSize: number;
}

// 定义测试结果响应类型
export interface TestResultsResponse {
    data: TestResult[];
    total: number;
}

// 定义测试结果详情响应类型
export interface TestResultDetailsResponse {
    testResult: TestResult;
    answerDetails: TestAnswerDetail[];
}

// 定义分页响应类型
export interface PaginatedTestResults {
    data: TestResult[];
    total: number;
    page: number;
    pageSize: number;
}

export const useTestResultStore = defineStore('testResult', {
    state: () => ({
        results: [] as TestResult[],
        currentResult: null as TestResult | null,
        answerDetails: [] as TestAnswerDetail[],
        loading: false,
        total: 0
    }),
    getters: {},
    actions: {}
});

// 创建测试结果服务
export class TestResultService {
    // 获取当前用户的测试结果
    async getUserTestResults(params: PaginationParams): Promise<TestResultsResponse> {
        const userStore = useUserStore();
        const userId = userStore.user?.user_id;

        if (!userId) {
            throw new Error('用户未登录');
        }

        const { page, pageSize } = params;
        const offset = (page - 1) * pageSize;

        // 确保 userId 是有效的 UUID
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
            throw new Error('无效的用户ID格式');
        }

        const { data, error, count } = await supabase
            .from('test_results')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('submitted_at', { ascending: false })
            .range(offset, offset + pageSize - 1);

        if (error) {
            console.error('获取测试结果失败:', error);
            throw error;
        }

        return {
            data: data as TestResult[],
            total: count || 0
        };
    }

    // 获取测试结果详情
    async getTestResultDetails(resultId: string): Promise<TestResultDetailsResponse> {
        // 获取测试结果
        const { data: resultData, error: resultError } = await supabase
            .from('test_results')
            .select('*')
            .eq('id', resultId)
            .single();

        if (resultError) {
            console.error('获取测试结果失败:', resultError);
            throw resultError;
        }

        // 获取答案详情
        const { data: detailsData, error: detailsError } = await supabase
            .from('test_answer_details')
            .select('*')
            .eq('test_result_id', resultId)
            .order('question_order', { ascending: true });

        if (detailsError) {
            console.error('获取答案详情失败:', detailsError);
            throw detailsError;
        }

        return {
            testResult: resultData as TestResult,
            answerDetails: detailsData as TestAnswerDetail[]
        };
    }

    // 提交测试结果
    async submitTestResult(testResult: TestResult, answerDetails: TestAnswerDetail[]): Promise<TestResult> {
        // 1. 添加测试结果
        const { data: resultData, error: resultError } = await supabase
            .from('test_results')
            .insert(testResult)
            .select()
            .single();

        if (resultError) {
            console.error('提交测试结果失败:', resultError);
            throw resultError;
        }

        const newResultId = resultData.id;

        // 2. 添加答案详情
        const detailsWithResultId = answerDetails.map(detail => ({
            ...detail,
            test_result_id: newResultId
        }));

        const { error: detailsError } = await supabase
            .from('test_answer_details')
            .insert(detailsWithResultId);

        if (detailsError) {
            console.error('提交答案详情失败:', detailsError);
            throw detailsError;
        }

        return resultData as TestResult;
    }

    // 使用视图的搜索方法
    async searchTestResultsUsingView(
        query: string,
        options?: {
            startDate?: string;
            endDate?: string;
            page?: number;
            pageSize?: number;
            type?: string;
            is_graded?: boolean;
        }
    ): Promise<PaginatedTestResults> {
        const userStore = useUserStore()
        
        // 使用getUser方法获取最新的用户数据
        const currentUser = userStore.getUser()
        
        if (!currentUser) {
            throw new Error('未登录')
        }
        
        // 确保角色ID存在再检查权限
        const roleId = Number(userStore.roleId)
        if (!hasViewAllNotesPermission(roleId)) {
            throw new Error('没有权限查看所有测试记录');
        }

        const page = options?.page || 1;
        const pageSize = options?.pageSize || 10;

        // 构建基础查询
        let supabaseQuery = supabase
            .from('simple_test_results_view')
            .select('*', { count: 'exact' })

        if (query) {
            supabaseQuery = supabaseQuery
                .or(`test_title.ilike.%${query}%,full_name.ilike.%${query}%`);
        }

        if (options?.type) {
            supabaseQuery = supabaseQuery.eq('type', options.type);
        }
        if (options?.is_graded !== undefined) {
            supabaseQuery = supabaseQuery.eq('is_graded', options.is_graded);
        }

        // 处理日期范围
        if (options?.startDate && options?.endDate) {
            const { startUTC, endUTC } = generateDateRange(options.startDate, options.endDate);
            supabaseQuery = supabaseQuery
                .gte('submitted_at', startUTC)
                .lte('submitted_at', endUTC);
        }

        // 先获取总数
        // const { count } = await supabaseQuery;
        
        // 然后获取分页数据
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize - 1;
        const { data, error ,count} = await supabaseQuery
            .order('submitted_at', { ascending: false })
            .range(startIndex, endIndex);

        if (error) throw error;

        // 转换数据格式以匹配现有结构
        const resultsWithProfiles = (data || []).map(result => ({
            ...result,
            profile: {
                full_name: result.full_name,
                email: result.email
            }
        }));

        return {
            data: resultsWithProfiles,
            total: count || 0,
            page,
            pageSize
        };
    }

    // 删除测试结果
    async deleteTestResult(resultId: string): Promise<void> {
        // 首先删除相关的答案详情
        const { error: detailsError } = await supabase
            .from('test_answer_details')
            .delete()
            .eq('test_result_id', resultId);

        if (detailsError) {
            console.error('删除答案详情失败:', detailsError);
            throw detailsError;
        }

        // 然后删除测试结果
        const { error: resultError } = await supabase
            .from('test_results')
            .delete()
            .eq('id', resultId);

        if (resultError) {
            console.error('删除测试结果失败:', resultError);
            throw resultError;
        }
    }
}

// 辅助函数：生成日期范围
function generateDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 设置时间为当天的开始和结束
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return {
        startUTC: start.toISOString(),
        endUTC: end.toISOString()
    };
}

export const testResultService = new TestResultService(); 