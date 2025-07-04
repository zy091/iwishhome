import { supabase } from '@/lib/supabaseClient'

export const getMenuList = async () => {
    const { data, error } = await supabase
        .from('menu')
        .select('*')
        .order('order_index', { ascending: true })

    if (error) throw error
    return { data }
}

export const createMenu = async (menuData: any) => {
    const { data, error } = await supabase
        .from('menu')
        .insert(menuData)
        .select()

    if (error) throw error
    return { data }
}

export const updateMenu = async (id: number, menuData: any) => {
    const { data, error } = await supabase
        .from('menu')
        .update(menuData)
        .eq('id', id)
        .select()

    if (error) throw error
    return { data }
}

export const deleteMenu = async (id: number) => {
    const { error } = await supabase
        .from('menu')
        .delete()
        .eq('id', id)

    if (error) throw error
} 