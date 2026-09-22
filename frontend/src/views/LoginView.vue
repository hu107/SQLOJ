<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import { login } from '../api/auth'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const formRef = ref()
const form = reactive({ username: typeof route.query.username === 'string' ? route.query.username : '', password: '' })
const busy = ref(false)
const error = ref('')
const rules = {
  username: [{ required: true, whitespace: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    if (!await formRef.value.validate().catch(() => false)) return
    const data = await login(form.username, form.password)
    auth.setSession(data)
    form.password = ''
    await router.replace({ name: 'questions' })
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="form-kicker">欢迎回来</div>
    <h2>登录管理端</h2>
    <p class="form-description">使用你的 SQLOJ 账号登录</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon role="alert" />
    <el-alert v-else-if="route.query.reason === 'expired'" title="登录状态已失效，请重新登录。" type="warning" :closable="false" show-icon />
    <el-alert v-else-if="route.query.registered === '1'" title="注册成功，请使用新账号登录。" type="success" :closable="false" show-icon />
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" @submit.prevent="submit">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" autocomplete="username" :disabled="busy" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" autocomplete="current-password" :disabled="busy" />
      </el-form-item>
      <el-button class="submit-button" type="primary" size="large" native-type="submit" :loading="busy">{{ busy ? '登录中…' : '登 录' }}</el-button>
    </el-form>
    <p class="auth-switch">还没有账号？<RouterLink to="/register">立即注册 <span aria-hidden="true">→</span></RouterLink></p>
  </AuthLayout>
</template>
