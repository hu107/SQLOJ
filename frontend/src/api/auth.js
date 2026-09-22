import request from '../utils/request'

// 注册路径集中配置；等待后端修正映射，不请求根路径绕过问题。
export const AUTH_ENDPOINTS = { login: '/login', register: '/register' }

export function login(username, password) {
  return request.post(AUTH_ENDPOINTS.login, { username, passwordHash: password }, { skipAuth: true })
}

export function register(username, password, confirmPassword) {
  return request.post(AUTH_ENDPOINTS.register, {
    username, passwordHash: password, confirmPassword,
  }, { skipAuth: true })
}
