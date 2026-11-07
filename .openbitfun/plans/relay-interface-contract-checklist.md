# kejike 中转站接口适配清单

> 范围：整理现有只读审计证据与适配前阻断契约。没有对中转站执行注册、登录、创建订单、模型调用、配置修改或数据库操作。本清单不表示视频站已接入。

## 已确认的现场行为

| 请求 | 结果 | 能证明什么 |
| --- | --- | --- |
| `GET https://sub.kejike.top/` | HTTP 200 | 根站点可访问。 |
| `GET https://sub.kejike.top/health` | HTTP 200，返回 `status: ok` | 基础健康探针可访问；不证明登录、计费、模型或视频任务链路可用。 |
| `GET https://sub.kejike.top/api/health` | HTTP 404 | 该路径未提供；不能推断其他业务 API 不存在。 |
| `GET https://sub.kejike.top/v1/models`（匿名） | HTTP 401，要求 Bearer API Key | OpenAI 兼容模型目录入口需要 Bearer 鉴权。未用有效用户 Key 验证模型列表或权限。 |

## 前端静态资产可见的业务路径

下列路径来自公开前端静态构建资源的只读检查。这里只确认前端代码中出现了路径；请求体、响应体、权限、鉴权、状态码及完整业务流程没有通过授权账号验证，不应当视作已完成接口契约。

### 认证候选接口

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- 另可见验证码、找回密码、OAuth、Passkey 等扩展路径；各自能力尚未逐项确认。

前端采用 Bearer access token 与 refresh token 的迹象，不等于视频站获得正式委托登录能力。不能据此把中转站用户名密码代理到视频站，也不能把浏览器 localStorage token 复制进视频站。

### 用户、额度和用量候选接口

- `GET /api/v1/user/profile`
- `GET /api/v1/user/platform-quotas`
- `GET /api/v1/usage`
- `GET /api/v1/usage/stats`
- `GET /api/v1/usage/{id}`
- `GET /api/v1/user/api-keys/{id}/usage/daily`

静态资产中还出现用户资料更新、密码修改等请求路径；本适配不需要写入用户资料。余额、额度单位、赠金/冻结分项、分页、权限和账本一致性均未核实。

### 分组、渠道和模型候选接口

- `GET /api/v1/groups/available`
- `GET /api/v1/groups/rates`
- `GET /api/v1/channels/available`
- `/v1/models`（需 Bearer；匿名访问实测 401）

尚未确认分组和费率接口的用户权限、模型稳定 ID、模态能力、具体价格和目录结果是否代表可端到端调用。不能据此推断存在 `VIDEO` 模型或视频任务接口。

### 支付和充值候选接口

- `GET /api/v1/payment/config`
- `GET /api/v1/payment/plans`
- `GET /api/v1/payment/checkout-info`
- `GET /api/v1/payment/limits`
- `POST /api/v1/payment/orders`
- `GET /api/v1/payment/orders/my`
- `GET /api/v1/payment/orders/{id}`
- `POST /api/v1/payment/orders/{id}/cancel`
- `POST /api/v1/payment/orders/verify`
- 另见公开订单验证/解析路径；需确认具体权限与用途。

未创建过订单，未验证支付流程。金额服务端定价、订单用户绑定、checkout URL 安全性、回跳与 webhook 的权威性、退款及到账时序都未确认。视频站在契约确认前不应创建中转站订单；目标是将用户引导至中转站原生充值流程，而非复制支付逻辑。

## 尚缺的关键契约（阻止接入）

### 1. SSO 与稳定身份

- 正式 OIDC/OAuth client 注册及 Authorization Code + PKCE，或等价的一次性登录票据方案。
- 授权 URL、redirect URI allowlist、state/nonce、issuer、audience、scope 和一次性 code 规则。
- 后端 token exchange 接口、client 认证方法、access/refresh 生命周期、轮换、撤销、全局注销及 401 刷新语义。
- 稳定用户主键（例如 `sub`）、账户状态/禁用语义；不得按邮箱或显示名盲目合并本地用户。
- CORS、CSRF、Cookie 与回调安全要求。

### 2. 按用户计费的模型调用

- 视频站后端如何将已认证的中转站用户身份委托给调用网关；服务端不能使用一个共享管理员 Key 冒充所有用户。
- Chat 流式、Image JSON/multipart、Video 提交各自的准确路径、请求/响应 schema、鉴权方式和错误码。
- 用户余额预授权/原子扣费、成功结算、失败退款、余额不足及请求取消的规则，统一账单查询和 billing ID。
- 稳定模型 ID、模型能力与价格来源、授权范围、限流及 `402/403/429/5xx` 错误契约。
- 全链路 `requestId` / `Idempotency-Key` 语义及超时后的查询方式，防止重复扣费和重复任务。

### 3. 视频异步任务

- Submit 的输入、用户绑定、模型/素材参数以及返回的 `requestId`、`jobId`、`billingId`。
- Poll/query 状态枚举、进度、结果 URL、错误、保留期限及最终计费状态。
- Webhook 的签名算法、时间戳/重放保护、事件 ID、重试/顺序、密钥轮换和幂等处理，或明确的轮询替代方案。
- 取消权限与取消收费规则；失败、部分成功、超时和退款对账规则。

### 4. 余额、账单与充值跳转

- 余额/额度字段、币种或积分单位、精度、赠金/订阅/冻结分项及并发一致性定义。
- 用量与账单能否关联 `requestId`/`jobId`/`billingId`，是否可分页查询、退款记录和对账导出。
- 服务端生成、绑定当前用户与订单、短时有效且金额不可篡改的充值/checkout URL；`return_url` 白名单及签名要求。
- 支付 webhook 或订单查询的最终事实来源。浏览器回跳只能刷新展示，不可作为到账凭据。

## 视频站隔离实施状态

- 新增独立模块 `server/isolated-relay-adapter/adapter.ts`，没有接入 `server/index.ts`，不影响现有登录、计费、Provider 或生成调用。
- Namespace 为 `/__isolated_relay`，默认关闭；唯一 allowlist 操作为只读 status 探针。此探针不是业务适配接口，也不含认证、额度、充值、生成或视频任务功能。
- 本地测试覆盖默认关闭无网络调用、固定 HTTPS/host/path、禁重定向、无授权头、敏感错误不回显及禁止写类操作。测试使用 stub fetch，不访问中转站。
- 不开放注册、支付订单创建、模型生成、视频任务提交/取消等写操作；无数据库迁移或账本写入。
- 该骨架不是可用的登录/共享额度实现，也没有生产路由、前端入口或生产配置，不得切生产。

## 后续验收顺序

1. 取得中转站正式接口文档或由用户授权的测试方式；逐项验证 schema、权限及异常语义，不在聊天中传递密码或 API Key。
2. 在本地隔离 fixture/stub 中补齐契约测试，不触达线上中转站，不改现有登录、账本和生成路由。
3. 若中转站缺少 SSO、按用户计费委托或视频 job 契约，先停止对应能力；不得用共享 Key 或本地积分冒充共享额度。
4. 需要真实中转站验证时，另行明确授权测试账号和允许的请求范围；支付、配置或账务写操作应单独审批。
5. 生产切换只有在备份、灰度、完整账务/任务验收和回滚演练通过后另行授权；本次请求不包含部署或切生产。
