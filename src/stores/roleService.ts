import { supabase } from '@/lib/supabaseClient'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 添加角色常量
export enum UserRole {
    ADMIN = 0,
}

// 添加检查权限的函数
export const hasManagmentPermission = (roleId: number | null): boolean => {
    return roleId !== null && [
        UserRole.ADMIN,
    ].includes(roleId);
}

// 角色信息接口
export interface Role {
    id: number;
    name: string;
    description?: string;
    role_id: number;
    mark: string[];
    created_at?: string;
    updated_at?: string;
}

export const roleService = {
    // 获取所有角色
    async getRoles(): Promise<Role[]> {
        try {
            const { data, error } = await supabase
                .from('roles')
                .select('*')
                .order('role_id', { ascending: true });

            if (error) {
                console.error('获取角色列表失败:', error.message);
                ElMessage.error('获取角色列表失败');
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('获取角色列表发生错误:', error);
            throw error;
        }
    },

    // 获取单个角色
    async getRole(roleId: number): Promise<Role | null> {
        try {
            const { data, error } = await supabase
                .from('roles')
                .select('*')
                .eq('role_id', roleId)
                .single();

            if (error) {
                console.error('获取角色详情失败:', error.message);
                ElMessage.error('获取角色详情失败');
                throw error;
            }

            return data;
        } catch (error) {
            console.error('获取角色详情发生错误:', error);
            throw error;
        }
    },

    // 创建角色
    async createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
        try {
            const { data, error } = await supabase
                .from('roles')
                .insert([{
                    ...role,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                console.error('创建角色失败:', error.message);
                ElMessage.error('创建角色失败');
                throw error;
            }

            ElMessage.success('角色创建成功');
            return data;
        } catch (error) {
            console.error('创建角色发生错误:', error);
            throw error;
        }
    },

    // 更新角色
    async updateRole(roleId: number, roleData: Partial<Role>): Promise<Role> {
        try {
            const { data, error } = await supabase
                .from('roles')
                .update({
                    ...roleData,
                    updated_at: new Date().toISOString()
                })
                .eq('role_id', roleId)
                .select()
                .single();

            if (error) {
                console.error('更新角色失败:', error.message);
                ElMessage.error('更新角色失败');
                throw error;
            }

            ElMessage.success('角色更新成功');
            return data;
        } catch (error) {
            console.error('更新角色发生错误:', error);
            throw error;
        }
    },

    // 删除角色
    async deleteRole(roleId: number): Promise<void> {
        try {
            const { error } = await supabase
                .from('roles')
                .delete()
                .eq('role_id', roleId);

            if (error) {
                console.error('删除角色失败:', error.message);
                ElMessage.error('删除角色失败');
                throw error;
            }

            ElMessage.success('角色删除成功');
        } catch (error) {
            console.error('删除角色发生错误:', error);
            throw error;
        }
    },
    
    // 检查角色名称是否已存在
    async checkRoleNameExists(name: string, excludeRoleId?: number): Promise<boolean> {
        try {
            let query = supabase
                .from('roles')
                .select('*')
                .ilike('name', name);
            
            // 如果提供了排除的角色ID，则排除该角色
            if (excludeRoleId !== undefined) {
                query = query.neq('role_id', excludeRoleId);
            }
            
            const { data, error } = await query;

            if (error) {
                console.error('检查角色名称失败:', error.message);
                throw error;
            }

            return (data?.length || 0) > 0;
        } catch (error) {
            console.error('检查角色名称发生错误:', error);
            throw error;
        }
    },

    // 检查用户是否有管理权限
    async checkUserManagementPermission(userId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('role_permissions')
                .select('permission_code')
                .eq('role_id', (await this.getUserRoleId(userId)) || 0)
                .eq('permission_code', 'managment_all_user')
                .eq('delete_permission', 'true')
                .single();

            if (error) throw error;
            return !!data;
        } catch (error) {
            console.error('检查用户权限失败:', error);
            return false;
        }
    },

    // 获取用户角色ID
    async getUserRoleId(userId: string): Promise<number | null> {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('role_id')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data?.role_id || null;
        } catch (error) {
            console.error('获取用户角色ID失败:', error);
            return null;
        }
    },

    // 检查用户是否有权限管理其他用户
    async canManageUser(userId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('role_id')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data?.role_id === 0; // 角色ID为0的用户可以管理所有用户
        } catch (error) {
            console.error('检查用户权限失败:', error);
            return false;
        }
    }
} 