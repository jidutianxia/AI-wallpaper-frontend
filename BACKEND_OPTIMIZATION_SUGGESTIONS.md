# 后端接口优化与规范建议书

针对目前前端遇到的数据一致性、交互态同步及接口结构混乱问题，提出以下具体的后端优化建议。采用此规范将大幅提升前后端对接效率及用户体验。

## 1. 统一响应结构 (Standard Envelope)

目前部分接口直接返回数组，部分返回 `{ data: ... }`，部分返回 `{ result: ... }`，导致前端需要编写大量兼容代码。

**建议规范：**
所有接口（包括成功与失败）均返回统一的 JSON 结构：

```json
{
  "code": 200,          // 业务状态码，200 表示成功，非 200 表示业务异常
  "message": "success", // 描述信息，错误时为具体错误提示
  "data": { ... }       // 实际业务数据，列表时建议包含分页信息
}
```

## 2. 社区列表接口增强 (Contextual Interaction State)

**痛点：**
目前获取帖子列表 (`GET /community/posts`) 时，未包含“当前用户是否已点赞/收藏”的状态。前端只能依靠本地缓存或二次请求，导致刷新后状态丢失或不一致。

**建议：**
在列表接口的返回项（Item）中，直接包含当前用户的交互状态。

**Response Item 示例：**
```json
{
  "id": 101,
  "title": "...",
  "likes": 150,
  "commentsCount": 12,
  "liked": true,        // [新增] 当前用户是否已点赞
  "favorited": false,   // [新增] 当前用户是否已收藏
  "author": { ... }
}
```
*注：后端需解析 `Authorization` 头，若未登录则返回 `false`。*

## 3. 个人中心与资源接口分离

**现状：**
`getMyLikes` 与 `getMyFavorites` 语义模糊，不确定是返回“壁纸”还是“帖子”。

**建议：**
明确区分资源类型，或提供聚合接口。

- **壁纸收藏：** `GET /wallpapers/my/favorites`
- **帖子收藏：** `GET /community/my/favorites`
- **帖子点赞：** `GET /community/my/likes` (或 `/user/likes`)

**列表项规范：**
确保所有列表接口返回的对象中至少包含以下字段，以便前端统一卡片渲染：
- `id`: 唯一标识
- `title`: 标题
- `cover` / `thumbUrl` / `images[0]`: 封面图
- `author`: { `username`, `avatarUrl` } (如果是社区内容)

## 4. 文件上传接口规范

**痛点：**
上传头像或壁纸后，返回结构不固定，有时在 `data.url`，有时在 `url`。

**建议：**
统一上传接口返回结构，并增加服务端校验。

**Endpoint:** `POST /upload`
**Response:**
```json
{
  "code": 200,
  "data": {
    "url": "https://oss.example.com/path/to/file.jpg",
    "filename": "original_name.jpg",
    "size": 102400
  }
}
```
**后端校验建议：**
- 限制文件类型 (image/jpeg, image/png)
- 限制文件大小 (头像 < 2MB, 壁纸 < 10MB)
- 对上传图片进行必要的压缩或生成缩略图

## 5. 用户信息修改 (PUT /auth/me)

**建议：**
- 支持 `nickname` (昵称) 字段修改，作为前台展示名称。
- `username` (用户名) 应设为不可修改，或仅限管理员修改。
- 修改后直接返回最新的 User Object，前端无需再次调用 `/auth/me`。
- 若昵称冲突，返回明确的 `code` (如 409) 和 `message` ("昵称已被使用")。

## 6. 关注/粉丝系统接口

为支持粉丝功能，建议完善以下接口：
- `POST /users/{id}/follow`: 关注
- `DELETE /users/{id}/follow`: 取消关注
- `GET /users/{id}/followers`: 粉丝列表
- `GET /users/{id}/following`: 关注列表
- `GET /users/{id}/stats`: 用户统计信息 (包含 `followerCount`, `followingCount`)
