import { supabase } from '@/lib/supabaseClient'

export const getRoleList = async () => {
    const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('role_id', { ascending: true })

    if (error) throw error
    return { data }
}

export const createRole = async (roleData: any) => {
    const { data, error } = await supabase
        .from('roles')
        .insert(roleData)
        .select()
    if (error) throw error
    return { data }
}

export const updateRole = async (role_id: number, roleData: any) => {
    const { data, error } = await supabase
        .from('roles')
        .update(roleData)
        .eq('role_id', role_id)
        .select()
    if (error) throw error
    return { data }
}

export const deleteRole = async (role_id: number) => {
    if (role_id === 0) {
        throw new Error('系统内置角色不允许删除')
    }
    const { error } = await supabase
        .from('roles')
        .delete()
        .eq('role_id', role_id)
    if (error) throw error
} 