import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { clearAuth, readAuth, saveAuth } from '../utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const saved = readAuth()
  const token = ref(saved?.token || '')
  const user = ref(saved?.user || null)
  // 这里只判断是否持有 Token；有效性由后端验证，不推断用户角色。
  const isLoggedIn = computed(() => Boolean(token.value))

  function setSession(data) {
    if (!data || typeof data.token !== 'string' || !data.token ||
        typeof data.username !== 'string' || !data.username || data.id == null) {
      throw new Error('登录响应缺少用户信息或 Token，请检查后端返回。')
    }
    const session = { token: data.token, user: { id: data.id, username: data.username } }
    // 仅持久化必要字段，密码和完整登录请求不会进入存储。
    saveAuth(session)
    token.value = session.token
    user.value = session.user
  }

  function logout() {
    clearAuth()
    token.value = ''
    user.value = null
  }

  return { token, user, isLoggedIn, setSession, logout }
})
