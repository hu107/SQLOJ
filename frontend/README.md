# SQLOJ 管理端前端

Vue 3 + Vite + JavaScript + Vue Router + Pinia + Axios + Element Plus，组件使用 `<script setup>`。当前实现登录、注册，以及题目分页、只读详情、新增、编辑和删除；中文界面，白色与浅灰背景、绿色主色，支持桌面和手机宽度。

2026-09-20：管理页采用顶部导航与单栏表格，卡片右上角提供“新增题目”。点击题目标题打开只读详情，完整展示题目描述、标准 SQL、难度、状态和结果顺序；列表右侧操作列提供“编辑”和“删除”，详情底部只保留“关闭”。标题悬停不显示下划线。没有重复的大标题、面包屑或手动刷新按钮，写入成功后自动更新列表。新增和编辑使用同一个表单弹窗，编辑先读取最新详情；删除需要确认，失败会保留原题目。取消编辑或删除回到列表，成功后自动更新列表。手机表格支持内部横向滚动，操作列固定在右侧，详情长内容可滚动。没有练习分类、学习卡片、日历、VIP、宣传图片，也没有尚无接口支持的搜索、筛选或 SQL 执行功能。

表单包含标题（最多 200 个字符）、难度、状态、题目描述、标准答案 SQL 和结果顺序。题目描述同时包含查询要求和示例表名，例如 `查询所有用户信息。\n\n示例：user_profile`；不再使用独立的 `tableStructure` 字段。必填内容与枚举值在提交前校验，题目描述和 SQL 原样提交，保存失败保留输入。保存中禁止重复提交和关闭窗口。编辑、删除成功后保留当前分页；删除空末页时自动回退。后端按 ID 升序返回列表，因此新增成功后根据最新总数进入末页查看新题目。

SQLOJ 标志使用括号与查询光标组合的简洁 SVG，统一用于导航、认证页面和浏览器页签。图形在 `public/sqloj-mark.svg`，字标与组件样式在 `src/components/BrandLogo.vue`，可直接修改。

## 安装与启动

需要 Node.js 20.19+ 或 22.12+（本次环境为 Node.js 24.14.0）。在项目根目录执行：

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

依赖已安装并提供 `package-lock.json`，后续可使用 `npm ci` 严格按锁文件安装。默认打开 http://127.0.0.1:5173；端口占用时以终端输出为准。

编辑 `.env.local` 中的后端地址，然后重启 Vite：

```dotenv
API_PROXY_TARGET=http://localhost:8080
```

前端请求统一以 `/api` 开头；开发代理会去掉 `/api`，例如 `/api/login` → `http://localhost:8080/login`。变量只供 Vite 服务器读取，不需要 `VITE_` 前缀。

```powershell
npm run build
npm run preview
```

构建结果在 `dist/`。`preview` 只用于检查静态构建；开发联调使用 `npm run dev`。生产服务器需要自行配置 `/api` 反向代理并移除前缀，以及 Vue Router history 的页面回退到 `index.html`。

## 目录结构

```text
frontend/
├── public/sqloj-mark.svg    # 共用品牌图形与页签图标
├── src/
│   ├── api/                 # auth.js、questions.js：接口路径和请求字段
│   ├── utils/               # request.js、storage.js、questionOptions.js（枚举）
│   ├── stores/auth.js       # Token、必要用户信息、登录和本地退出
│   ├── router/index.js      # 路由、登录守卫、页面标题
│   ├── layouts/             # AuthLayout.vue、AppLayout.vue
│   ├── components/          # BrandLogo、QuestionDetailDialog（详情）、QuestionFormDialog（新增/编辑）
│   ├── views/               # LoginView、RegisterView、QuestionListView
│   ├── styles/              # main.css 公共/认证样式；questions.css 管理布局
│   ├── App.vue
│   └── main.js
├── tests/                   # 独立浏览器测试、代理测试（模拟仅在这里）
├── .env.example             # 后端地址示例
├── vite.config.js           # /api 开发代理
├── playwright.config.js
└── package.json
```

## 前端使用的接口契约

此次接入增删改前重新核对了最新 QuestionController、QuestionDTO、QuestionPageQueryDTO、QuestionVO、Service、Mapper 和异常处理器。没有修改 Java 后端或数据库；登录注册、Axios 和路由守卫沿用现有实现。

| 前端请求 | 后端契约与实现 |
| --- | --- |
| `POST /api/login` | `{ username, passwordHash }`；`passwordHash` 仍是原始密码；成功返回 `{ id, username, token }` |
| `POST /api/register` | `{ username, passwordHash, confirmPassword }`；成功 data 为 null |
| `GET /api/admin/question/page` | 只传 `page`、`pageSize`；成功 data 为 `{ total, records }` |
| `GET /api/admin/question/{id}` | 只读详情及编辑回填，读取 `id`、`title`、`questionText`、`difficulty`、`standardSql`、`orderSensitive`、`status`；此 VO 不含时间字段 |
| `POST /api/admin/question/add` | 发送完整的可编辑字段，不发送 ID、创建时间和更新时间；成功 data 为 null |
| `PUT /api/admin/question` | 发送 ID 和完整的可编辑字段；成功 data 为 null |
| `DELETE /api/admin/question/{id}` | ID 在路径中，不发送请求体；成功 data 为 null |

业务成功严格判断 `code === 1`，错误显示后端 `msg`。列表展示 `id`、`title`、`questionText` 摘要、`difficulty`、`status`、`orderSensitive`、`createTime` 和 `updateTime`。标题及描述过长时截断，点击标题可查看完整详情。详情保留文本换行、SQL 缩进，通过文本插值显示，不执行 HTML 或 SQL。已定义的枚举展示中文，未知值保留原样；缺失的可选字段显示 `—`。时间只把 `T` 换为空格，不猜测时区。`standardSql` 在详情和新增/编辑表单展示，不显示在列表。总数完全来自后端。

| 字段 | 后端值与中文显示 |
| --- | --- |
| `difficulty` | `EASY` 简单、`MEDIUM` 中等、`HARD` 困难 |
| `status` | `DRAFT` 草稿、`PUBLISHED` 已发布、`DISABLED` 已停用 |
| `orderSensitive` | 数字 `0` 忽略顺序、数字 `1` 顺序一致 |

枚举集中在 `src/utils/questionOptions.js`。状态在编辑表单内提交，不调用独立的上下架接口。只读详情失败或返回 null 时提供重新读取入口；编辑表单读取失败时禁止保存。关闭详情会取消读取请求，避免迟到响应覆盖其他题目。

登录状态使用 `localStorage` 的 `sqloj.auth`，内容仅为 `{ token, user: { id, username } }`。刷新后恢复；不存储密码。登录、注册不携带旧 Token；受保护请求携带 Bearer Token。401 兼容空响应体，清除会话并回到登录页；页面内单处提示，避免重复弹窗。退出只清理本地状态，不请求不存在的接口。没有 `/me` 或刷新 Token 请求。

路由守卫仅表示前端登录拦截。登录响应契约没有角色字段，页面上的“管理端”标识表示产品用途，不表示已验证当前账号拥有管理员权限；本版未实现管理员授权控制。注册也不分配管理员角色。

## 首次交付时的后端核对记录（历史）

以下是首次交付时发现的问题。后端已有后续调整，本次仅修改前端，这些记录不代表当前仍存在的阻塞；是否修复以最新源码和真实接口验证为准。

1. **注册路径缺失**：当时注册方法仅有 `@PostMapping`，SecurityConfig 放行 `/register`。应使用 `@PostMapping("/register")`；前端一直在 `src/api/auth.js` 请求 `/register`。
2. **BCrypt 登录校验错误**：当时登录重新 `encode()` 输入密码后查询哈希。应按用户名查找用户，再调用 `encoder.matches(原始密码, 数据库中的哈希)`。
3. **用户状态定义不一致**：当时注册写入正常状态 `"1"`，登录只接受 `"0"`，需要统一状态含义。

首次检查还发现 Controller 请求体未使用 `@Valid`。Service 上的注解不能替代 Controller 请求校验；前端表单校验也不能替代后端校验。

当前使用的分页契约包含 `standardSql`，前端不展示不等于响应中没有该字段；将来面向练习者设计接口时，应使用不含答案的 VO。

## 验证与边界

```powershell
# 首次使用 Playwright 自带 Chromium
npx playwright install chromium
npm run test:e2e
npm run test:proxy

# 或复用本机已安装的 Chrome（本次验证使用此方式）
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:e2e
```

浏览器测试检查必填/长度/密码一致性、密码显示隐藏和原样提交、防重复提交、注册成功回填用户名、登录保存与刷新恢复、本地退出、路由守卫、分页与每页条数、加载/空/失败/重试、无响应体 401、网络错误、损坏缓存和手机宽度。`tests/` 的拦截响应与正常运行完全隔离，正常请求失败不会替换为模拟数据。

`tests/questions-crud.spec.js` 另行验证新增和完整编辑请求、SQL 空白保留、详情读取、失败保留输入、防重复提交、删除确认/取消、删除失败、空末页回退、最后一条删除、403、详情 401 以及手机弹窗。详情用例覆盖键盘打开、完整文本与安全渲染、未知枚举、失败/null 重试、关闭后的迟到响应；列表可直接编辑/删除，详情内不提供编辑/删除。所有写入测试都由浏览器拦截，不修改真实题库。

浏览器测试独立启动 `127.0.0.1:5174`，不复用 `5173` 的开发页面。运行前需确保 `5174` 空闲。管理端布局检查覆盖 375、768、1440、1920 像素宽度。

代理测试启动临时本地 HTTP 服务，验证可配置地址、三个接口的前缀重写、分页查询参数和 Authorization 转发；这不是 Java 后端联调。

最新验证结果见 `VERIFICATION.md`。构建仍有 Element Plus 主包体积提醒。本次真实服务探测确认前端 `5173` 可访问、后端 `8080` 对未认证分页请求返回 401；未进行真实账号的增删改联调。数据库外键可能阻止删除有关联记录的题目，前端显示实际失败信息，不隐藏此类错误。权限控制按当前阶段暂缓，本次只补齐前端功能。
