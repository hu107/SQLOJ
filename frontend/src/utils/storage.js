const AUTH_KEY = 'sqloj.auth'

export function readAuth() {
  try {
    const value = JSON.parse(localStorage.getItem(AUTH_KEY))
    if (typeof value?.token === 'string' && value.token &&
        typeof value?.user?.username === 'string' && value.user.username &&
        value.user.id != null) return value
  } catch {
    // 损坏的数据或禁止访问 localStorage 时，按未登录处理。
  }
  return null
}

export function saveAuth(session) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  } catch {
    throw new Error('浏览器无法保存登录状态，请允许本站使用本地存储后重试。')
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch {
    // 存储不可用时仍需清空内存中的登录状态。
  }
}
