import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'
import { generateDateRange } from '@/utils/dateUtils'

// Define feedback types
export interface Feedback {
    id: string
    user_id: string
    title: string
    content: string
    platform: string
    status: string
    created_at: string
    updated_at: string
    is_show: boolean
}

export interface FeedbackWithUser extends Feedback {
    full_name: string
    email: string
    latest_reply_content: string | null
    latest_reply_time: string | null
    latest_reply_user_name: string | null
    reply_count: number
}

export interface FeedbackReply {
    id: string
    feedback_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
}

export interface FeedbackReplyWithUser extends FeedbackReply {
    full_name: string
    email: string
}

export interface CreateFeedback {
    title: string
    content: string
    platform: string
}

export interface UpdateFeedback {
    title?: string
    content?: string
    platform?: string
    status?: string
    is_show?: boolean
}

export interface PaginatedFeedback {
    data: FeedbackWithUser[]
    total: number
}

// Add role constants (same as in studyNoteService)
export enum UserRole {
    ADMIN = 0,
    OPERATIONS_MANAGER = 1,
    PRODUCT_MANAGER = 11
}

// Check if user has admin permissions
export const hasAdminPermission = (roleId?: number | null): boolean => {
    // 如果没有传入roleId，尝试从userStore或localStorage获取
    if (roleId === undefined || roleId === null) {
        const userStore = useUserStore()
        roleId = Number(userStore.roleId || localStorage.getItem('roleId') )
    }
    console.log(roleId,'roleid============================')
    return roleId !== null && [
        UserRole.ADMIN,
        UserRole.OPERATIONS_MANAGER,
        UserRole.PRODUCT_MANAGER
    ].includes(roleId);
}

export const feedbackService = {
    // Get all feedback (for admins)
    async getAllFeedback(options?: {
        query?: string
        startDate?: string
        endDate?: string
        page?: number
        pageSize?: number
        replyStatus?: string
        platform?: string
        showStatus?: string
    }): Promise<PaginatedFeedback> {
        const userStore = useUserStore()
        const currentUser = userStore.getUser()
        
        if (!currentUser) {
            throw new Error('未登录')
        }
        
        const page = options?.page || 1
        const pageSize = options?.pageSize || 10
        const start = (page - 1) * pageSize
        const end = start + pageSize - 1
        
        // Build query
        let query = supabase
            .from('feedback_with_users')
            .select('*', { count: 'exact' })
        
        // Filter by visibility for non-admin users
        const isAdmin = hasAdminPermission()
        if (!isAdmin) {
            query = query.eq('is_show', true)
        } 
        if (isAdmin && options?.showStatus) {
            // If admin and showStatus filter is provided
            query = query.eq('is_show', options.showStatus === 'true')
            console.log('query', query)
        }
        
        // Filter by search query
        if (options?.query) {
            query = query.or(
                `title.ilike.%${options.query}%,full_name.ilike.%${options.query}%`
            )
        }
        
        // Filter by date range
        if (options?.startDate && options?.endDate) {
            const { startUTC, endUTC } = generateDateRange(options.startDate, options.endDate)
            query = query
                .gte('created_at', startUTC)
                .lte('created_at', endUTC)
        }
        
        // Filter by reply status
        if (options?.replyStatus && options.replyStatus !== 'all') {
            if (options.replyStatus === 'replied') {
                query = query.eq('status', 'resolved')
            } else if (options.replyStatus === 'in_progress') {
                query = query.eq('status', 'in_progress')
            } else if (options.replyStatus === 'pending') {
                query = query.eq('status', 'pending')
            }
        }
        
        // Filter by platform
        if (options?.platform && options.platform !== 'all') {
            query = query.eq('platform', options.platform)
        }
        
        // Paginate results
        query = query
            .order('created_at', { ascending: false })
            .range(start, end)
        
        const { data, error, count } = await query
        
        if (error) {
            console.error('获取反馈失败:', error)
            throw new Error('获取反馈失败')
        }
        
        return {
            data: data as FeedbackWithUser[],
            total: count || 0
        }
    },
    
    // Get personal feedback
    async getPersonalFeedback(options?: {
        page?: number
        pageSize?: number
        platform?: string
    }): Promise<PaginatedFeedback> {
        const userStore = useUserStore()
        const currentUser = userStore.getUser()
        
        if (!currentUser) {
            throw new Error('未登录')
        }
        
        const page = options?.page || 1
        const pageSize = options?.pageSize || 10
        const start = (page - 1) * pageSize
        const end = start + pageSize - 1
        
        // Build query
        let query = supabase
            .from('feedback_with_users')
            .select('*', { count: 'exact' })
            .eq('user_id', currentUser.user_id)
        
        // Filter by visibility for non-admin users
        const isAdmin = hasAdminPermission()
        if (!isAdmin) {
            query = query.eq('is_show', true)
        }
        
        // Filter by platform
        if (options?.platform && options.platform !== 'all') {
            query = query.eq('platform', options.platform)
        }
        
        // Paginate results
        query = query
            .order('created_at', { ascending: false })
            .range(start, end)
        
        const { data, error, count } = await query
        
        if (error) {
            console.error('获取个人反馈失败:', error)
            throw new Error('获取个人反馈失败')
        }
        
        return {
            data: data as FeedbackWithUser[],
            total: count || 0
        }
    },
    
    // Create feedback
    async createFeedback(feedback: CreateFeedback): Promise<Feedback> {
        const userStore = useUserStore()
        const currentUser = userStore.getUser()
        
        if (!currentUser) {
            throw new Error('未登录')
        }
        
        const { data, error } = await supabase
            .from('feedback')
            .insert([{
                ...feedback,
                user_id: currentUser.user_id,
                is_show: true
            }])
            .select()
            .single()
        
        if (error) {
            console.error('创建反馈失败:', error)
            throw new Error('创建反馈失败')
        }
        
        return data
    },
    
    // Update feedback
    async updateFeedback(id: string, feedback: UpdateFeedback): Promise<Feedback> {
        const { data, error } = await supabase
            .from('feedback')
            .update(feedback)
            .eq('id', id)
            .select()
            .single()
        
        if (error) {
            console.error('更新反馈失败:', error)
            throw new Error('更新反馈失败')
        }
        
        return data
    },
    
    // Delete feedback
    async deleteFeedback(id: string): Promise<void> {
        const { error } = await supabase
            .from('feedback')
            .delete()
            .eq('id', id)
        
        if (error) {
            console.error('删除反馈失败:', error)
            throw new Error('删除反馈失败')
        }
    },
    
    // 伪删除反馈（将反馈标记为隐藏）
    async hideFeedback(id: string): Promise<void> {
        const { error } = await supabase
            .from('feedback')
            .update({ is_show: false })
            .eq('id', id)
        
        if (error) {
            console.error('隐藏反馈失败:', error)
            throw new Error('隐藏反馈失败')
        }
    },
    
    // Get feedback replies
    async getFeedbackReplies(feedbackId: string): Promise<FeedbackReplyWithUser[]> {
        const { data, error } = await supabase
            .from('feedback_replies_with_users')
            .select('*')
            .eq('feedback_id', feedbackId)
            .order('created_at', { ascending: true })
        
        if (error) {
            console.error('获取回复失败:', error)
            throw new Error('获取回复失败')
        }
        
        return data as FeedbackReplyWithUser[]
    },
    
    // Submit reply
    async submitReply(feedbackId: string, replyData: { 
        content: string
        status?: string
        is_show?: boolean
    }): Promise<FeedbackReply> {
        const userStore = useUserStore()
        const currentUser = userStore.getUser()
        
        if (!currentUser) {
            throw new Error('未登录')
        }
        
        // Check if the feedback exists
        const { data: checkData, error: checkError } = await supabase
            .from('feedback')
            .select('id')
            .eq('id', feedbackId)
            .single()
        
        if (checkError || !checkData) {
            console.error('反馈不存在:', checkError)
            throw new Error('反馈不存在')
        }
        
        // Create reply
        const { data: replyData_result, error: replyError } = await supabase
            .from('feedback_replies')
            .insert([{
                feedback_id: feedbackId,
                user_id: currentUser.user_id,
                content: replyData.content
            }])
            .select()
            .single()
        
        if (replyError) {
            console.error('创建回复失败:', replyError)
            throw new Error('创建回复失败')
        }
        
        // Update feedback status and visibility if provided
        if (replyData.status || replyData.is_show !== undefined) {
            const updateData: any = {}
            if (replyData.status) updateData.status = replyData.status
            if (replyData.is_show !== undefined) updateData.is_show = replyData.is_show
            
            const { error: updateError } = await supabase
                .from('feedback')
                .update(updateData)
                .eq('id', feedbackId)
            
            if (updateError) {
                console.error('更新反馈状态失败:', updateError)
                throw new Error('更新反馈状态失败')
            }
        }
        
        return replyData_result
    },
    
    // Check if feedback exists
    async checkFeedbackExists(id: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('feedback')
            .select('id')
            .eq('id', id)
            .single()
        
        if (error || !data) {
            return false
        }
        
        return true
    }
} 