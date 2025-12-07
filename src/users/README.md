# Users API Documentation

## API Endpoints

### 1. Xem Profile

#### GET `/users/:id/profile`
Xem profile của một user (public hoặc có viewerId optional)

**Query Parameters:**
- `viewerId` (optional): ID của người đang xem

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "phoneNumber": "+84123456789",
  "bio": "Software developer",
  "avatarUrl": "https://example.com/avatar.jpg",
  "dob": "1990-01-01",
  "gender": 0,
  "isPrivate": false,
  "joinAt": "2024-01-01T00:00:00.000Z",
  "communities": [...],
  "followersCount": 100,
  "followingCount": 50,
  "posts": [...]
}
```

**Error Responses:**
- `404`: Người dùng không tồn tại
- `403`: Hồ sơ ở chế độ riêng tư / Bạn bị chặn

---

#### GET `/users/me/profile`
Xem profile của chính mình (yêu cầu authentication)

**Headers:**
- `Authorization: Bearer <token>`

**Response:** Giống như `/users/:id/profile`

---

### 2. Quản Lý Profile

#### PATCH `/users/me/profile`
Cập nhật thông tin profile

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "username": "new_username",
  "bio": "New bio",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "phoneNumber": "+84987654321",
  "dob": "1990-01-01",
  "gender": 0
}
```

**Response:** Profile đã cập nhật (giống format GET profile)

**Error Responses:**
- `400`: Username đã được sử dụng
- `404`: Người dùng không tồn tại

---

### 3. Đổi Mật Khẩu

#### POST `/users/me/change-password`
Đổi mật khẩu (yêu cầu mật khẩu cũ)

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "NewPass123",
  "confirmPassword": "NewPass123"
}
```

**Validation:**
- Mật khẩu mới phải có ít nhất 8 ký tự
- Phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số

**Response:**
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

**Error Responses:**
- `400`: Mật khẩu mới và xác nhận không khớp
- `401`: Mật khẩu cũ không đúng

---

### 4. Đổi Email

#### POST `/users/me/change-email`
Yêu cầu đổi email (gửi mã xác thực)

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "newEmail": "newemail@example.com"
}
```

**Response:**
```json
{
  "message": "Mã xác thực đã được gửi đến newemail@example.com. Vui lòng kiểm tra email."
}
```

**Error Responses:**
- `400`: Email đã được sử dụng

---

#### POST `/users/me/verify-email`
Xác thực và cập nhật email mới

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "newEmail": "newemail@example.com",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "message": "Email đã được cập nhật thành công"
}
```

**Error Responses:**
- `400`: Mã xác thực không đúng / đã hết hạn
- `404`: Người dùng không tồn tại

---

### 5. Quyền Riêng Tư

#### PATCH `/users/me/privacy`
Chuyển đổi chế độ riêng tư (public <-> private)

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "isPrivate": true,
  "message": "Hồ sơ của bạn đã được chuyển sang chế độ riêng tư"
}
```

---

### 6. Chặn Người Dùng

#### POST `/users/:id/block`
Chặn một người dùng

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Đã chặn người dùng thành công"
}
```

**Error Responses:**
- `400`: Bạn không thể chặn chính mình / Đã chặn rồi
- `404`: Người dùng không tồn tại

---

#### DELETE `/users/:id/block`
Bỏ chặn một người dùng

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Đã bỏ chặn người dùng thành công"
}
```

**Error Responses:**
- `400`: Bạn chưa chặn người dùng này
- `404`: Người dùng không tồn tại

---

#### GET `/users/me/blocked`
Lấy danh sách người dùng đã chặn

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 5,
    "username": "blocked_user",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
]
```

---

### 7. Xóa Tài Khoản

#### DELETE `/users/me/account`
Xóa tài khoản (soft delete)

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Tài khoản đã được xóa thành công"
}
```

---

## TODO

- [ ] Tích hợp JWT Authentication Guard
- [ ] Implement email service (NodeMailer/SendGrid) cho verification codes
- [ ] Thêm endpoints lấy followers/following list
- [ ] Filter blog posts theo public/private khi xem profile
- [ ] Implement file upload cho avatar
- [ ] Thêm rate limiting cho các endpoints nhạy cảm
- [ ] Thêm soft delete timestamp cho User entity
- [ ] Implement pagination cho posts, followers, following

## Testing

Sử dụng Postman hoặc curl để test các endpoints:

```bash
# Xem profile công khai
curl http://localhost:3000/users/1/profile

# Cập nhật profile (cần token)
curl -X PATCH http://localhost:3000/users/me/profile \
  -H "Content-Type: application/json" \
  -d '{"username": "new_name", "bio": "New bio"}'

# Đổi mật khẩu
curl -X POST http://localhost:3000/users/me/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPass123",
    "newPassword": "NewPass123",
    "confirmPassword": "NewPass123"
  }'
```
