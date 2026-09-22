<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BrandLogo from '../components/BrandLogo.vue'
import '../styles/questions.css'

const router = useRouter()
const auth = useAuthStore()
function logout() {
  auth.logout()
  void router.replace({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-inner">
        <RouterLink class="brand" to="/questions" aria-label="SQLOJ 首页"><BrandLogo /></RouterLink>
        <span class="admin-label">管理端</span>
        <nav class="main-nav" aria-label="主导航">
          <RouterLink to="/questions"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M3 8h14M8 8v9"/></svg>题目管理</RouterLink>
        </nav>
        <div class="account">
          <span class="avatar" aria-hidden="true">{{ auth.user?.username?.slice(0, 1).toUpperCase() }}</span>
          <span class="username" :title="auth.user?.username">{{ auth.user?.username }}</span>
          <span class="account-divider" aria-hidden="true"></span>
          <el-button text @click="logout">退出登录</el-button>
        </div>
      </div>
    </header>
    <main class="app-main"><RouterView /></main>
    <footer class="app-footer">SQLOJ<span>·</span>题库管理</footer>
  </div>
</template>
