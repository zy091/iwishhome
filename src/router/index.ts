import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/LoginView.vue';
import UserView from '../views/system/UserManagment.vue';
import { supabase } from '@/lib/supabaseClient'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/system',
      name: 'system',
      component: () => import('../views/system/SystemMain.vue'),
      redirect: '/system/home',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'home', // 子路由路径
          name: 'systemhome',
          component: () => import('../views/system/SystemHome.vue'),
        },
        {
          path: '403',
          name: '403',
          component: () => import('../views/system/Nopage/403.vue'),
        },
        {
          path: 'users', // 子路由路径
          name: 'users',
          component: UserView,
          meta: {
            requiresAuth: true,
            requiresManagment: true
          }
        },
        {
          path: 'customer',
          name: 'customer',
          component: () => import('../views/system/Customer.vue'),
        },
        {
          path: 'nas-files', // NAS文件管理
          name: 'nas-files',
          component: () => import('../views/system/NasFileManagement.vue'),
          meta: {
            requiresAuth: true,
            requiresManagment: true
          }
        },

        {
          path: 'optimize', //
          name: 'optimize',
          component: () => import('../views/system/Optimization.vue'),
        },
        {
          path: 'responsibilities', // 职责
          name: 'responsibilities',
          component: () => import('../views/system/Optimization/Responsibilities.vue'),
        },
        {
          path: 'training-and-learning', // 培训学习
          name: 'training-and-learning',
          component: () => import('../views/system/Optimization/TrainingAndLearning.vue'),
        },
        // 培训
        {
          path: 'training',
          name: 'training',
          redirect: '/system/training/study-material-folder',
          component: () => import('../views/system/Optimization/Training.vue'),
          children: [
            {
              path: 'multiple-choice', // 选择题
              name: 'multiple-choice',
              component: () => import('../views/system/Optimization/Training/StudyTesting/MultipleChoice.vue'),
              props: (route) => ({
                testId: route.query.testId,
                testName: route.query.testName,
              }),
            },
            {
              path: 'case-study', // 案例分析
              name: 'case-study',
              component: () => import('../views/system/Optimization/Training/StudyTesting/CaseStudy.vue'),
            },
            {
              path: 'comprehensive-test', // 综合测试
              name: 'comprehensive-test',
              component: () => import('../views/system/Optimization/Training/StudyTesting/ComprehensiveTest.vue'),
            },
            {
              path: 'learn-experience', // 学习心得
              name: 'learn-experience',
              component: () => import('../views/system/Optimization/Training/StudyNote.vue'),
            },
            {
              path: 'study-material-folder', // 学习资料文件夹
              name: 'study-material-folder',
              component: () => import('../views/system/Optimization/Training/StudyMaterialFolder.vue'),
            },
            {
              path: 'testing', // 测试
              name: 'testing',
              component: () => import('../views/system/Optimization/Training/TestListView.vue'),
            },
          ]
        },
        {
          path: 'personal-data',
          name: 'personal-data',
          component: () => import('@/views/system/PersonalData.vue'),
          meta: {
            requiresAuth: true,
          },
          redirect: '/system/personal-data/test-result',
          children: [
            {
              path: 'study-notes',
              name: 'study-notes',
              component: () => import('@/views/system/PersonalData/StudyNotes.vue'),
            },
            {
              path: 'test-result',
              name: 'test-result',
              component: () => import('@/views/system/PersonalData/TestResult.vue'),
            },
            {
              path: 'daily-assignments',
              name: 'daily-assignments',
              component: () => import('@/views/system/PersonalData/DailyAssignments.vue'),
            },
            {
              path: 'change-password',
              name: 'change-password',
              component: () => import('@/views/system/PersonalData/ChangePassword.vue'),
            },
          ]
        },

        {
          path: 'daily-work',
          component: () => import('@/views/system/Optimization/DailyWork.vue'),
          redirect: '/system/daily-work/personal-assignments',
          children: [
            {
              path: 'self-assignment',
              component: () => import('@/views/system/Optimization/DailyWork/SelfAssignment.vue')
            },
            {
              path: 'personal-assignments',
              name: 'personal-assignments',
              component: () => import('@/views/system/Optimization/DailyWork/PersonalAssignmentList.vue')
            }
          ]
        },
        // 管理员学习笔记
        {
          path: 'admin-study-notes',
          name: 'admin-study-notes',
          component: () => import('@/views/system/DataManagement/AdminStudyNotes.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true  // 可选：添加额外的元信息标识
          }
        },
        // 管理员测试结果
        {
          path: 'admin-test-result',
          name: 'admin-test-result',
          component: () => import('@/views/system/DataManagement/AdminTestResult.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,  // 可选：添加额外的元信息标识

          }
        },
        {
          path: 'admin-material-and-folders',
          name: 'admin-material-and-folders',
          component: () => import('@/views/system/DataManagement/AdminMaterialAndFolders.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,
          }
        },
        {
          path: 'admin-assignments',
          name: 'admin-assignments',
          component: () => import('@/views/system/DataManagement/AdminAssignments.vue'),
          meta: {
            requiresAuth: true,
          }
        },
        {
          path: 'question-management',
          name: 'question-management',
          component: () => import('@/views/system/DataManagement/QuestionManagement.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,
          }
        },
        {
          path: 'menu-setting',
          name: 'menu-setting',
          component: () => import('@/views/system/SystemSettings/MenuSetting.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,
          }
        },
        {
          path: 'role-setting',
          name: 'role-setting',
          component: () => import('@/views/system/SystemSettings/RoleSetting.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,
          }
        },
        {
          path: 'announcement-setting',
          name: 'announcement-setting',
          component: () => import('@/views/system/SystemSettings/AnnouncementSetting.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,
          }
        },
        {
          path: 'task-management',
          name: 'task-management',
          component: () => import('@/views/system/TaskManagement.vue'),
          meta: {
            requiresAuth: true,
          }
        },
        {
          path: 'feedback-center',
          name: 'feedback-center',
          component: () => import('@/views/system/FeedbackCenter.vue'),
          meta: {
            requiresAuth: true,
          }
        },
        {
          path: 'company-documents',
          name: 'company-documents',
          component: () => import('@/views/system/CompanyDocuments.vue'),
          meta: {
            requiresAuth: true,
          }
        },
        {
          path: 'case-sharing',
          name: 'case-sharing',
          component: () => import('@/views/system/CaseSharing.vue'),
          meta: {
            requiresAuth: true,
          }
        },
        {
          path: 'study-notes',
          name: 'study-note',
          component: () => import('@/views/system/Optimization/StudyNotes.vue'),
          redirect: '/system/study-notes/list',
          children: [
            {
              path: 'list',
              name: 'study-notes-list',
              component: () => import('@/views/system/Optimization/StudyNotesList.vue'),
            },
            {
              path: 'create',
              name: 'study-notes-create',
              component: () => import('@/views/system/Optimization/StudyNotesCreate.vue'),
            }
          ]
        }
      ],
    },
  ],
})
import { hasViewAllNotesPermission } from '@/stores/studyNoteService'
import { hasManagmentPermission } from '@/stores/roleService'
import { useUserStore } from '@/stores/user'

// 添加全局守卫
router.beforeEach(async (to, from, next) => {
  // 从 supabase 获取会话状态
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!session
  const userStore = useUserStore()

  // 如果需要认证但未登录
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
  }

  // 如果是管理页面需要额外的权限检查
  if (to.meta.requiresAdmin) {
    if (!isAuthenticated) {
      return next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    }

    if (!hasViewAllNotesPermission(Number(userStore.roleId))) {
      return next('/403')
    }
  }
  if (to.meta.requiresManagment) {
    if (!isAuthenticated) {
      return next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    }
    if (!hasManagmentPermission(Number(userStore.roleId))) {
      return next('/403')
    }
  }

  next()
})
export default router;


