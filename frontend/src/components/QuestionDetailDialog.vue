<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import axios from 'axios'
import { getQuestion } from '../api/questions'
import { difficultyOptions, optionLabel, orderOptions, statusOptions } from '../utils/questionOptions'

const props = defineProps({ questionId: { type: Number, required: true } })
const emit = defineEmits(['close'])
const question = ref(null)
const loading = ref(true)
const error = ref('')
let controller
let requestId = 0

async function loadDetail() {
  controller?.abort()
  controller = new AbortController()
  const currentId = ++requestId
  loading.value = true
  error.value = ''
  question.value = null
  try {
    // 每次打开都请求最新详情；关闭窗口后忽略迟到的响应。
    const data = await getQuestion(props.questionId, controller.signal)
    if (currentId !== requestId) return
    if (!data) throw new Error('题目不存在或已被删除，请关闭窗口后重新查看列表。')
    if (data.id !== props.questionId || ['title', 'questionText', 'standardSql'].some((key) => typeof data[key] !== 'string')) {
      throw new Error('题目详情不完整，请重新加载。')
    }
    question.value = data
  } catch (err) {
    if (currentId === requestId && !axios.isCancel(err)) error.value = err.message
  } finally {
    if (currentId === requestId) loading.value = false
  }
}

onMounted(loadDetail)
onBeforeUnmount(() => { requestId++; controller?.abort() })
</script>

<template>
  <el-dialog :model-value="true" title="题目详情" class="question-detail-dialog"
    width="min(800px, calc(100vw - 32px))" top="5vh" append-to-body
    :close-on-click-modal="false" @close="emit('close')">
    <div v-if="loading" v-loading="true" element-loading-text="正在读取题目…" class="editor-loading" role="status">正在读取题目…</div>
    <div v-else-if="error" class="editor-load-error" role="alert">
      <p>{{ error }}</p>
      <el-button @click="loadDetail">重新加载详情</el-button>
    </div>
    <article v-else-if="question" class="question-detail">
      <span class="detail-id">题目 #{{ question.id }}</span>
      <h2 class="detail-title">{{ question.title }}</h2>
      <dl class="detail-meta">
        <div><dt>难度</dt><dd>{{ optionLabel(difficultyOptions, question.difficulty) }}</dd></div>
        <div><dt>状态</dt><dd>{{ optionLabel(statusOptions, question.status) }}</dd></div>
        <div><dt>结果顺序</dt><dd>{{ optionLabel(orderOptions, question.orderSensitive) }}</dd></div>
      </dl>
      <section class="detail-section" aria-label="题目描述">
        <h3>题目描述</h3>
        <p class="detail-description">{{ question.questionText }}</p>
      </section>
      <section class="detail-section" aria-label="标准答案 SQL">
        <h3>标准答案 SQL</h3>
        <pre class="detail-sql"><code>{{ question.standardSql }}</code></pre>
      </section>
    </article>
    <template #footer>
      <el-button @click="emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>
