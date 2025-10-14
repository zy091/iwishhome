import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'
import { generateDateRange } from '@/utils/dateUtils'

export interface Assignment {
    id?: string
    title: string
    content: string
    created_by?: string
    assigned_to?: string
    organization_id?: string
    created_at?: string
    updated_at?: string
    attachment_url?: string
    attachment_name?: string
    attachment_type?: string
    replies?: AssignmentReply[]
    creator_profile?: {
        full_name: string
        email: string
    }
    assignee_profile?: {
        full_name: string
        email: string
    }
}

export interface AssignmentReply {
    id?: string
    assignment_id: string
    user_id: string
    content: string
    full_name: string
    created_at?: string
    updated_at?: string
    attachment_url?: string
    attachment_name?: string
    attachment_type?: string
    profile?: {
        full_name: string
        email: string
    }
}

export const assignmentService = {
    // 获取用户所在组织的所有作业
    async getAssignments(page: number = 1, pageSize: number = 10, filters?: {
        query?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
    }) {
        const userStore = useUserStore()
        if (!userStore.user) throw new Error('用户未登录')

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('organization_id, organization_parent_id, role_id')
            .eq('user_id', userStore.user.user_id)
            .single()

        if (!profile?.organization_id) throw new Error('用户未加入组织')

        // 根据用户角色确定查询范围
        const isSupperAdmin = profile.role_id === 0 // 超级管理员

        // 如果有搜索关键词且需要查询分配人的全名
        if (filters?.query) {
            // 首先获取匹配关键词的用户 ID
            const userQuery = supabase
                .from('user_profiles')
                .select('user_id')
                .ilike('full_name', `%${filters.query}%`)
            
            // 根据角色限制用户搜索范围
            if (!isSupperAdmin) {
                // 非超级管理员限制在本组织内搜索
                userQuery.eq('organization_id', profile.organization_id)
            }
            // 超级管理员不添加组织限制，可以搜索所有用户
            
            const { data: matchingUsers } = await userQuery
            const matchingUserIds = matchingUsers?.map(user => user.user_id) || []
            
            let query = supabase
                .from('assignments')
                .select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `, { count: 'exact' })
            
            // 根据角色设置组织过滤条件
            if (!isSupperAdmin) {
                // 非超级管理员限制在本组织
                query = query.eq('organization_id', profile.organization_id)
            }
            // 超级管理员不添加组织过滤条件，可以查看所有作业
                
            // 基于标题或分配给匹配用户的作业进行筛选
            if (matchingUserIds.length > 0) {
                query = query.or(`title.ilike.%${filters.query}%,assigned_to.in.(${matchingUserIds.join(',')})`)
            } else {
                // 如果没有匹配的用户，只按标题筛选
                query = query.ilike('title', `%${filters.query}%`)
            }
            
            // 处理日期范围
            if (filters?.startDate && filters?.endDate) {
                const { startUTC, endUTC } = generateDateRange(filters.startDate, filters.endDate);
                query = query
                    .gte('created_at', startUTC)
                    .lte('created_at', endUTC);
            }
            
            // 添加回复状态过滤
            if (filters?.status === 'replied') {
                // 查询已完成并已回复的作业 (有指定人员和管理员的回复)
                query = query.not('replies', 'is', null)
            } else if (filters?.status === 'pending') {
                // 查询待回复的作业 (没有指定人员的回复)
                query = query.not('replies', 'is', null)
            }

            // 排序和分页
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1)

            if (error) throw error
            return { data, total: count || 0 }
        } else {
            // 原有查询逻辑，无关键词搜索
            let query = supabase
                .from('assignments')
                .select(`
                    *,
                    creator_profile:user_profiles!created_by(full_name, email),
                    assignee_profile:user_profiles!assigned_to(full_name, email),
                    replies:assignment_replies(*, profile:user_profiles(full_name, email))
                `, { count: 'exact' })
            
            // 根据角色设置组织过滤条件
            if (!isSupperAdmin) {
                // 非超级管理员限制在本组织
                query = query.eq('organization_id', profile.organization_id)
            }
            // 超级管理员不添加组织过滤条件，可以查看所有作业
            
            // 处理日期范围
            if (filters?.startDate && filters?.endDate) {
                const { startUTC, endUTC } = generateDateRange(filters.startDate, filters.endDate);
                query = query
                    .gte('created_at', startUTC)
                    .lte('created_at', endUTC);
            }
            
            // 添加回复状态过滤
            if (filters?.status === 'replied') {
                // 查询已完成并已回复的作业 (有指定人员和管理员的回复)
                query = query.not('replies', 'is', null)
            } else if (filters?.status === 'pending') {
                // 查询待回复的作业 (没有指定人员的回复)
                query = query.not('replies', 'is', null)
            }

            // 排序和分页
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1)

            if (error) throw error
            return { data, total: count || 0 }
        }
    },

    // 获取组织成员
    async getOrganizationMembers() {
        const userStore = useUserStore()
        if (!userStore.user) throw new Error('用户未登录')

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('organization_id, organization_parent_id, role_id')
            .eq('user_id', userStore.user.user_id)
            .single()

        if (!profile?.organization_id) throw new Error('用户未加入组织')
        
        // 根据用户角色确定查询范围
        const isSupperAdmin = profile.role_id === 0 // 超级管理员
        
        if (isSupperAdmin) {
            // 超级管理员：查看所有用户
            
            const { data, error } = await supabase
                .from('user_profiles')
                .select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `)
                .neq('user_id', userStore.user.user_id) // 排除当前用户
        
            
            if (error) {
                console.error('超级管理员查询错误:', error);
                throw error;
            }
            return data;
        } else {
            // 非超级管理员：只能看到本组织成员
        
        const { data, error } = await supabase
                .from('user_profiles')
                .select(`
                    user_id,
                    role_id,
                    full_name,
                    email,
                    organization_id,
                    organization_path
                `)
                .eq('organization_id', profile.organization_id)
                .neq('user_id', userStore.user.user_id) // 排除当前用户
            
            
            if (error) {
                console.error('非超级管理员查询错误:', error);
                throw error;
            }
        return data;
        }
    },

    // 创建作业
    async createAssignment(assignment: Assignment) {
        const userStore = useUserStore()
        if (!userStore.user) throw new Error('用户未登录')

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('organization_id, organization_parent_id, role_id')
            .eq('user_id', userStore.user.user_id)
            .single()

        // 超级管理员（role_id = 0）可能没有organization_id，这是正常的
        const isSupperAdmin = profile?.role_id === 0
        
        if (!isSupperAdmin && !profile?.organization_id) {
            throw new Error('用户未加入组织')
        }

        const { data, error } = await supabase
            .from('assignments')
            .insert({
                ...assignment,
                created_by: userStore.user.user_id,
                organization_id: profile?.organization_id || null, // 超级管理员可以为null
                organization_parent_id: profile?.organization_parent_id || null
            })
            .select(`
            *,
            creator_profile:user_profiles!created_by(full_name, email),
            assignee_profile:user_profiles!assigned_to(full_name, email)
        `)
            .single()

        if (error) throw error
        return data
    },

    // 添加作业回复
    async addReply(reply: AssignmentReply) {
        const userStore = useUserStore()
        if (!userStore.user) throw new Error('用户未登录')

        const { data, error } = await supabase
            .from('assignment_replies')
            .insert({
                ...reply,
                user_id: userStore.user.user_id,
                full_name: userStore.user.full_name || ''
            })
            .select(`
                *,
                profile:user_profiles(full_name, email)
            `)
            .single()

        if (error) throw error
        return data
    },

    // 获取作业详情
    async getAssignmentById(assignmentId: string) {
        const { data, error } = await supabase
            .from('assignments')
            .select(`
                *,
                creator_profile:user_profiles!created_by(full_name, email),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `)
            .eq('id', assignmentId)
            .single();

        if (error) throw error;
        return data;
    },

    // 获取分配给当前用户的作业 - 不受组织限制
    async getPersonalAssignments(page: number = 1, pageSize: number = 10, filters?: {
        query?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
    }) {
        const userStore = useUserStore()
        if (!userStore.user) throw new Error('用户未登录')

        const userId = userStore.user.user_id
        
        try {
            // 直接查询指定给当前用户的作业，不受组织限制
        let query = supabase
            .from('assignments')
            .select(`
                *,
                    creator_profile:user_profiles!created_by(full_name, email, role_id),
                assignee_profile:user_profiles!assigned_to(full_name, email),
                replies:assignment_replies(*, profile:user_profiles(full_name, email))
            `, { count: 'exact' })
                .eq('assigned_to', userId) // 只要assigned_to是当前用户，就能看到，不论创建者来自哪个组织
            
        
        // 添加标题搜索
        if (filters?.query) {
            query = query.ilike('title', `%${filters.query}%`)
        }
        
        // 处理日期范围
        if (filters?.startDate && filters?.endDate) {
            const { startUTC, endUTC } = generateDateRange(filters.startDate, filters.endDate);
            query = query
                .gte('created_at', startUTC)
                .lte('created_at', endUTC);
        }
        
        // 添加回复状态过滤
        if (filters?.status === 'replied') {
                // 查询已完成并已回复的作业
            query = query.not('replies', 'is', null)
        } else if (filters?.status === 'pending') {
                // 查询待回复的作业
            query = query.not('replies', 'is', null)
        }

        // 排序和分页
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1)

            if (error) {
                console.error('查询个人作业失败:', error)
                throw error
            }

            console.log('作业详情:', data?.map(item => ({
                id: item.id,
                title: item.title,
                created_by: item.created_by,
                assigned_to: item.assigned_to,
                creator_role: item.creator_profile?.role_id
            })))

            return { data: data || [], total: count || 0 }
        } catch (error) {
            console.error('获取个人作业失败:', error)
            throw error
        }
    },

    // 删除作业
    async deleteAssignment(assignmentId: string) {
        const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', assignmentId);

        if (error) throw error;
        return true;
    }
}