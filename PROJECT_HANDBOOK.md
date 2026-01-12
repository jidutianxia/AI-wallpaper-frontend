# AI壁纸社区平台 - 项目开发手册 & 接口规范

## 1. 项目概况

### 1.1 基本信息
- **项目名称**：AI壁纸社区平台 (AI Wallpaper Community)
- **核心功能**：AI壁纸生成、社区分享与互动、壁纸下载与收藏。
- **技术架构**：前后端分离，后端采用微服务架构。

### 1.2 技术栈
- **前端**：Vue3 + Vite + Pinia + Element Plus + TailwindCSS
- **后端**：SpringCloud Alibaba (Nacos, Sentinel, Gateway) + Spring Boot
- **AI能力**：ComfyUI (图像生成) + Dify (工作流编排)
- **数据存储**：MySQL (持久化) + Redis (缓存/Session)
- **部署**：Docker + Nginx

---

## 2. 接口规范与约定

### 2.1 基础路径
所有API请求统一前缀：`/api` (建议后续迁移至 `/api/v1/{模块名}`)
- **User Service**: `/api/auth`, `/api/user`, `/api/users`
- **Community Service**: `/api/community`
- **Wallpaper Service**: `/api/wallpapers`

### 2.2 响应结构 (Standard Envelope)
所有微服务接口必须遵循统一响应格式：
```json
{
  "code": 200,          // 业务状态码 (200:成功, 10001:未登录, 10002:无权限, 50000:系统错误)
  "message": "success", // 调试/提示信息
  "data": { ... }       // 业务数据
}
```

### 2.3 鉴权机制
- **方式**：JWT (JSON Web Token)
- **传输**：Header `Authorization: Bearer <token>`
- **存储**：前端 LocalStorage + Pinia；后端 Redis (白名单/黑名单机制)。
- **过期处理**：前端拦截 401 状态码 -> 清除 Token -> 触发 `auth-required` 事件 -> 弹出登录框。

---

## 3. 核心模块业务逻辑

### 3.1 用户中心 (User Service)
负责用户认证、资料管理及聚合统计。

- **聚合统计 (User Stats)**
  - **接口**：`GET /user/stats`
  - **逻辑**：后端需聚合 `user-service` (关注数) 和 `community-service` (点赞/收藏数)。
  - **返回结构**：
    ```json
    {
      "postCount": 10,
      "likeCount": 120,      // 获得的赞
      "favoriteCount": 5,    // 收藏总数 (壁纸+帖子)
      "followingCount": 20,
      "followerCount": 50
    }
    ```

- **交互列表**
  - **我的社区收藏**：`GET /community/my/favorites` (原 `api/wallpapers/my/favorites` 已废弃)
  - **我的社区点赞**：`GET /community/my/likes`
  - **我的壁纸收藏**：`GET /wallpapers/my/favorites`

### 3.2 社区模块 (Community Service)
负责帖子发布、流式展示及互动。

- **帖子列表**
  - **接口**：`GET /community/posts`
  - **优化**：支持 `includeCounts=true` 参数。列表项必须包含 `liked` (bool) 和 `favorited` (bool) 字段，由后端根据当前登录用户 ID 计算得出，避免前端 N+1 查询。
  
- **互动操作**
  - **点赞/收藏**：前端采用**乐观更新 (Optimistic UI)** 策略。
    1. 用户点击 -> 前端立即反转状态并更新计数。
    2. 后台异步发送请求。
    3. 若请求失败，前端回滚状态并提示错误。

### 3.3 AI生成模块 (Integration Service)
负责对接 ComfyUI/Dify。

- **工作流**：前端提交 Prompt -> 后端调用 Dify API -> Dify 调度 ComfyUI -> 生成图片 -> 上传 OSS -> 返回 URL。
- **异步处理**：生成过程较长，建议采用 WebSocket 或 轮询机制 (Polling) 获取生成结果。

---

## 4. 前端开发注意事项

1.  **状态管理 (Pinia)**
    - `userStore`：仅维护 `token`、`userInfo` 及登录态 `isAuthenticated`。
    - 业务数据（如帖子列表）尽量在组件内管理或使用专门的 `communityStore`，避免 store 膨胀。

2.  **组件规范**
    - **UnifiedCard**：通用卡片组件，用于展示壁纸和帖子。需通过 props (`no-actions`, `to`) 适配不同场景。
    - **响应式布局**：使用 TailwindCSS 的断点 (`md:`, `lg:`) 适配移动端与桌面端。

3.  **数据一致性**
    - 个人主页的统计数据与列表数据若出现不一致，优先以**后端返回的统计接口**为准。
    - 前端已实现降级策略：若统计接口失败，暂时使用列表长度兜底。

---

## 5. 后端重构/优化建议 (给后端开发)

1.  **Redis 缓存策略**
    - 热门帖子列表 (`/community/posts?sort=popular`) 建议缓存 5 分钟。
    - 用户点赞关系建议使用 Redis Set (`user:1001:likes`) 存储，以支持高性能的 `sismember` 查询 (用于判断 `liked` 状态)。

2.  **数据冗余**
    - 在 `posts` 表中冗余 `likes_count` 和 `comments_count` 字段，避免每次查询都 `count(*)` 关联表。交互发生时异步更新计数。

3.  **API 路径修正**
    - 确保 `GET /community/my/favorites` 和 `GET /community/my/likes` 已正确实现，替代旧的 `/wallpapers/...` 路径。
