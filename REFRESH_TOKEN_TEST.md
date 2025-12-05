# Hướng dẫn Test Refresh Token Flow

## Backend đã implement:

### Endpoints
- ✅ `POST /auth/login` - Set HttpOnly cookie `refreshToken`
- ✅ `POST /auth/register` - Set HttpOnly cookie `refreshToken`
- ✅ `POST /auth/refresh` - Verify cookie & issue new access token
- ✅ `POST /auth/logout` - Clear cookie & DB hash
- ✅ `GET /auth/me` - Protected endpoint

## Cách test với Thunder Client / Postman:

### 1. Register hoặc Login
```http
POST http://localhost:8080/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response sẽ có:**
- Body: `{ "accessToken": "...", "user": {...} }`
- Cookie: `refreshToken=<long-hex-string>; HttpOnly; Path=/; Max-Age=604800`

**Kiểm tra:**
- ✅ Response có `accessToken`
- ✅ Cookie tab có `refreshToken` (HttpOnly)
- ✅ Database: `users.refreshTokenHash` được set (hashed)

### 2. Call protected endpoint với access token
```http
GET http://localhost:8080/auth/me
Authorization: Bearer <access-token-from-step-1>
```

**Response:** User info (200 OK)

### 3. Test Refresh Token
```http
POST http://localhost:8080/auth/refresh
Cookie: refreshToken=<value-from-step-1>
```

**Important:** Thunder Client/Postman tự động lưu cookie từ response. Bạn chỉ cần:
- Bật "Send cookies" option
- Cookie sẽ tự động attach vào request

**Response:**
```json
{
  "accessToken": "new-jwt-token-here"
}
```

**Kiểm tra:**
- ✅ Response có `accessToken` mới
- ✅ Cookie `refreshToken` được rotate (giá trị mới)
- ✅ Database: `refreshTokenHash` thay đổi (rotation)

### 4. Test Logout
```http
POST http://localhost:8080/auth/logout
Authorization: Bearer <access-token>
Cookie: refreshToken=<current-value>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

**Kiểm tra:**
- ✅ Cookie `refreshToken` bị xóa (Set-Cookie với Max-Age=0)
- ✅ Database: `users.refreshTokenHash` = NULL

### 5. Test refresh sau khi logout (phải fail)
```http
POST http://localhost:8080/auth/refresh
Cookie: refreshToken=<old-deleted-token>
```

**Response:** `401 Unauthorized` - Invalid refresh token

## Cách test trực tiếp với curl (Windows PowerShell):

### Login và lưu cookie
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:8080/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123"}' `
  -SessionVariable session

$response.Content | ConvertFrom-Json
```

### Refresh token (cookie tự động gửi)
```powershell
$refreshResponse = Invoke-WebRequest -Uri "http://localhost:8080/auth/refresh" `
  -Method POST `
  -WebSession $session

$refreshResponse.Content | ConvertFrom-Json
```

### Logout
```powershell
$logoutResponse = Invoke-WebRequest -Uri "http://localhost:8080/auth/logout" `
  -Method POST `
  -WebSession $session `
  -Headers @{"Authorization" = "Bearer <access-token>"}

$logoutResponse.Content | ConvertFrom-Json
```

## Database Schema Check

Verify `refreshTokenHash` column exists:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'refreshTokenHash';
```

Check stored hash after login:

```sql
SELECT id, username, email, refreshTokenHash
FROM users
WHERE email = 'test@example.com';
```

## Security Features Implemented

1. **HttpOnly Cookie** - JavaScript không thể đọc refreshToken
2. **Secure flag** - Cookie chỉ gửi qua HTTPS (production)
3. **SameSite: lax** - Chống CSRF attacks
4. **Token Hashing** - Database lưu hash, không lưu raw token
5. **Token Rotation** - Mỗi refresh = token mới (old token invalid)
6. **Server-side Revocation** - Logout xóa hash → token không dùng được

## Flow Diagram

```
┌─────────┐                                    ┌─────────┐
│ Client  │                                    │ Backend │
└────┬────┘                                    └────┬────┘
     │                                              │
     │ POST /auth/login                             │
     │ {email, password}                            │
     ├─────────────────────────────────────────────>│
     │                                              │
     │                 200 OK                       │
     │      {accessToken, user}                     │
     │  Set-Cookie: refreshToken=<hex>; HttpOnly    │
     │<─────────────────────────────────────────────┤
     │                                              │
     │ [Access token expires after 15 mins]         │
     │                                              │
     │ POST /auth/refresh                           │
     │ Cookie: refreshToken=<hex>                   │
     ├─────────────────────────────────────────────>│
     │                                              │
     │              200 OK                          │
     │       {accessToken: new-token}               │
     │  Set-Cookie: refreshToken=<new-hex>          │
     │<─────────────────────────────────────────────┤
     │                                              │
     │ POST /auth/logout                            │
     │ Authorization: Bearer <token>                │
     │ Cookie: refreshToken=<hex>                   │
     ├─────────────────────────────────────────────>│
     │                                              │
     │              200 OK                          │
     │   {message: "Logout successful"}             │
     │  Set-Cookie: refreshToken=; Max-Age=0        │
     │<─────────────────────────────────────────────┤
     │                                              │
```

## Next Steps (Frontend Integration)

Frontend cần:
1. Set `withCredentials: true` trong axios config
2. On mount: gọi `/auth/refresh` để restore session
3. On 401: tự động gọi refresh và retry request
4. Store access token in memory (React state), không lưu localStorage

Tham khảo: `frontend/REFRESH_TOKEN_INTEGRATION.md` (sẽ tạo sau)
