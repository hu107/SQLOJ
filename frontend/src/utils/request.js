import axios from 'axios'

const request = axios.create({ baseURL: '/api', timeout: 15000 })

export function setupHttp(auth, router) {
  request.interceptors.request.use((config) => {
    // 登录、注册显式标记为公开请求，绝不附带过期 Token。
    if (config.skipAuth) config.headers.delete('Authorization')
    else if (auth.token) config.headers.set('Authorization', `Bearer ${auth.token}`)
    return config
  })

  request.interceptors.response.use(
    (response) => {
      if (response.data?.code !== 1) {
        return Promise.reject(new Error(response.data?.msg || '请求未成功，请稍后重试。'))
      }
      return response.data.data
    },
    (error) => {
      if (axios.isCancel(error)) return Promise.reject(error)
      const status = error.response?.status
      const backendMessage = error.response?.data?.msg
      let message = backendMessage || '请求失败，请稍后重试。'
      if (status === 401) {
        message = backendMessage || '登录状态已失效，请重新登录。'
        // 忽略旧会话迟到的 401，避免清除刚建立的新会话。
        const currentSession = error.config?.skipAuth ||
          error.config?.headers?.get('Authorization') === `Bearer ${auth.token}`
        if (currentSession) {
          auth.logout()
          if (!error.config?.skipAuth && router.currentRoute.value.name !== 'login') {
            void router.replace({ name: 'login', query: { reason: 'expired' } })
          }
        }
      } else if (!backendMessage) {
        if (error.code === 'ECONNABORTED') message = '请求超时，请检查网络或后端服务后重试。'
        else if (!error.response) message = '无法连接服务，请检查网络或后端服务是否已启动。'
        else if (status === 403) message = '没有访问权限，请联系后端维护者。'
        else if (status === 404) message = '接口不存在，请检查后端接口路径配置。'
        else if (status >= 500) message = '后端服务异常或代理无法连接，请检查后端服务后重试。'
        else message = `请求失败（HTTP ${status}），请稍后重试。`
      }
      // 封装层只转换错误，页面统一展示，避免拦截器和页面重复弹窗。
      return Promise.reject(new Error(message))
    },
  )
}

export default request
