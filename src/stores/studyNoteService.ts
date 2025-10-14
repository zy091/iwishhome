import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'
import { generateDateRange } from '@/utils/dateUtils'
import type { CreateStudyNote, StudyNote, UpdateStudyNote, StudyNoteWithProfile, PaginatedNotes } from '@/stores/studyNote'


// 添加角色常量
export enum UserRole {
    ADMIN = 0,
    OPERATIONS_MANAGER = 1,
    PRODUCT_MANAGER = 11,
    TEACHER = 15
}

// 添加检查权限的函数
export const hasViewAllNotesPermission = (roleId: number | null): boolean => {
    return roleId !== null && [
        UserRole.ADMIN,
        UserRole.OPERATIONS_MANAGER,
        UserRole.PRODUCT_MANAGER,
        UserRole.TEACHER
    ].includes(roleId);
}


export const studyNoteService = {
    // 获取当前用户的所有笔记
    async getNotes(): Promise<StudyNote[]> {
        const userStore = useUserStore()
        
        // 使用getUser方法确保获取最新的用户数据
        const currentUser = userStore.getUser()
        
        if (!currentUser) {
            throw new Error('未登录')
        }

        // 确保user_id存在再执行查询
        if (!currentUser.user_id) {
            throw new Error('无法获取用户ID')
        }

        const { data, error } = await supabase
            .from('study_notes')
            .select('*')
            .eq('user_id', currentUser.user_id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    // 获取单个笔记
    async getNote(id: string): Promise<StudyNote> {
        try {
            // 首先检查笔记是否存在
            const exists = await this.checkNoteExists(id)
            if (!exists) {
                throw new Error(`笔记不存在: ${id}`)
            }

            const { data, error } = await supabase
                .from('study_notes')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                throw new Error(`获取笔记失败: ${error.message}`)
            }

            return data as StudyNote
        } catch (error) {
            if (error instanceof Error) {
                throw error
            }
            throw new Error('获取笔记失败')
        }
    },

    // 创建笔记
    async createNote(note: CreateStudyNote): Promise<StudyNote> {
        const userStore = useUserStore()
        
        // 使用getUser方法获取最新的用户数据
        const currentUser = userStore.getUser()
        
        if (!currentUser) {
            throw new Error('未登录')
        }
        
        // 确保用户ID存在
        if (!currentUser.user_id) {
            throw new Error('无法获取用户ID')
        }
        
        const { data, error } = await supabase
            .from('study_notes')
            .insert([{
                ...note,
                user_id: currentUser.user_id
            }])
            .select()
            .single()

        if (error) {
            throw new Error('创建笔记失败')
        }
        return data
    },

    // 更新笔记
    async updateNote(id: string, note: UpdateStudyNote): Promise<StudyNote> {
        const { data, error } = await supabase
            .from('study_notes')
            .update(note)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error(`笔记不存在: ${id}`)
            }
            throw new Error('更新笔记失败')
        }
        return data
    },

    // 删除笔记
    async deleteNote(id: string): Promise<void> {
        const { error } = await supabase
            .from('study_notes')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    // 以下是使用视图的搜索方法（需要先在数据库创建视图）
    async searchNotesUsingView(
        query: string,
        options?: {
            startDate?: string;
            endDate?: string;
            page?: number;
            pageSize?: number;
            replyStatus?: string; // 添加回复状态过滤选项
        }
    ): Promise<PaginatedNotes> {
        const userStore = useUserStore()
        
        // 使用getUser方法获取最新的用户数据
        const currentUser = userStore.getUser()
        
        if (!currentUser) {
            throw new Error('未登录')
        }
        
        // 确保角色ID存在再检查权限
        const roleId = Number(userStore.roleId)
        if (!hasViewAllNotesPermission(roleId)) {
            throw new Error('没有权限查看所有笔记');
        }

        // 获取当前用户的组织信息
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('organization_id, organization_parent_id, role_id')
            .eq('user_id', currentUser.user_id)
            .single()

        if (!profile?.organization_id) {
            throw new Error('用户未加入组织')
        }

        // 根据用户角色确定查询范围
        const isSupperAdmin = profile.role_id === 0 // 超级管理员

        const page = options?.page || 1;
        const pageSize = options?.pageSize || 10;

        // 构建基础查询
        let supabaseQuery = supabase
            .from('simple_user_notes_view')
            .select('*', { count: 'exact' })  // 添加 count 选项

        // 根据角色设置组织过滤条件
        if (!isSupperAdmin) {
            // 非超级管理员只能查看本组织的笔记
            supabaseQuery = supabaseQuery.eq('organization_id', profile.organization_id)
        }
        // 超级管理员不添加组织过滤条件，可以查看所有笔记

        if (query) {
            supabaseQuery = supabaseQuery
                .or(`title.ilike.%${query}%,full_name.ilike.%${query}%`);
        }

        // 处理日期范围
        if (options?.startDate && options?.endDate) {
            const { startUTC, endUTC } = generateDateRange(options.startDate, options.endDate);
            supabaseQuery = supabaseQuery
                .gte('note_created_at', startUTC)
                .lte('note_created_at', endUTC);
        }
        
        // 按回复状态过滤
        if (options?.replyStatus && options.replyStatus !== 'all') {
            if (options.replyStatus === 'replied') {
                // 已回复状态: admin_reply 不为 null
                supabaseQuery = supabaseQuery.not('admin_reply', 'is', null);
            } else if (options.replyStatus === 'pending') {
                // 待回复状态: admin_reply 为 null
                supabaseQuery = supabaseQuery.is('admin_reply', null);
            }
        }

        // 先获取总数
        // const { count } = await supabaseQuery;
        
        // 然后获取分页数据
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize - 1;
        const { data, error, count } = await supabaseQuery
            .order('note_created_at', { ascending: false })
            .range(startIndex, endIndex);

        if (error) throw error;

        // 转换数据格式以匹配现有结构
        const notesWithProfiles = (data || []).map(note => ({
            ...note,
            profile: {
                user_id: note.user_id,
                full_name: note.full_name,
                email: note.email
            }
        }));

        return {
            data: notesWithProfiles,
            total: count || 0,
            page,
            pageSize
        };
    },

    // 更新笔记（包含管理员回复）
    async updateNoteWithReply(id: string, replyData: { admin_reply: string; admin_id: string; admin_name?: string; replied_at: string }): Promise<StudyNote> {
        try {

            const { data, error } = await supabase
                .from('study_notes')
                .update({
                    admin_reply: replyData.admin_reply,
                    admin_id: replyData.admin_id,
                    admin_name: replyData.admin_name,
                    replied_at: replyData.replied_at,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new Error(`笔记不存在: ${id}`)
                }
                throw new Error('更新笔记失败');
            }

            return data as StudyNote;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('更新笔记失败');
        }
    },

    // 检查笔记是否存在
    async checkNoteExists(id: string): Promise<boolean> {
        try {
            const { count, error } = await supabase
                .from('study_notes')
                .select('*', { count: 'exact', head: true })
                .eq('id', id)
            
            if (error) {
                return false
            }
            
            return count !== null && count > 0
        } catch (error) {
            return false
        }
    }
}