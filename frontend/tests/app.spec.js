import { test, expect } from '@playwright/test'

// 模拟数据只存在于测试拦截中，正常开发及构建代码没有模拟 API。
const session = { token: 'isolated-test-token', user: { id: 7, username: 'testuser' } }
const question = (id) => ({
  id, title: `测试题目 ${id}`, difficulty: 'D2', status: '0',
  questionText: `用于验证管理表格的第 ${id} 道测试题描述。`, orderSensitive: 0,
  updateTime: '2026-09-20T09:30:00',
  createTime: '2026-09-19T10:20:30', standardSql: 'SECRET_STANDARD_SQL',
})
async function authenticate(page) {
  await page.addInitScript((data) => {
    if (!sessionStorage.getItem('test-seeded')) {
      localStorage.setItem('sqloj.auth', JSON.stringify(data))
      sessionStorage.setItem('test-seeded', '1')
    }
  }, session)
}
async function fulfill(route, data, code = 1, msg = null) {
  await route.fulfill({ json: { code, msg, data } })
}

test('未登录路由拦截、必填校验和注册入口', async ({ page }) => {
  let requests = 0
  await page.route((url) => url.pathname.startsWith('/api/'), (route) => { requests++; return fulfill(route, null) })
  await page.goto('/questions')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('button', { name: '登 录' }).click()
  await expect(page.locator('.el-form-item__error')).toHaveCount(2)
  expect(requests).toBe(0)
  await page.getByRole('link', { name: /立即注册/ }).click()
  await expect(page).toHaveURL(/\/register$/)
})

test('登录原样传密码、防重复提交、保存会话、刷新恢复和本地退出', async ({ page }) => {
  let calls = 0
  await page.route('**/api/login', async (route) => {
    calls++
    expect(route.request().headers().authorization).toBeUndefined()
    expect(route.request().postDataJSON()).toEqual({ username: 'testuser', passwordHash: ' pass1234 ' })
    await new Promise((resolve) => setTimeout(resolve, 400))
    await fulfill(route, { ...session.user, token: session.token })
  })
  await page.route('**/api/admin/question/page?*', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${session.token}`)
    await fulfill(route, { total: 1, records: [question(1)] })
  })
  await page.goto('/login')
  await page.screenshot({ path: 'test-results/desktop-login.png', fullPage: true })
  await page.getByLabel('用户名', { exact: true }).fill('testuser')
  await page.getByLabel('密码', { exact: true }).fill(' pass1234 ')
  await page.locator('.el-input__password').click()
  await expect(page.getByLabel('密码', { exact: true })).toHaveAttribute('type', 'text')
  await page.locator('.el-input__password').click()
  await expect(page.getByLabel('密码', { exact: true })).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: '登 录' }).click()
  await expect(page.getByRole('button', { name: '登录中…' })).toBeVisible()
  await page.locator('form').dispatchEvent('submit')
  await expect(page).toHaveURL(/\/questions$/)
  expect(calls).toBe(1)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sqloj.auth')))).toEqual(session)
  await page.reload()
  await expect(page.getByText('测试题目 1', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/desktop-questions.png', fullPage: true })
  await expect(page.getByText('D2', { exact: true })).toBeVisible()
  await expect(page.getByText('2026-09-20 09:30:00', { exact: true })).toBeVisible()
  await expect(page.getByText('SECRET_STANDARD_SQL')).toHaveCount(0)
  await page.goto('/login')
  await expect(page).toHaveURL(/\/questions$/)
  await page.getByRole('button', { name: '退出登录' }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => localStorage.getItem('sqloj.auth'))).toBeNull()
})

test('注册长度、确认密码校验、原样提交和用户名回填', async ({ page }) => {
  let calls = 0
  await page.route('**/api/register', async (route) => {
    calls++
    expect(route.request().headers().authorization).toBeUndefined()
    expect(route.request().postDataJSON()).toEqual({ username: 'newuser', passwordHash: ' abcdefgh ', confirmPassword: ' abcdefgh ' })
    await fulfill(route, null)
  })
  await page.goto('/register')
  await page.getByLabel('用户名', { exact: true }).fill('abc')
  await page.getByLabel('密码', { exact: true }).fill('1234567')
  await page.getByLabel('确认密码', { exact: true }).fill('different')
  await page.getByRole('button', { name: '注 册' }).click()
  await expect(page.getByText('用户名长度为 4～10 个字符', { exact: true })).toBeVisible()
  await expect(page.getByText('密码长度为 8～20 个字符', { exact: true })).toBeVisible()
  await expect(page.getByText('两次输入的密码不一致', { exact: true })).toBeVisible()
  await page.getByLabel('用户名', { exact: true }).fill('abcdefghijk')
  await page.getByLabel('密码', { exact: true }).fill('a'.repeat(21))
  await page.getByRole('button', { name: '注 册' }).click()
  await expect(page.getByText('用户名长度为 4～10 个字符', { exact: true })).toBeVisible()
  await expect(page.getByText('密码长度为 8～20 个字符', { exact: true })).toBeVisible()
  expect(calls).toBe(0)
  await page.getByLabel('用户名', { exact: true }).fill('newuser')
  await page.getByLabel('密码', { exact: true }).fill(' abcdefgh ')
  await page.getByLabel('确认密码', { exact: true }).fill(' abcdefgh ')
  await page.getByRole('button', { name: '注 册' }).click()
  await expect(page).toHaveURL(/\/login\?username=newuser&registered=1$/)
  await expect(page.getByLabel('用户名', { exact: true })).toHaveValue('newuser')
  await expect(page.getByLabel('密码', { exact: true })).toHaveValue('')
  await expect(page.getByText('注册成功，请使用新账号登录。')).toBeVisible()
  expect(calls).toBe(1)
  expect(await page.evaluate(() => localStorage.getItem('sqloj.auth'))).toBeNull()
})

test('业务失败严格判断 code，显示后端错误且不保存会话', async ({ page }) => {
  await page.route('**/api/login', (route) => fulfill(route, null, 200, '用户名或密码错误'))
  await page.goto('/login')
  await page.getByLabel('用户名', { exact: true }).fill('testuser')
  await page.getByLabel('密码', { exact: true }).fill('abcdefgh')
  await page.getByRole('button', { name: '登 录' }).click()
  await expect(page.getByText('用户名或密码错误', { exact: true })).toHaveCount(1)
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => localStorage.getItem('sqloj.auth'))).toBeNull()
})

test('分页和修改页容量回第一页', async ({ page }) => {
  await authenticate(page)
  const requests = []
  await page.route('**/api/admin/question/page?*', async (route) => {
    const params = new URL(route.request().url()).searchParams
    requests.push(Object.fromEntries(params))
    expect([...params.keys()].sort()).toEqual(['page', 'pageSize'])
    const id = (Number(params.get('page')) - 1) * Number(params.get('pageSize')) + 1
    await fulfill(route, { total: 51, records: [question(id)] })
  })
  await page.goto('/questions')
  await expect(page.getByText('测试题目 1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page.getByText('测试题目 11', { exact: true })).toBeVisible()
  await page.locator('.page-size .el-select__wrapper').click()
  await page.getByRole('option', { name: '20 条' }).click()
  await expect(page.getByText('测试题目 1', { exact: true })).toBeVisible()
  expect(requests.at(-1)).toEqual({ page: '1', pageSize: '20' })
  await expect(page.getByText('共 51 条记录', { exact: true })).toBeVisible()
})

test('加载中、业务错误、重试和空数据', async ({ page }) => {
  await authenticate(page)
  let calls = 0
  await page.route('**/api/admin/question/page?*', async (route) => {
    calls++
    if (calls === 1) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      await fulfill(route, null, 0, '题库暂时不可用')
    } else await fulfill(route, { total: 0, records: [] })
  })
  await page.goto('/questions')
  await expect(page.getByText('正在加载题目…', { exact: true })).toBeVisible()
  await expect(page.getByText('题库暂时不可用', { exact: true })).toHaveCount(1)
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.getByText('暂无题目', { exact: true })).toBeVisible()
  await expect(page.getByText('共 0 条记录', { exact: true })).toBeVisible()
})

test('无响应体的受保护请求 401 清理会话并跳转，无重定向循环', async ({ page }) => {
  await authenticate(page)
  let calls = 0
  await page.route('**/api/admin/question/page?*', async (route) => {
    calls++
    await route.fulfill({ status: 401, body: '' })
  })
  await page.goto('/questions')
  await expect(page).toHaveURL(/\/login\?reason=expired$/)
  await expect(page.getByText('登录状态已失效，请重新登录。')).toHaveCount(1)
  expect(await page.evaluate(() => localStorage.getItem('sqloj.auth'))).toBeNull()
  await page.reload()
  await expect(page).toHaveURL(/\/login\?reason=expired$/)
  expect(calls).toBe(1)
})

test('公开请求不读取后来写入的旧 Token，401 保留登录页', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate((data) => localStorage.setItem('sqloj.auth', JSON.stringify(data)), session)
  await page.route('**/api/login', async (route) => {
    expect(route.request().headers().authorization).toBeUndefined()
    await route.fulfill({ status: 401, body: '' })
  })
  await page.getByLabel('用户名', { exact: true }).fill('testuser')
  await page.getByLabel('密码', { exact: true }).fill('abcdefgh')
  await page.getByRole('button', { name: '登 录' }).click()
  await expect(page.getByText('登录状态已失效，请重新登录。')).toHaveCount(1)
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => localStorage.getItem('sqloj.auth'))).toBeNull()
})

test('网络失败清晰提示并可重新加载', async ({ page }) => {
  await authenticate(page)
  await page.route('**/api/admin/question/page?*', (route) => route.abort('failed'))
  await page.goto('/questions')
  await expect(page.getByText('无法连接服务，请检查网络或后端服务是否已启动。')).toBeVisible()
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})

test('注册映射不存在时展示真实错误，不访问根路径', async ({ page }) => {
  await page.route('**/api/register', (route) => route.fulfill({ status: 404, body: '' }))
  await page.goto('/register')
  await page.getByLabel('用户名', { exact: true }).fill('testuser')
  await page.getByLabel('密码', { exact: true }).fill('abcdefgh')
  await page.getByLabel('确认密码', { exact: true }).fill('abcdefgh')
  await page.getByRole('button', { name: '注 册' }).click()
  await expect(page.getByText('接口不存在，请检查后端接口路径配置。')).toBeVisible()
  await expect(page).toHaveURL(/\/register$/)
})

test('损坏本地缓存按未登录处理', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sqloj.auth', '{invalid'))
  await page.goto('/questions')
  await expect(page).toHaveURL(/\/login$/)
})

test('管理表格在手机、平板和桌面无页面横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/register')
  await expect(page.getByRole('button', { name: '注 册' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await authenticate(page)
  await page.route('**/api/admin/question/page?*', (route) => fulfill(route, {
    total: 100,
    records: Array.from({ length: 10 }, (_, i) => question(i + 1)),
  }))
  await page.goto('/questions')
  await expect(page.getByText('测试题目 1', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByRole('button', { name: '下一页' })).toBeVisible()
  await page.screenshot({ path: 'test-results/mobile-questions.png', fullPage: true })
  await expect(page.getByRole('heading', { name: '题目列表', level: 1 })).toBeVisible()
  for (const width of [768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width >= 1440) {
      await expect(page.getByRole('columnheader', { name: '更新时间' })).toBeVisible()
      await page.locator('.question-title').first().hover()
      await page.screenshot({ path: `test-results/questions-${width}.png`, fullPage: true })
    }
  }
})
