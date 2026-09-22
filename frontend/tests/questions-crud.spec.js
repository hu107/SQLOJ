import { test, expect } from '@playwright/test'

// 所有账号与题目均为浏览器测试夹具，不连接或修改真实数据库。
const session = { token: 'isolated-crud-token', user: { id: 7, username: 'testuser' } }
const question = (id) => ({
  id, title: `测试题目 ${id}`, questionText: '查询符合条件的数据，并返回指定字段。',
  difficulty: 'EASY', status: 'DRAFT', orderSensitive: 0,
  standardSql: 'SELECT id FROM sample_table;',
  createTime: '2026-09-20T10:00:00', updateTime: '2026-09-20T11:00:00',
})

async function reply(route, data, code = 1, msg = null) {
  await route.fulfill({ json: { code, msg, data } })
}

async function fillRequired(dialog, title = '新增测试题目') {
  await dialog.getByLabel('题目标题', { exact: true }).fill(title)
  await dialog.getByLabel('题目描述', { exact: true }).fill('查询每个部门的员工数量。')
  await dialog.getByLabel('标准答案 SQL', { exact: true }).fill('SELECT department_id, COUNT(*) FROM employee GROUP BY department_id;')
}

async function openDetails(page, id) {
  await page.getByRole('button', { name: new RegExp(`^查看题目 ${id}：`) }).click()
  const dialog = page.getByRole('dialog', { name: '题目详情', exact: true })
  await expect(dialog.locator('.detail-title')).toBeVisible()
  return dialog
}

async function openEdit(page, id) {
  await page.getByRole('button', { name: `编辑题目 ${id}`, exact: true }).click()
  await expect(page.getByRole('dialog', { name: '题目详情', exact: true })).toHaveCount(0)
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((data) => localStorage.setItem('sqloj.auth', JSON.stringify(data)), session)
})

test('新增校验、枚举与数字字段、SQL原样提交、防重复和跳转末页', async ({ page }) => {
  let created
  let creates = 0
  const pages = []
  await page.route('**/api/admin/question/page?*', async (route) => {
    const params = new URL(route.request().url()).searchParams
    pages.push(Object.fromEntries(params))
    await reply(route, {
      total: created ? 11 : 10,
      records: params.get('page') === '2' ? [{ id: 11, ...created }] : [question(1)],
    })
  })
  await page.route('**/api/admin/question/add', async (route) => {
    creates++
    expect(route.request().method()).toBe('POST')
    expect(route.request().headers().authorization).toBe(`Bearer ${session.token}`)
    created = route.request().postDataJSON()
    expect(created).toEqual({
      title: '部门员工统计', questionText: '查询每个部门的员工数量。',
      difficulty: 'HARD', status: 'PUBLISHED', orderSensitive: 1,
      standardSql: '  SELECT department_id, COUNT(*)\nFROM employee\nGROUP BY department_id;\n',
    })
    await new Promise((resolve) => setTimeout(resolve, 450))
    await reply(route, null)
  })
  await page.goto('/questions')
  await page.getByRole('button', { name: '新增题目', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '新增题目', exact: true })
  await dialog.getByRole('button', { name: '创建题目', exact: true }).click()
  await expect(dialog.locator('.el-form-item__error')).toHaveCount(3)
  expect(creates).toBe(0)
  await expect(dialog.getByLabel('题目标题', { exact: true })).toHaveAttribute('maxlength', '200')
  await fillRequired(dialog, '部门员工统计')
  await dialog.locator('.editor-selects .el-select__wrapper').nth(0).click()
  await page.getByRole('option', { name: '困难', exact: true }).click()
  await dialog.locator('.editor-selects .el-select__wrapper').nth(1).click()
  await page.getByRole('option', { name: '已发布', exact: true }).click()
  await dialog.getByText('要求结果顺序一致', { exact: true }).click()
  await dialog.getByLabel('标准答案 SQL', { exact: true }).fill('  SELECT department_id, COUNT(*)\nFROM employee\nGROUP BY department_id;\n')
  await page.screenshot({ path: 'test-results/question-editor-desktop.png', fullPage: true, animations: 'disabled' })
  await dialog.getByRole('button', { name: '创建题目', exact: true }).click()
  await expect(dialog.getByRole('button', { name: '正在保存…' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '取消', exact: true })).toBeDisabled()
  await dialog.locator('form').dispatchEvent('submit')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('部门员工统计', { exact: true })).toBeVisible()
  expect(creates).toBe(1)
  expect(pages.at(-1)).toEqual({ page: '2', pageSize: '10' })
  await expect(page.getByText('已发布', { exact: true })).toBeVisible()
  await expect(page.getByText('顺序一致', { exact: true })).toBeVisible()
})

test('新增失败保留输入，重试成功，重新打开表单清空旧内容', async ({ page }) => {
  let calls = 0
  await page.route('**/api/admin/question/page?*', (route) => reply(route, { total: 0, records: [] }))
  await page.route('**/api/admin/question/add', async (route) => {
    calls++
    await reply(route, null, calls === 1 ? 0 : 1, calls === 1 ? '题目标题不可用' : null)
  })
  await page.goto('/questions')
  await page.getByRole('button', { name: '新增题目', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '新增题目', exact: true })
  await fillRequired(dialog)
  await dialog.getByRole('button', { name: '创建题目', exact: true }).click()
  await expect(dialog.getByText('题目标题不可用', { exact: true })).toHaveCount(1)
  await expect(dialog.getByLabel('题目标题', { exact: true })).toHaveValue('新增测试题目')
  await dialog.getByRole('button', { name: '创建题目', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(calls).toBe(2)
  await page.getByRole('button', { name: '新增题目', exact: true }).click()
  await expect(dialog.getByLabel('题目标题', { exact: true })).toHaveValue('')
  await expect(dialog.getByLabel('标准答案 SQL', { exact: true })).toHaveValue('')
})

test('编辑读取最新详情，PUT提交完整字段，403保留输入且不退出登录', async ({ page }) => {
  let updates = 0
  let latest = { ...question(11), title: '最新题目标题', difficulty: 'MEDIUM', status: 'PUBLISHED', orderSensitive: 1 }
  const pages = []
  await page.route('**/api/admin/question/page?*', async (route) => {
    const params = new URL(route.request().url()).searchParams
    pages.push(Object.fromEntries(params))
    await reply(route, { total: 11, records: [params.get('page') === '2' ? { ...latest, title: updates === 2 ? latest.title : '列表中的旧标题', standardSql: 'LIST_SQL_SHOULD_NOT_BE_USED' } : question(1)] })
  })
  await page.route('**/api/admin/question/11', async (route) => {
    expect(route.request().method()).toBe('GET')
    expect(route.request().headers().authorization).toBe(`Bearer ${session.token}`)
    await new Promise((resolve) => setTimeout(resolve, 250))
    await reply(route, latest)
  })
  await page.route('**/api/admin/question', async (route) => {
    expect(route.request().method()).toBe('PUT')
    updates++
    const data = route.request().postDataJSON()
    expect(data).toEqual({
      id: 11, title: '修改后的题目', questionText: latest.questionText,
      standardSql: latest.standardSql, difficulty: 'MEDIUM', status: 'PUBLISHED', orderSensitive: 1,
    })
    if (updates === 1) await route.fulfill({ status: 403, body: '' })
    else { latest = { ...latest, ...data }; await reply(route, null) }
  })
  await page.goto('/questions')
  await page.getByRole('button', { name: '下一页' }).click()
  await openEdit(page, 11)
  const dialog = page.getByRole('dialog', { name: '编辑题目', exact: true })
  await expect(dialog.getByRole('button', { name: '保存修改' })).toBeDisabled()
  await expect(dialog.getByLabel('题目标题', { exact: true })).toHaveValue('最新题目标题')
  await expect(dialog.getByLabel('标准答案 SQL', { exact: true })).toHaveValue(latest.standardSql)
  await expect(dialog.getByRole('radio', { name: '要求结果顺序一致' })).toBeChecked()
  await dialog.getByLabel('题目标题', { exact: true }).fill('修改后的题目')
  await dialog.getByRole('button', { name: '保存修改' }).click()
  await expect(dialog.getByText('没有访问权限，请联系后端维护者。', { exact: true })).toHaveCount(1)
  await expect(page).toHaveURL(/\/questions$/)
  await expect(dialog.getByLabel('题目标题', { exact: true })).toHaveValue('修改后的题目')
  await dialog.getByRole('button', { name: '保存修改' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: '题目详情', exact: true })).toHaveCount(0)
  await expect(page.getByText('修改后的题目', { exact: true })).toBeVisible()
  expect(pages.at(-1)).toEqual({ page: '2', pageSize: '10' })
  expect(updates).toBe(2)
})

test('详情请求失败或题目不存在时禁止保存，并支持重新读取', async ({ page }) => {
  let details = 0
  let writes = 0
  await page.route('**/api/admin/question/page?*', (route) => reply(route, { total: 1, records: [question(1)] }))
  await page.route('**/api/admin/question/1', async (route) => {
    details++
    if (details === 1) await route.abort('failed')
    else await reply(route, details === 2 ? null : question(1))
  })
  await page.route('**/api/admin/question', (route) => { writes++; return reply(route, null) })
  await page.goto('/questions')
  await openEdit(page, 1)
  const dialog = page.getByRole('dialog', { name: '编辑题目', exact: true })
  await expect(dialog.getByText('无法连接服务，请检查网络或后端服务是否已启动。')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '保存修改' })).toBeDisabled()
  await dialog.getByRole('button', { name: '重新加载详情' }).click()
  await expect(dialog.getByText('题目不存在或已被删除，请关闭窗口后重新查看列表。')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '保存修改' })).toBeDisabled()
  await dialog.getByRole('button', { name: '重新加载详情' }).click()
  await expect(dialog.getByLabel('题目标题', { exact: true })).toHaveValue('测试题目 1')
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes).toBe(0)
})

test('删除先确认，失败保留题目，成功后回退空末页且避免重复删除', async ({ page }) => {
  let deletions = 0
  let removed = false
  const pages = []
  await page.route('**/api/admin/question/page?*', async (route) => {
    const params = new URL(route.request().url()).searchParams
    pages.push(Object.fromEntries(params))
    await reply(route, {
      total: removed ? 10 : 11,
      records: params.get('page') === '2' ? (removed ? [] : [question(11)]) : [question(1)],
    })
  })
  await page.route('**/api/admin/question/11', async (route) => {
    expect(route.request().method()).toBe('DELETE')
    expect(route.request().postData()).toBeNull()
    expect(route.request().headers().authorization).toBe(`Bearer ${session.token}`)
    deletions++
    if (deletions === 1) await reply(route, null, 0, '题目有关联数据，不能删除')
    else {
      await new Promise((resolve) => setTimeout(resolve, 400))
      removed = true
      await reply(route, null)
    }
  })
  await page.goto('/questions')
  await page.getByRole('button', { name: '下一页' }).click()
  await page.getByRole('button', { name: '删除题目 11', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '删除题目', exact: true })
  await expect(dialog.getByText('测试题目 11', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  expect(deletions).toBe(0)
  await expect(page.getByRole('dialog', { name: '题目详情', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '删除题目 11', exact: true }).click()
  await dialog.getByRole('button', { name: '确认删除' }).click()
  await expect(dialog.getByText('题目有关联数据，不能删除', { exact: true })).toHaveCount(1)
  await expect(page.locator('.question-title')).toHaveText('测试题目 11')
  await dialog.getByRole('button', { name: '确认删除' }).click()
  await expect(dialog.getByRole('button', { name: '取消', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('dialog', { name: '题目详情', exact: true })).toHaveCount(0)
  await expect(page.getByText('测试题目 1', { exact: true })).toBeVisible()
  await expect(page.getByText('共 10 条记录', { exact: true })).toBeVisible()
  expect(deletions).toBe(2)
  expect(pages.at(-1)).toEqual({ page: '1', pageSize: '10' })
})

test('删除最后一道题目后展示空列表，HTTP 500失败时不误删', async ({ page }) => {
  let calls = 0
  let removed = false
  await page.route('**/api/admin/question/page?*', (route) => reply(route, { total: removed ? 0 : 1, records: removed ? [] : [question(1)] }))
  await page.route('**/api/admin/question/1', async (route) => {
    expect(route.request().method()).toBe('DELETE')
    calls++
    if (calls === 1) await route.fulfill({ status: 500, body: '' })
    else { removed = true; await reply(route, null) }
  })
  await page.goto('/questions')
  await page.getByRole('button', { name: '删除题目 1', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '删除题目', exact: true })
  await dialog.getByRole('button', { name: '确认删除' }).click()
  await expect(dialog.getByText('后端服务异常或代理无法连接，请检查后端服务后重试。', { exact: true })).toHaveCount(1)
  await expect(page.locator('.question-title')).toHaveText('测试题目 1')
  await dialog.getByRole('button', { name: '确认删除' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('暂无题目', { exact: true })).toBeVisible()
  await expect(page.getByText('共 0 条记录', { exact: true })).toBeVisible()
})

test('详情请求收到空响应体401时退出会话，不再继续操作', async ({ page }) => {
  await page.route('**/api/admin/question/page?*', (route) => reply(route, { total: 1, records: [question(1)] }))
  await page.route('**/api/admin/question/1', (route) => route.fulfill({ status: 401, body: '' }))
  await page.goto('/questions')
  await page.getByRole('button', { name: /^查看题目 1：/ }).click()
  await expect(page).toHaveURL(/\/login\?reason=expired$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('sqloj.auth'))).toBeNull()
})

test('手机列表可直接编辑删除，标题仍可查看详情', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.route('**/api/admin/question/page?*', (route) => reply(route, { total: 1, records: [question(1)] }))
  await page.route('**/api/admin/question/1', (route) => reply(route, question(1)))
  await page.goto('/questions')
  await expect(page.getByRole('button', { name: /^查看题目 1：/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '编辑题目 1', exact: true })).toBeInViewport()
  await expect(page.getByRole('button', { name: '删除题目 1', exact: true })).toBeInViewport()
  await page.getByRole('button', { name: '新增题目', exact: true }).click()
  const createDialog = page.getByRole('dialog', { name: '新增题目', exact: true })
  await fillRequired(createDialog)
  await expect(createDialog.getByLabel('题目标题', { exact: true })).toHaveValue('新增测试题目')
  await createDialog.getByText('要求结果顺序一致', { exact: true }).click()
  await expect(createDialog.getByRole('radio', { name: '要求结果顺序一致' })).toBeChecked()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await createDialog.locator('.el-dialog__body').evaluate((element) => { element.scrollTop = 0 })
  await page.screenshot({ path: 'test-results/question-editor-mobile.png', fullPage: true, animations: 'disabled' })
  await createDialog.getByRole('button', { name: '取消', exact: true }).click()
  await openEdit(page, 1)
  const editDialog = page.getByRole('dialog', { name: '编辑题目', exact: true })
  await expect(editDialog.getByLabel('题目标题', { exact: true })).toHaveValue('测试题目 1')
  const bounds = await editDialog.boundingBox()
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(375)
  await editDialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const detail = await openDetails(page, 1)
  await expect(detail.getByRole('heading', { name: '测试题目 1', exact: true })).toBeVisible()
  await detail.getByRole('button', { name: '关闭', exact: true }).click()
  await page.getByRole('button', { name: '删除题目 1', exact: true }).click()
  const deleteDialog = page.getByRole('dialog', { name: '删除题目', exact: true })
  await expect(deleteDialog.getByText('测试题目 1', { exact: true })).toBeVisible()
  await deleteDialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(deleteDialog).toBeHidden()
  await page.screenshot({ path: 'test-results/question-crud-mobile.png', fullPage: true, animations: 'disabled' })
})

test('只读详情显示完整最新文本和原始SQL，未知枚举原样展示，支持键盘和手机滚动', async ({ page }) => {
  const latest = {
    ...question(1), title: '统计各部门员工人数与平均薪资', difficulty: 'CUSTOM', status: 'CUSTOM_STATUS', orderSensitive: 9,
    questionText: '给定员工表 employee，包含 id、department_id 和 salary 字段。\n\n按部门统计员工人数与平均薪资，仅返回员工人数大于 5 的部门。\n结果按平均薪资降序排列。\n\n' + '补充说明：空值不计入平均薪资计算。\n'.repeat(12) + '<img src=x onerror=alert(1)>',
    standardSql: '  SELECT department_id, COUNT(*) AS total, AVG(salary) AS avg_salary\n  FROM employee\n  GROUP BY department_id\n  HAVING COUNT(*) > 5\n  ORDER BY avg_salary DESC;\n',
  }
  await page.route('**/api/admin/question/page?*', (route) => reply(route, { total: 1, records: [question(1)] }))
  await page.route('**/api/admin/question/1', async (route) => {
    expect(route.request().method()).toBe('GET')
    expect(route.request().headers().authorization).toBe(`Bearer ${session.token}`)
    await new Promise((resolve) => setTimeout(resolve, 250))
    await reply(route, latest)
  })
  await page.goto('/questions')
  await expect(page.getByRole('columnheader', { name: '操作', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '编辑题目 1', exact: true })).toBeVisible()
  const title = page.getByRole('button', { name: /^查看题目 1：/ })
  await title.hover()
  await expect(title).toHaveCSS('text-decoration-line', 'none')
  await title.focus()
  await title.press('Enter')
  const detail = page.getByRole('dialog', { name: '题目详情', exact: true })
  await expect(detail.getByRole('button', { name: /编辑|删除/ })).toHaveCount(0)
  await expect(detail.getByRole('heading', { name: latest.title, exact: true })).toBeVisible()
  expect(await detail.locator('.detail-description').textContent()).toBe(latest.questionText)
  expect(await detail.locator('.detail-sql code').textContent()).toBe(latest.standardSql)
  await expect(detail.locator('input, textarea, form, .detail-description img')).toHaveCount(0)
  await expect(detail.getByText('CUSTOM', { exact: true })).toBeVisible()
  await expect(detail.getByText('CUSTOM_STATUS', { exact: true })).toBeVisible()
  await expect(detail.getByText('9', { exact: true })).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.screenshot({ path: 'test-results/question-detail-desktop.png', fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const body = detail.locator('.el-dialog__body')
  expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
  await body.evaluate((el) => { el.scrollTop = el.scrollHeight })
  await expect(detail.locator('.detail-sql')).toBeInViewport()
  await expect(detail.getByRole('button', { name: '关闭', exact: true })).toBeInViewport()
  const bounds = await detail.boundingBox()
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(375)
  await page.screenshot({ path: 'test-results/question-detail-mobile.png', fullPage: true, animations: 'disabled' })
  await detail.getByRole('button', { name: '关闭', exact: true }).click()
  await expect(detail).toHaveCount(0)
  await expect(page.locator('.detail-sql')).toHaveCount(0)
})

test('只读详情失败与空记录允许重试，详情内不提供编辑删除', async ({ page }) => {
  let calls = 0
  await page.route('**/api/admin/question/page?*', (route) => reply(route, { total: 1, records: [question(1)] }))
  await page.route('**/api/admin/question/1', async (route) => {
    expect(route.request().method()).toBe('GET')
    calls++
    if (calls === 1) await route.abort('failed')
    else await reply(route, calls === 2 ? null : question(1))
  })
  await page.goto('/questions')
  await page.getByRole('button', { name: /^查看题目 1：/ }).click()
  const detail = page.getByRole('dialog', { name: '题目详情', exact: true })
  await expect(detail.getByText('无法连接服务，请检查网络或后端服务是否已启动。')).toBeVisible()
  await expect(detail.getByRole('button', { name: /编辑|删除/ })).toHaveCount(0)
  await detail.getByRole('button', { name: '重新加载详情' }).click()
  await expect(detail.getByText('题目不存在或已被删除，请关闭窗口后重新查看列表。')).toBeVisible()
  await expect(detail.getByRole('button', { name: /编辑|删除/ })).toHaveCount(0)
  await detail.getByRole('button', { name: '重新加载详情' }).click()
  await expect(detail.getByRole('heading', { name: '测试题目 1', exact: true })).toBeVisible()
  await expect(detail.getByRole('button', { name: /编辑|删除/ })).toHaveCount(0)
})

test('关闭仍在加载的详情后查看另一题，迟到响应不覆盖当前内容', async ({ page }) => {
  let releaseFirst
  const firstPending = new Promise((resolve) => { releaseFirst = resolve })
  await page.route('**/api/admin/question/page?*', (route) => reply(route, { total: 2, records: [question(1), question(2)] }))
  await page.route('**/api/admin/question/1', async (route) => {
    await firstPending
    await reply(route, question(1))
  })
  await page.route('**/api/admin/question/2', (route) => reply(route, question(2)))
  await page.goto('/questions')
  const firstRequest = page.waitForRequest('**/api/admin/question/1')
  await page.getByRole('button', { name: /^查看题目 1：/ }).click()
  await firstRequest
  const detail = page.getByRole('dialog', { name: '题目详情', exact: true })
  await detail.getByRole('button', { name: '关闭', exact: true }).click()
  await openDetails(page, 2)
  releaseFirst()
  await expect(detail.getByRole('heading', { name: '测试题目 2', exact: true })).toBeVisible()
  await expect(detail.getByRole('heading', { name: '测试题目 1', exact: true })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(1)
})
