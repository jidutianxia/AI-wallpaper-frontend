# AI Wallpaper Project - API Reference & Interface Specification

This document serves as the **Single Source of Truth** for the frontend-backend interface. It reflects the actual implementation requirements for the frontend to function correctly, including Community, User Center, and Interaction features.

## 1. Global Standards

### 1.1 Base URL
All API endpoints should be prefixed with `/api`.
Example: `http://localhost:8080/api/wallpapers`

### 1.2 Response Format (Standard Envelope)
All successful responses (HTTP 200) **MUST** follow this structure:
```json
{
  "code": 200,          // Business status code (200=Success)
  "message": "success", // Description or error message
  "data": { ... }       // Payload (Object or Array)
}
```

### 1.3 Error Handling
- **HTTP 401**: Unauthorized (Token expired/missing). Frontend will redirect to login.
- **HTTP 403**: Forbidden (Insufficient permissions).
- **HTTP 4xx/5xx**: Business or Server Error.
  ```json
  {
    "code": 400,
    "message": "Nickname already exists",
    "data": null
  }
  ```

### 1.4 Authentication
- **Header**: `Authorization: Bearer <token>`
- **Token**: JWT.

---

## 2. Authentication & User Module

### 2.1 Login
- **Endpoint**: `POST /auth/login`
- **Body**: `{ "username": "...", "password": "..." }`
- **Response**:
  ```json
  {
    "token": "eyJ...",
    "user": { "id": 1, "username": "admin", "nickname": "Admin", "avatarUrl": "..." }
  }
  ```

### 2.2 Register
- **Endpoint**: `POST /auth/register`
- **Body**: `{ "username": "...", "password": "...", "email": "..." }`

### 2.3 Get Current User
- **Endpoint**: `GET /auth/me`
- **Response**: `{ "id": 1, "username": "...", "nickname": "...", "avatarUrl": "...", "role": "user" }`

### 2.4 Update Profile
- **Endpoint**: `PUT /auth/me`
- **Body**: `{ "nickname": "New Name", "email": "...", "avatarUrl": "..." }`
- **Note**: `username` should typically be immutable.

### 2.5 User Stats
- **Endpoint**: `GET /user/stats`
- **Description**: Aggregate statistics for the user profile.
- **Response**:
  ```json
  {
    "favorites": 12,      // Count of favorited wallpapers
    "likes": 45,          // Count of liked community posts
    "downloads": 5,
    "receivedLikes": 100, // Likes received on own posts
    "postCount": 10
  }
  ```

### 2.6 User Interactions Lists
- **My Liked Posts**: `GET /community/my/likes?page=1&size=20` (Returns List of Community Posts)
- **Other User's Liked Posts**: `GET /users/{id}/likes?page=1&size=20`
- **My Favorited Wallpapers**: `GET /user/favorites` (Returns List of Wallpapers)
- **My Favorited Posts**: `GET /community/my/favorites` (Returns List of Community Posts)
- **Other User's Favorited Posts**: `GET /users/{id}/favorites`

### 2.7 Debug Users
- **Endpoint**: `GET /auth/debug-users`
- **Default**: Disabled. Backend returns `404` unless `DEBUG_USERS_ENDPOINT_ENABLED=true`.
- **Auth**: Requires `Authorization: Bearer <token>` when explicitly enabled.

---

## 3. Wallpaper Module

### 3.1 Get Wallpapers
- **Endpoint**: `GET /wallpapers`
- **Params**: `page`, `size`, `category`, `sort`
- **Response**:
  ```json
  {
    "items": [
      {
        "id": 1,
        "title": "Landscape",
        "thumbUrl": "...",
        "url": "...",
        "likes": 10,
        "favorites": 5,
        "liked": false,     // Interaction State
        "favorited": false  // Interaction State
      }
    ],
    "total": 100
  }
  ```

### 3.2 Actions
- **Like**: `POST /wallpapers/{id}/like`
- **Favorite**: `POST /wallpapers/{id}/favorite`

---

## 4. Community Module (Forum)

### 4.1 Get Posts
- **Endpoint**: `GET /community/posts`
- **Params**: `page`, `size`, `sort` ('latest', 'popular'), `q` (keyword), `includeCounts` (bool)
- **Response**:
  ```json
  {
    "items": [
      {
        "id": 101,
        "title": "My Setup",
        "content": "...",
        "images": ["url1", "url2"],
        "author": { "id": 5, "username": "...", "avatarUrl": "..." },
        "likes": 20,
        "commentsCount": 5,
        "liked": true,      // Crucial for UI consistency
        "favorited": false
      }
    ],
    "total": 50
  }
  ```

### 4.2 Get Single Post
- **Endpoint**: `GET /community/posts/{id}`
- **Response**: Detailed Post Object (same fields as item above).

### 4.3 Create Post
- **Endpoint**: `POST /community/posts`
- **Body**: `{ "title": "...", "content": "...", "images": ["url1"], "tags": ["..."] }`

### 4.4 Interactions
- **Like**: `POST /community/posts/{id}/like` -> Returns `{ "liked": true, "likes": 21 }`
- **Favorite**: `POST /community/posts/{id}/favorite` -> Returns `{ "favorited": true, "favorites": 8 }`
- **Comment**: `POST /community/posts/{id}/comments` -> Body `{ "content": "..." }`

### 4.5 Get Comments
- **Endpoint**: `GET /community/posts/{id}/comments`
- **Response**: `{ "items": [ { "id": 1, "content": "...", "author": {...}, "createdAt": "..." } ], "total": 10 }`

### 4.6 Post Images
- **List**: `GET /community/posts/{id}/images?page=1&size=20`
- **Detail**: `GET /community/posts/{id}/images/{index}`
- **Download**: `POST /community/posts/{id}/images/{index}/download`
- **List Response**: Uses the standard envelope; paged data is under `data`:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "items": [],
      "total": 0,
      "page": 1,
      "size": 20
    }
  }
  ```

---

## 5. Upload Module

### 5.1 General Upload
- **Endpoint**: `POST /upload`
- **Content-Type**: `multipart/form-data`
- **Param**: `file`
- **Response**:
  ```json
  {
    "url": "https://oss.../file.jpg",
    "filename": "file.jpg",
    "size": 1024
  }
  ```
- **Constraints**: 
  - Avatar: < 2MB, JPG/PNG.
  - Wallpaper/Post Image: < 10MB.

---

## 6. Follow Module (Future)

- **Follow**: `POST /users/{id}/follow`
- **Unfollow**: `DELETE /users/{id}/follow`
- **Followers**: `GET /users/{id}/followers`
