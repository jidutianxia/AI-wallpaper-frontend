# 前端业务需求与后端接口重构任务书

本文档梳理了前端当前及未来所需的核心业务逻辑与数据支持，旨在协助后端进行框架重构与数据库优化。请重点关注**数据一致性**、**交互态同步**及**性能优化**。

## 1. 核心架构与规范 (Core Architecture)

### 1.1 统一响应结构 (Standard Envelope)
前端不再处理非标准响应。所有 API 必须遵循统一的 JSON 结构：
```json
{
  "code": 200,          // 业务状态码 (200=成功, 401=未登录, 403=无权限, 500=错误)
  "message": "success", // 描述信息或错误提示
  "data": { ... }       // 业务数据 (对象或数组)
}
```

### 1.2 用户上下文 (User Context)
所有需要鉴权的接口，后端必须解析 `Authorization: Bearer <token>`。
**关键要求：**
- 接口返回的数据必须是**针对当前用户的**。
- 例如：获取帖子列表时，必须计算出 `liked: true/false`，而不是让前端去猜。

---

## 2. 社区模块 (Community Module) - 重构重点

### 2.1 帖子列表与详情
**需求场景**：首页瀑布流、搜索、详情页。
**后端任务**：
- **接口**：`GET /community/posts` & `GET /community/posts/{id}`
- **数据结构优化**：
  - `commentsCount`: 必须返回准确的评论总数（包含子评论）。
  - `liked` (bool): 当前用户是否点赞了该帖。
  - `favorited` (bool): 当前用户是否收藏了该帖。
  - `author`: 必须包含完整的作者信息 `{ id, username, nickname, avatarUrl }`。
- **性能要求**：列表接口支持 `includeCounts=true` 参数，避免 N+1 查询问题。

### 2.2 帖子交互 (Interactions)
**需求场景**：点赞、收藏、评论。
**后端任务**：
- **原子性操作**：点赞接口 `POST /community/posts/{id}/like` 需处理并发，确保计数准确。
- **返回值**：交互接口应返回**最新状态**，例如 `{ "liked": true, "likes": 101 }`，以便前端校准。

### 2.3 图片级元数据 (Image Meta)
**需求场景**：点击帖子中的单张图片进入沉浸式浏览。
**后端任务**：
- **新接口**：`GET /community/posts/{id}/images/{index}` (可选) 或在帖子详情中包含图片详细信息。
- **字段要求**：`width`, `height`, `fileSize`, `format`, `views` (浏览量), `downloads` (下载量)。
- **图片交互**：支持对**单张图片**进行点赞/收藏（若业务决定细化到图片级）。

---

## 3. 用户中心 (User Center) - 数据一致性

### 3.1 个人资料 (Profile)
**需求场景**：展示个人主页、编辑资料。
**后端任务**：
- **字段扩充**：用户表需支持 `nickname` (昵称), `bio` (简介), `avatarUrl`。
- **唯一性校验**：修改资料时，后端需校验 `nickname` 是否冲突（如允许重复则无需校验）。

### 3.2 用户统计 (Stats)
**需求场景**：个人主页头部的数字展示。
**后端任务**：
- **聚合接口**：`GET /user/stats`
- **返回数据**：
  ```json
  {
    "postCount": 10,       // 发布帖子数
    "likeCount": 100,      // 获得的帖子总赞数
    "receivedLikes": 50,   // (可选) 获得的评论总赞数
    "favorites": 5,        // 收藏的帖子/壁纸数
    "followingCount": 20,  // 关注数
    "followerCount": 50    // 粉丝数
  }
  ```

### 3.3 交互列表 (My Interactions)
**需求场景**：个人主页的“我的点赞”、“我的收藏” Tab。
**后端任务**：
- **明确分离资源类型**：
  - `GET /user/likes`: 返回我点赞的**社区帖子**列表。
  - `GET /user/post-favorites`: 返回我收藏的**社区帖子**列表。
  - `GET /wallpapers/my/favorites`: 返回我收藏的**官方壁纸**列表。
- **支持查看他人**：
  - `GET /users/{id}/likes`: 查看指定用户的点赞（需注意隐私权限控制）。

---

## 4. 社交关系 (Social Graph)

### 4.1 关注系统
**需求场景**：关注作者，获取关注流。
**后端任务**：
- **接口实现**：
  - `POST /users/{id}/follow`: 关注
  - `DELETE /users/{id}/follow`: 取消关注
  - `GET /users/{id}/followers`: 粉丝列表
  - `GET /users/{id}/following`: 关注列表
- **状态同步**：在获取用户详情或帖子列表时，包含 `isFollowing` (bool) 字段。

---

## 5. 基础设施与运维

### 5.1 文件服务 (OSS)
**需求场景**：上传头像、发布帖子图片。
**后端任务**：
- **统一上传接口**：`POST /upload`
- **处理逻辑**：
  - 自动判断文件类型（图片/视频）。
  - 生成缩略图 (Thumbnail) 和 原图 (Original)。
  - 返回统一结构：`{ "url": "...", "thumbUrl": "...", "width": 1920, "height": 1080 }`。

### 5.2 缓存策略 (Redis)
**建议**：
- 对热门帖子列表 (`sort=popular`) 进行缓存 (TTL 1-5分钟)。
- 对用户点赞状态 (`user:1:likes`) 使用 Set 结构存储，保证 O(1) 查询。
- **注意**：确保点赞/收藏操作能及时失效相关缓存，避免前端“刷新后数据回退”的问题。

---

**总结**：前端目前已完成对上述逻辑的适配准备（特别是乐观更新与数据校准）。后端重构的核心目标是**提供单一可信数据源 (Single Source of Truth)**，消除因数据拼凑导致的不一致。
