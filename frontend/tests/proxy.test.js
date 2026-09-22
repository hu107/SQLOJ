import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { once } from 'node:events'
import { test } from 'node:test'
import { createServer as createViteServer } from 'vite'

test('Vite 使用可配置后端地址并移除 /api 前缀', async () => {
  // 仅测试时启动本地临时服务，正常运行不包含此响应。
  const received = []
  const backend = createHttpServer((req, res) => {
    received.push({ method: req.method, url: req.url, authorization: req.headers.authorization })
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ code: 1, msg: null, data: null }))
  })
  backend.listen(0, '127.0.0.1')
  await once(backend, 'listening')
  const originalTarget = process.env.API_PROXY_TARGET
  process.env.API_PROXY_TARGET = `http://127.0.0.1:${backend.address().port}`
  let vite
  try {
    vite = await createViteServer({ logLevel: 'error', server: { host: '127.0.0.1', port: 0 } })
    await vite.listen()
    const baseURL = `http://127.0.0.1:${vite.httpServer.address().port}`
    for (const endpoint of ['login', 'register']) {
      const response = await fetch(`${baseURL}/api/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      })
      assert.equal(response.status, 200)
      assert.equal((await response.json()).code, 1)
    }
    await fetch(`${baseURL}/api/admin/question/page?page=2&pageSize=20`, {
      headers: { Authorization: 'Bearer proxy-test-only' },
    })
    assert.deepEqual(received, [
      { method: 'POST', url: '/login', authorization: undefined },
      { method: 'POST', url: '/register', authorization: undefined },
      { method: 'GET', url: '/admin/question/page?page=2&pageSize=20', authorization: 'Bearer proxy-test-only' },
    ])
  } finally {
    await vite?.close()
    await new Promise((resolve) => backend.close(resolve))
    if (originalTarget === undefined) delete process.env.API_PROXY_TARGET
    else process.env.API_PROXY_TARGET = originalTarget
  }
})
