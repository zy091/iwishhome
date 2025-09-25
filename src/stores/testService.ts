import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient';

// 测试类型定义
export interface Test {
    id: string
    title: string
    type: string
    platform?: string
    chapter?: string
    question_count?: number
    score_weight?: number
    created_at?: string
    updated_at?: string
}

// 用户测试记录类型定义
export interface UserTest {
    id: string
    user_id: string
    test_id: string
    completion_status: 'not_started' | 'in_progress' | 'completed'
    latest_score?: number
    started_at?: string
    completed_at?: string
    attempt_count?: number
}

// 测试列表查询参数
export interface TestQueryParams {
    page?: number
    pageSize?: number
    searchQuery?: string
    testType?: string
    platform?: string
    chapter?: string
}

// 测试列表响应
export interface TestsResponse {
    data: Test[]
    total: number
}

// 测试服务
export const useTestStore = defineStore('test', () => {
    const loading = ref(false)
    const error = ref<string | null>(null)

    // 获取测试列表
    const getTests = async (params?: TestQueryParams): Promise<TestsResponse> => {
        loading.value = true
        error.value = null

        try {
            let query = supabase
                .from('tests')
                .select('*', { count: 'exact' })

            // 添加搜索条件
            if (params?.searchQuery) {
                query = query.ilike('title', `%${params.searchQuery}%`)
            }

            // 按类型筛选
            if (params?.testType) {
                query = query.eq('type', params.testType)
            }

            // 按平台筛选
            if (params?.platform) {
                query = query.eq('platform', params.platform)
            }

            // 添加分页
            if (params?.page && params?.pageSize) {
                const from = (params.page - 1) * params.pageSize
                const to = from + params.pageSize - 1
                query = query.range(from, to)
            }

            // 按创建时间排序
            query = query.order('created_at', { ascending: false })

            const { data, error: err, count } = await query

            if (err) throw err

            return {
                data: data as Test[],
                total: count || 0
            }
        } catch (err: any) {
            error.value = err.message
            return {
                data: [],
                total: 0
            }
        } finally {
            loading.value = false
        }
    }

    // 获取单个测试详情
    const getTestById = async (id: string): Promise<Test | null> => {
        loading.value = true
        error.value = null

        try {
            const { data, error: err } = await supabase
                .from('tests')
                .select('*')
                .eq('id', id)
                .single()

            if (err) throw err

            return data as Test
        } catch (err: any) {
            error.value = err.message
            return null
        } finally {
            loading.value = false
        }
    }

    // 获取用户的测试状态
    const getUserTestStatus = async (testId: string): Promise<UserTest | null> => {
        loading.value = true
        error.value = null

        try {
            const { data: userData, error: userErr } = await supabase.auth.getUser()

            if (userErr) throw userErr

            const userId = userData.user?.id

            if (!userId) {
                throw new Error('用户未登录')
            }

            const { data, error: err } = await supabase
                .from('user_tests')
                .select('*')
                .eq('user_id', userId)
                .eq('test_id', testId)
                .single()

            if (err && err.code !== 'PGRST116') { // PGRST116 是未找到记录的错误码
                throw err
            }

            return data as UserTest || null
        } catch (err: any) {
            error.value = err.message
            return null
        } finally {
            loading.value = false
        }
    }

    // 更新用户测试状态
    const updateUserTestStatus = async (testId: string, status: Partial<UserTest>): Promise<UserTest | null> => {
        loading.value = true
        error.value = null

        try {
            const { data: userData, error: userErr } = await supabase.auth.getUser()

            if (userErr) throw userErr

            const userId = userData.user?.id

            if (!userId) {
                throw new Error('用户未登录')
            }

            // 首先检查记录是否存在
            const { data: existingData, error: existingErr } = await supabase
                .from('user_tests')
                .select('*')
                .eq('user_id', userId)
                .eq('test_id', testId)
                .single()

            let result

            if (existingErr && existingErr.code === 'PGRST116') {
                // 记录不存在，创建新记录
                const { data, error: insertErr } = await supabase
                    .from('user_tests')
                    .insert({
                        user_id: userId,
                        test_id: testId,
                        ...status
                    })
                    .select()
                    .single()

                if (insertErr) throw insertErr

                result = data
            } else {
                // 记录存在，更新记录
                const { data, error: updateErr } = await supabase
                    .from('user_tests')
                    .update(status)
                    .eq('user_id', userId)
                    .eq('test_id', testId)
                    .select()
                    .single()

                if (updateErr) throw updateErr

                result = data
            }

            return result as UserTest
        } catch (err: any) {
            error.value = err.message
            return null
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        getTests,
        getTestById,
        getUserTestStatus,
        updateUserTestStatus
    }
})

// 为组件提供更简单的访问方式
export const testService = {
    getTests: (params?: TestQueryParams) => useTestStore().getTests(params),
    getTestById: (id: string) => useTestStore().getTestById(id),
    getUserTestStatus: (testId: string) => useTestStore().getUserTestStatus(testId),
    updateUserTestStatus: (testId: string, status: Partial<UserTest>) => useTestStore().updateUserTestStatus(testId, status)
} 