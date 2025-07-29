import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 导出documentService
export * from './documentService'
// 导出caseSharingService（排除冲突的hasAdminPermission）
export { caseSharingService, type CaseSharing, type CaseSharingSearchParams, type CreateCaseSharingParams } from './caseSharingService'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})

// export const useUserStore = defineStore('user', {
//   state: () => ({
//     roleId: null as number | string | null, // 存储 role_id ，存到本地
//   }),
//   actions: {
//       setRoleId(roleId: number | string) {
//           this.roleId = roleId; // 更新 role_id
//           localStorage.setItem('roleId', JSON.stringify(roleId)); // 存储到本地
//       },
//       loadRoleId() {
//           const storedRoleId = localStorage.getItem('roleId');
//           if (storedRoleId) {
//               this.roleId = JSON.parse(storedRoleId); // 从本地加载
//           }
//       },
//   },
// });