<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { deleteQuestion, getQuestionPage } from '../api/questions'
import QuestionFormDialog from '../components/QuestionFormDialog.vue'
import QuestionDetailDialog from '../components/QuestionDetailDialog.vue'
import { difficultyOptions, optionLabel, orderOptions, statusOptions } from '../utils/questionOptions'

const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const records = ref([])
const loading = ref(false)
const error = ref('')
const detailId = ref(null)
const editorOpen = ref(false)
const editingId = ref(null)
const deleteTarget = ref(null)
const deleting = ref(false)
const deleteError = ref('')
let controller
let requestId = 0
let active = true

function rawValue(value) { return value == null || value === '' ? '—' : String(value) }
function formatTime(value) { return value ? String(value).replace('T', ' ') : '—' }

async function loadQuestions(goToLastPage = false) {
  controller?.abort()
  controller = new AbortController()
  const currentId = ++requestId
  loading.value = true
  error.value = ''
  records.value = []
  try {
    const data = await getQuestionPage(page.value, pageSize.value, controller.signal)
    if (currentId !== requestId) return
    if (!Array.isArray(data?.records) || !Number.isSafeInteger(data.total) || data.total < 0) {
      throw new Error('分页响应格式不正确，请检查后端返回的 total 和 records。')
    }
    total.value = data.total
    // 重新获取数据后总页数可能减少，回到最后一个有效页。
    const lastPage = Math.max(1, Math.ceil(data.total / pageSize.value))
    // 后端按 ID 升序排列，新建后进入最新的末页；删除空末页时自动回退。
    if (page.value > lastPage || (goToLastPage && page.value !== lastPage)) {
      page.value = lastPage
      await loadQuestions()
      return
    }
    records.value = data.records
  } catch (err) {
    if (currentId !== requestId || axios.isCancel(err)) return
    total.value = 0
    error.value = err.message
  } finally {
    if (currentId === requestId) loading.value = false
  }
}

function openEditor(id = null) {
  editingId.value = id
  editorOpen.value = true
}

function onSaved(mode) {
  editorOpen.value = false
  ElMessage.success(mode === 'create' ? '题目已创建' : '题目已更新')
  void loadQuestions(mode === 'create')
}

function askDelete(row) {
  deleteTarget.value = { id: row.id, title: row.title }
  deleteError.value = ''
}

async function confirmDelete() {
  if (deleting.value || !deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteQuestion(deleteTarget.value.id)
    if (!active) return
    deleteTarget.value = null
    ElMessage.success('题目已删除')
    await loadQuestions()
  } catch (err) {
    // 保留确认窗口和原列表，失败时不假装删除成功。
    if (active) deleteError.value = err.message
  } finally {
    if (active) deleting.value = false
  }
}

function changePage(value) {
  if (page.value === value) return
  page.value = value
  void loadQuestions()
}
function changePageSize(value) {
  if (pageSize.value === value) return
  pageSize.value = value
  page.value = 1
  void loadQuestions()
}

onMounted(() => loadQuestions())
onBeforeUnmount(() => { active = false; requestId++; controller?.abort() })
</script>

<template>
  <section class="question-page">
    <section class="question-panel" aria-label="题目分页列表" :aria-busy="loading">
      <div class="panel-toolbar">
        <div class="panel-title">
          <span class="panel-icon" aria-hidden="true"><svg viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M3 8h14M8 8v9"/></svg></span>
          <h1>题目列表</h1>
          <span v-if="!loading && !error" class="total-count">共 {{ total }} 道题目</span>
        </div>
        <el-button type="primary" class="add-question-button" :disabled="deleting" @click="openEditor()">
          <span aria-hidden="true" class="add-symbol">+</span>新增题目
        </el-button>
      </div>
      <div v-if="error" class="list-state" role="alert">
        <span class="state-symbol">!</span><h3>题目加载失败</h3><p>{{ error }}</p>
        <el-button type="primary" @click="loadQuestions()">重新加载</el-button>
      </div>
      <div v-else v-loading="loading" element-loading-text="正在加载题目…" class="table-container">
        <el-table :data="records" row-key="id" style="width: 100%">
          <el-table-column prop="id" label="题号" width="80">
            <template #default="{ row }"><span class="question-id">#{{ row.id }}</span></template>
          </el-table-column>
          <el-table-column prop="title" label="题目" min-width="280">
            <template #default="{ row }">
              <button type="button" class="question-title" :aria-label="`查看题目 ${row.id}：${rawValue(row.title)}`" @click="detailId = row.id">{{ rawValue(row.title) }}</button>
              <span v-if="row.questionText" class="question-description" :title="row.questionText">{{ row.questionText }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="difficulty" label="难度" width="90">
            <template #default="{ row }"><span class="raw-badge">{{ optionLabel(difficultyOptions, row.difficulty) }}</span></template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }"><span class="status-value" :class="{ 'is-published': row.status === 'PUBLISHED', 'is-draft': row.status === 'DRAFT' }">{{ optionLabel(statusOptions, row.status) }}</span></template>
          </el-table-column>
          <el-table-column prop="orderSensitive" label="结果顺序" width="115">
            <template #default="{ row }"><span class="order-value">{{ optionLabel(orderOptions, row.orderSensitive) }}</span></template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="178">
            <template #default="{ row }"><span class="time-value">{{ formatTime(row.createTime) }}</span></template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" width="178">
            <template #default="{ row }"><span class="time-value">{{ formatTime(row.updateTime) }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="132" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button link type="primary" :disabled="loading || deleting" :aria-label="`编辑题目 ${row.id}`" @click="openEditor(row.id)">编辑</el-button>
                <el-button link type="danger" :disabled="loading || deleting" :aria-label="`删除题目 ${row.id}`" @click="askDelete(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <div v-if="loading" class="loading-placeholder" role="status">正在获取题目，请稍候</div>
            <el-empty v-else description="暂无题目" :image-size="82"><p class="empty-hint">点击右上方“新增题目”，创建第一道 SQL 练习题。</p></el-empty>
          </template>
        </el-table>
      </div>
      <div v-if="!error" class="pagination-bar">
        <span class="pagination-caption">{{ loading ? '正在获取题目…' : `共 ${total} 条记录` }}</span>
        <div class="pagination-controls">
          <label for="page-size">每页</label>
          <el-select id="page-size" :model-value="pageSize" aria-label="每页条数" :disabled="loading" class="page-size" @update:model-value="changePageSize">
            <el-option v-for="size in [10, 20, 50]" :key="size" :label="`${size} 条`" :value="size" />
          </el-select>
          <el-pagination background :current-page="page" :page-size="pageSize" :total="total" :pager-count="5" layout="prev, pager, next" :disabled="loading" @update:current-page="changePage" />
        </div>
      </div>
    </section>
    <p class="list-footnote"><span>点击题目标题查看完整详情。</span><span class="table-scroll-hint">左右滑动查看完整题目信息</span></p>
    <QuestionDetailDialog v-if="detailId !== null" :question-id="detailId" @close="detailId = null" />
    <QuestionFormDialog v-if="editorOpen" :question-id="editingId" @close="editorOpen = false" @saved="onSaved" />
    <el-dialog :model-value="!!deleteTarget" title="删除题目" width="min(440px, calc(100vw - 32px))"
      class="question-delete-dialog" append-to-body :close-on-click-modal="false" :close-on-press-escape="!deleting"
      :show-close="!deleting" @close="deleteTarget = null">
      <p class="delete-description">确定删除以下题目吗？删除后无法恢复。</p>
      <div class="delete-question-summary"><span>#{{ deleteTarget?.id }}</span><strong>{{ deleteTarget?.title }}</strong></div>
      <el-alert v-if="deleteError" :title="deleteError" type="error" show-icon :closable="false" role="alert" />
      <template #footer>
        <el-button :disabled="deleting" @click="deleteTarget = null">取消</el-button>
        <el-button type="danger" :loading="deleting" @click="confirmDelete">{{ deleting ? '正在删除…' : '确认删除' }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>
