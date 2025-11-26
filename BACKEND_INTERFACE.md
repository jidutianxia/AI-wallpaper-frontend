# AI Wallpaper Project - Backend Interface Documentation

This document outlines the RESTful API requirements for the AI Wallpaper Frontend application. The backend should be implemented using **Spring Boot**.

## 1. Global Standards

### 1.1 Base URL
All API endpoints should be prefixed with `/api`.
Example: `http://localhost:8080/api/wallpapers`

### 1.2 Response Format
All successful responses should follow a standard envelope structure:
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 1.3 Error Handling
Error responses should return appropriate HTTP status codes (4xx, 5xx) and a JSON body:
```json
{
  "code": 400,
  "message": "Invalid parameter description",
  "data": null
}
```

### 1.4 Authentication
- **Mechanism**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Token Expiry**: Recommended 7 days for refresh token, 2 hours for access token (or simple long-lived token for MVP).

---

## 2. Authentication Module

### 2.1 Login
- **Endpoint**: `POST /auth/login`
- **Description**: Authenticate user and return JWT token.
- **Request Body**:
  ```json
  {
    "username": "user123",
    "password": "password123"
  }
  ```
- **Response Data**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": 1,
      "username": "user123",
      "avatar": "https://..."
    }
  }
  ```

### 2.2 Register
- **Endpoint**: `POST /auth/register`
- **Description**: Create a new user account.
- **Request Body**:
  ```json
  {
    "username": "newuser",
    "password": "securepassword",
    "email": "user@example.com" // Optional based on frontend form
  }
  ```
- **Response Data**: User object or Success message.

### 2.3 Get Current User Info
- **Endpoint**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Retrieve details of the currently logged-in user.
- **Response Data**:
  ```json
  {
    "id": 1,
    "username": "user123",
    "avatar": "https://example.com/avatar.jpg",
    "role": "user" // 'user' or 'admin'
  }
  ```

---

## 3. Wallpaper Module

### 3.1 Get Wallpapers (List/Search)
- **Endpoint**: `GET /wallpapers`
- **Description**: Retrieve a paginated list of wallpapers with optional filtering.
- **Query Parameters**:
  - `page`: Page number (default 1)
  - `pageSize`: Items per page (default 20)
  - `keyword`: Search term (optional, for title/tags)
  - `category`: Main category key (e.g., 'type', 'color')
  - `subCategory`: Sub-category label (e.g., 'landscape', 'red')
  - `sort`: Sort order ('latest', 'hot', 'download')
- **Response Data**:
  ```json
  {
    "list": [
      {
        "id": 101,
        "title": "Cyberpunk City",
        "author": "ArtistX",
        "thumb": "https://images.unsplash.com/...", // Thumbnail URL
        "url": "https://images.unsplash.com/...",   // Full HD URL
        "resolution": "4K",
        "width": 3840,
        "height": 2160,
        "previewVideoUrl": null, // Optional, for live wallpapers
        "likes": 120,
        "favorites": 45,
        "views": 1024
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
  ```

### 3.2 Get Wallpaper Detail
- **Endpoint**: `GET /wallpapers/{id}`
- **Description**: Get detailed information for a specific wallpaper.
- **Response Data**: Same object structure as in the list, potentially with more details like `tags`, `createTime`, etc.

### 3.3 Like Wallpaper
- **Endpoint**: `POST /wallpapers/{id}/like`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Toggle like status for a wallpaper.
- **Response Data**: `{ "liked": true, "count": 121 }`

### 3.4 Favorite Wallpaper
- **Endpoint**: `POST /wallpapers/{id}/favorite`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Add/Remove wallpaper from user's favorites.
- **Response Data**: `{ "favorited": true }`

---

## 4. Category Module

### 4.1 Get Category Tree
- **Endpoint**: `GET /categories`
- **Description**: Return the structure for the navigation menu.
- **Response Data**:
  ```json
  [
    {
      "key": "hot",
      "label": "昨日热门",
      "children": ["最新", "推荐的", "昨日热门", "近三天热门", "上周热门", "上月热门", "近半年热门", "去年热榜"]
    },
    {
      "key": "type",
      "label": "壁纸种类",
      "children": ["插画", "二次元", "风景", "极简", "赛博朋克", "像素风", "3D渲染"]
    },
    {
      "key": "class",
      "label": "壁纸分类",
      "children": ["人物", "动物", "植物", "建筑", "美食", "运动", "科技"]
    },
    {
      "key": "ratio",
      "label": "分辨率",
      "children": ["4K", "8K", "1080P", "2K", "超宽屏", "手机竖屏"]
    },
    {
      "key": "color",
      "label": "颜色分类",
      "children": ["红色", "橙色", "黄色", "绿色", "青色", "蓝色", "紫色", "黑白"]
    }
  ]
  ```

---

## 5. File Upload (Admin)

### 5.1 Upload Image
- **Endpoint**: `POST /admin/upload`
- **Headers**: `Content-Type: multipart/form-data`, `Authorization: Bearer <token>`
- **Request Body**: `file` (Binary)
- **Response Data**:
  ```json
  {
    "url": "https://your-storage-service.com/uploads/image-123.jpg",
    "filename": "image-123.jpg"
  }
  ```

## 6. Implementation Notes for Spring Boot

- **Entity Classes**:
  - `User`: id, username, password (hashed), email, avatar, role.
  - `Wallpaper`: id, title, description, url, thumbUrl, resolution, width, height, views, likes, favorites, uploaderId.
  - `Category`: (Optional, can be hardcoded or DB-driven) key, label, parentKey.
  - `UserLike`: userId, wallpaperId.
  - `UserFavorite`: userId, wallpaperId.

- **Recommended Tech Stack**:
  - Spring Boot 3.x
  - Spring Security + JWT
  - MyBatis Plus or Spring Data JPA
  - MySQL / PostgreSQL
  - Redis (for caching hot wallpapers/categories)
  - MinIO / AWS S3 (for file storage)

