import { studyNoteService } from '@/stores/studyNoteService'

/**
 * 检查指定ID的学习笔记是否存在
 * @param noteId 笔记ID
 * @returns 返回Promise<boolean>，如果笔记存在则为true，否则为false
 */
export const checkIfNoteExists = async (noteId: string): Promise<boolean> => {
  try {
    return await studyNoteService.checkNoteExists(noteId)
  } catch (error) {
    console.error('检查笔记是否存在时出错:', error)
    return false
  }
} 