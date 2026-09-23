<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { createQuestion, getQuestion, updateQuestion } from '../api/questions'
import { difficultyOptions, orderOptions, statusOptions } from '../utils/questionOptions'

const props = defineProps({ questionId: { type: Number, default: null } })
const emit = defineEmits(['close', 'saved'])
const isEdit = props.questionId !== null
const formRef = ref()
const loading = ref(isEdit)
const loadError = ref('')
const saveError = ref('')
const saving = ref(false)
const form = reactive({
  title: '', questionText: '', standardSql: '',
  difficulty: 'EASY', status: 'DRAFT', orderSensitive: 0,
})
let detailController
let active = true

function requiredText(message) {
  return { validator: (_rule, value, callback) => {
    callback(typeof value === 'string' && value.trim() ? undefined : new Error(message))
  }, trigger: 'blur' }
}

function optionRule(options, message) {
  return { validator: (_rule, value, callback) => {
    callback(options.some((option) => option.value === value) ? undefined : new Error(message))
  }, trigger: 'change' }
}

const rules = {
  title: [requiredText('请输入题目标题'), { max: 200, message: '题目标题不能超过200个字符', trigger: 'blur' }],
  questionText: [requiredText('请输入题目描述')],
  standardSql: [requiredText('请输入标准答案 SQL')],
  difficulty: [optionRule(difficultyOptions, '请选择有效的难度')],
  status: [optionRule(statusOptions, '请选择有效的状态')],
  orderSensitive: [optionRule(orderOptions, '请选择结果顺序要求')],
}

async function loadDetail() {
  detailController?.abort()
  detailController = new AbortController()
  loading.value = true
  loadError.value = ''
  try {
    // 编辑必须读取最新详情，不使用列表里的旧数据覆盖题目。
    const data = await getQuestion(props.questionId, detailController.signal)
    if (!active) return
    if (!data) throw new Error('题目不存在或已被删除，请关闭窗口后重新查看列表。')
    const textFields = ['title', 'questionText', 'standardSql', 'difficulty', 'status']
    if (data.id !== props.questionId || textFields.some((key) => typeof data[key] !== 'string') ||
        !orderOptions.some((option) => option.value === data.orderSensitive)) {
      throw new Error('题目详情不完整，暂时无法编辑，请重新加载。')
    }
    for (const key of Object.keys(form)) form[key] = data[key]
  } catch (err) {
    if (active && !axios.isCancel(err)) loadError.value = err.message
  } finally {
    if (active) loading.value = false
  }
}

async function submit() {
  if (saving.value || loading.value || loadError.value) return
  // 校验阶段也锁定提交，避免连续点击发出重复写入请求。
  saving.value = true
  saveError.value = ''
  try {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid || !active) return
    // 仅提交可编辑字段；SQL 保留原始空格、缩进与换行，时间由后端维护。
    const data = { ...form }
    if (isEdit) await updateQuestion({ id: props.questionId, ...data })
    else await createQuestion(data)
    if (active) emit('saved', isEdit ? 'edit' : 'create')
  } catch (err) {
    if (active) saveError.value = err.message
  } finally {
    if (active) saving.value = false
  }
}

onMounted(() => { if (isEdit) void loadDetail() })
onBeforeUnmount(() => { active = false; detailController?.abort() })
</script>

<template>
  <el-dialog :model-value="true" :title="isEdit ? '编辑题目' : '新增题目'" class="question-editor-dialog"
    width="min(760px, calc(100vw - 32px))" top="5vh" append-to-body
    :close-on-click-modal="false" :close-on-press-escape="!saving" :show-close="!saving" @close="emit('close')">
    <p class="editor-intro">{{ isEdit ? `正在编辑题目 #${questionId}` : '填写题目信息，建立一道新的 SQL 练习题。' }}</p>
    <div v-if="loading" v-loading="true" element-loading-text="正在读取题目…" class="editor-loading" role="status">正在读取题目…</div>
    <div v-else-if="loadError" class="editor-load-error" role="alert">
      <p>{{ loadError }}</p>
      <el-button @click="loadDetail">重新加载详情</el-button>
    </div>
    <el-form v-else ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving"
      class="question-form" @submit.prevent="submit">
      <el-form-item label="题目标题" prop="title" required>
        <el-input v-model="form.title" placeholder="为题目起一个清晰的标题" maxlength="200" show-word-limit />
      </el-form-item>
      <div class="editor-selects">
        <el-form-item label="难度" prop="difficulty" required>
          <el-select v-model="form.difficulty" aria-label="难度">
            <el-option v-for="option in difficultyOptions" :key="option.value" v-bind="option" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status" required>
          <el-select v-model="form.status" aria-label="状态">
            <el-option v-for="option in statusOptions" :key="option.value" v-bind="option" />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item label="题目描述" prop="questionText" required>
        <el-input v-model="form.questionText" type="textarea" :rows="6" resize="vertical"
          placeholder="填写题目要求，并在末尾注明示例表名，例如：&#10;&#10;查询所有用户信息。&#10;&#10;示例：user_profile" />
      </el-form-item>
      <el-form-item label="标准答案 SQL" prop="standardSql" required class="sql-form-item">
        <el-input v-model="form.standardSql" type="textarea" :rows="5" resize="vertical" spellcheck="false" placeholder="输入该题的标准 SQL 答案" />
      </el-form-item>
      <el-form-item label="结果顺序" prop="orderSensitive" required>
        <el-radio-group v-model="form.orderSensitive" aria-label="结果顺序">
          <el-radio :value="0">忽略结果顺序</el-radio>
          <el-radio :value="1">要求结果顺序一致</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-alert v-if="saveError" :title="saveError" type="error" show-icon :closable="false" role="alert" />
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="emit('close')">{{ loadError ? '关闭' : '取消' }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="loading || !!loadError" @click="submit">
        {{ saving ? '正在保存…' : (isEdit ? '保存修改' : '创建题目') }}
      </el-button>
    </template>
  </el-dialog>
</template>
