<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import { register } from '../api/auth'

const router = useRouter()
const formRef = ref()
const form = reactive({ username: '', password: '', confirmPassword: '' })
const busy = ref(false)
const error = ref('')
const rules = {
  username: [
    { required: true, whitespace: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 10, message: '用户名长度为 4～10 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, whitespace: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度为 8～20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: (_rule, value, callback) => callback(value === form.password ? undefined : new Error('两次输入的密码不一致')), trigger: 'blur' },
  ],
}

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    if (!await formRef.value.validate().catch(() => false)) return
    // 不 trim、不加密密码，原样传给后端 BCrypt 处理。
    await register(form.username, form.password, form.confirmPassword)
    form.password = ''
    form.confirmPassword = ''
    await router.replace({ name: 'login', query: { username: form.username, registered: '1' } })
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="form-kicker">从这里开始</div>
    <h2>创建你的账号</h2>
    <p class="form-description">填写账号信息，完成 SQLOJ 注册</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon role="alert" />
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" @submit.prevent="submit">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="4～10 个字符" autocomplete="username" :disabled="busy" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="form.password" type="password" show-password placeholder="8～20 个字符" autocomplete="new-password" :disabled="busy" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入密码" autocomplete="new-password" :disabled="busy" />
      </el-form-item>
      <el-button class="submit-button" type="primary" size="large" native-type="submit" :loading="busy">{{ busy ? '注册中…' : '注 册' }}</el-button>
    </el-form>
    <p class="auth-switch">已有账号？<RouterLink to="/login">返回登录 <span aria-hidden="true">→</span></RouterLink></p>
  </AuthLayout>
</template>
