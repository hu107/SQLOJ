import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import './styles/main.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { setupHttp } from './utils/request'

const app = createApp(App)
app.use(createPinia())
const auth = useAuthStore()
// 启动时注入依赖，避免 request、store、router 相互循环引用。
setupHttp(auth, router)
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
