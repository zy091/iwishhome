import { checkIfNoteExists } from '@/utils/noteUtils'

/**
 * 安全获取笔记示例
 * 该示例展示了如何在尝试获取笔记之前检查笔记是否存在
 */
export const safeGetNoteExample = async (noteId: string) => {
  // 首先检查笔记是否存在
  const noteExists = await checkIfNoteExists(noteId)
  
  if (!noteExists) {
    console.log(`笔记 ID ${noteId} 不存在，无需进一步处理`)
    return null
  }
  
  // 如果笔记存在，可以继续处理
  console.log(`笔记 ID ${noteId} 存在，可以安全地获取和处理该笔记`)
  
  // 这里可以添加获取笔记并进行后续处理的代码
  // 例如: const note = await studyNoteService.getNote(noteId)
  
  return true
} 