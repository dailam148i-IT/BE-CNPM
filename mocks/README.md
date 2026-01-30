# Mock Data cho Testing API

Thư mục này chứa mock data cho từng API endpoint với các test cases:
- ✅ Success cases
- ❌ Error cases  
- 🔒 Authorization cases

## Cấu trúc

```
mocks/
├── auth/           # Authentication APIs
├── users/          # User management APIs
├── categories/     # Category APIs
├── products/       # Product APIs  
├── cart/           # Shopping cart APIs
├── orders/         # Order APIs
├── reviews/        # Review APIs
├── news/           # News/Blog APIs
└── uploads/        # File upload APIs
```

## Sử dụng

```javascript
import { registerSuccess, registerDuplicateEmail } from './mocks/auth/register.js';

// Test với mock data
const response = await request(app)
  .post('/api/auth/register')
  .send(registerSuccess.request);

expect(response.body).toMatchObject(registerSuccess.response);
```
