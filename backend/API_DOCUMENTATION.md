# RumahKas/Pundi API Documentation

## Overview

Complete REST API documentation for RumahKas family financial management application.

## Quick Start

### Access Swagger UI (Interactive Documentation)

Visit the interactive API documentation at:
- **Development**: `http://localhost:5000/api/docs`
- **Production**: `https://rumah-kas-development.up.railway.app/api/docs`

The Swagger UI provides:
- ✅ Complete endpoint list with descriptions
- ✅ Request/response examples
- ✅ Parameter documentation
- ✅ Try-it-out functionality (requires authentication)
- ✅ Schema definitions

### OpenAPI Specification

Raw OpenAPI 3.0 specification available at:
```
/backend/openapi.json
```

## API Structure

### Base URL
```
http://localhost:5000/api
https://rumah-kas-development.up.railway.app/api
```

### Authentication
All protected endpoints require authentication via httpOnly session cookies.

**Public Endpoints:**
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /health` - Health check

**Protected Endpoints:** (All others require valid session)
- Include `credentials: include` in fetch/axios requests
- Session cookie automatically attached by browser

### Response Format

All responses return JSON with consistent structure:

```javascript
// Success (2xx)
{
  "data": { /* response body */ },
  "message": "Success message",
  "timestamp": "2026-09-29T12:00:00Z"
}

// Error (4xx, 5xx)
{
  "error": "Error code",
  "message": "Human-readable error message",
  "timestamp": "2026-09-29T12:00:00Z"
}
```

## API Endpoints by Category

### 1. Authentication (Public)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/logout` | Logout (clear session) |
| GET | `/auth/me` | Get current user info |

**Example - Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "firstName": "Andri"
  }'
```

**Example - Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

---

### 2. Dashboard
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard` | Get dashboard overview |

**Query Parameters:**
- `month` (optional): YYYY-MM format for specific month

**Response includes:**
- `overview` - Balance, income, expense summary
- `wallets` - User's wallets with balances
- `budgets` - Budget data by category
- `goals` - Savings goals progress
- `debtSummary` - Total debt info
- `incomeLocks` - Income lock information

---

### 3. Expenses
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/expenses` | List expenses (with filters) |
| POST | `/expenses` | Create expense |
| PUT | `/expenses/:id` | Update expense |
| DELETE | `/expenses/:id` | Delete expense |

**Query Parameters:**
- `month` - Filter by month (YYYY-MM)
- `category` - Filter by category name
- `scope` - Filter by scope (FAMILY/PERSONAL)

**Create/Update Payload:**
```json
{
  "amount": 150000,
  "category": "Makanan & Minuman",
  "date": "2026-09-24",
  "note": "Makan bersama keluarga",
  "scope": "FAMILY"
}
```

---

### 4. Income
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/income` | List income |
| POST | `/income` | Create income |
| PUT | `/income/:id` | Update income |
| DELETE | `/income/:id` | Delete income |

**Create/Update Payload:**
```json
{
  "amount": 5000000,
  "source": "Gaji",
  "date": "2026-09-24",
  "note": "Gaji bulanan September",
  "scope": "FAMILY"
}
```

---

### 5. Budget
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/budget` | List budgets |
| POST | `/budget` | Create budget |
| PUT | `/budget/:id` | Update budget |
| DELETE | `/budget/:id` | Delete budget |

**Create/Update Payload:**
```json
{
  "category": "Makanan & Minuman",
  "limit": 500000,
  "month": "2026-09"
}
```

---

### 6. Goals
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/goals` | List savings goals |
| POST | `/goals` | Create goal |
| PUT | `/goals/:id` | Update goal |
| DELETE | `/goals/:id` | Delete goal |

**Create/Update Payload:**
```json
{
  "name": "Liburan ke Bali",
  "targetAmount": 10000000,
  "targetDate": "2027-06-30",
  "category": "Liburan"
}
```

---

### 7. Debt
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/debt` | List debts |
| POST | `/debt` | Create debt |
| PUT | `/debt/:id` | Update debt |
| DELETE | `/debt/:id` | Delete debt |

**Create/Update Payload:**
```json
{
  "creditor": "Bank BCA",
  "amount": 5000000,
  "dueDate": "2026-10-24",
  "note": "Cicilan motor"
}
```

---

### 8. Wallets
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/wallets` | List wallets |
| POST | `/wallets` | Create wallet |
| PUT | `/wallets/:id` | Update wallet |
| DELETE | `/wallets/:id` | Delete wallet |

**Create/Update Payload:**
```json
{
  "name": "Dompet Tunai",
  "balance": 500000,
  "icon": "Banknote",
  "type": "CASH"
}
```

---

### 9. Assets
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/assets` | List assets |
| POST | `/assets` | Create asset |
| PUT | `/assets/:id` | Update asset |
| DELETE | `/assets/:id` | Delete asset |

**Create/Update Payload:**
```json
{
  "name": "Mobil Toyota",
  "value": 150000000,
  "type": "VEHICLE",
  "notes": "Toyota Avanza 2015"
}
```

---

### 10. Transfers
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/transfers` | List transfers |
| POST | `/transfers` | Create transfer |
| PUT | `/transfers/:id/approve` | Approve transfer |
| PUT | `/transfers/:id/reject` | Reject transfer |

**Create Payload:**
```json
{
  "fromWalletId": "wallet-1",
  "toWalletId": "wallet-2",
  "amount": 500000,
  "note": "Transfer ke tabungan"
}
```

---

### 11. Reports
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/reports` | Get financial reports |

**Query Parameters:**
- `month` - Specific month (YYYY-MM)
- `type` - Report type (monthly/yearly/category)

---

### 12. Budget Analytics
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/budget-analytics` | Detailed spending analysis |

---

### 13. Allocation
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/allocation` | Monthly budget allocation |

---

### 14. Maintenance
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/maintenance` | List maintenance tasks |
| POST | `/maintenance` | Create task |
| PUT | `/maintenance/:id` | Update task |
| DELETE | `/maintenance/:id` | Delete task |

---

### 15. Journal
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/journal` | List journal entries |
| POST | `/journal` | Create entry |
| PUT | `/journal/:id` | Update entry |
| DELETE | `/journal/:id` | Delete entry |

---

### 16. Links
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/links` | List important links |
| POST | `/links` | Create link |
| PUT | `/links/:id` | Update link |
| DELETE | `/links/:id` | Delete link |

---

### 17. Household
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/household` | List household members |
| POST | `/household` | Add member |
| PUT | `/household/:id` | Update member |
| DELETE | `/household/:id` | Remove member |

---

### 18. Notifications
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/notifications` | List notifications |

---

### 19. Activity Log
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/activity` | Get audit log |

**Query Parameters:**
- `limit` - Items per page (default 20)
- `offset` - Pagination offset

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Server Error - Internal error |

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 10 requests per 15 minutes

---

## Example - Complete Flow

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "Andri"
  }'

# 2. Create expense
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "amount": 75000,
    "category": "Transportasi",
    "date": "2026-09-24",
    "scope": "FAMILY"
  }'

# 3. Get dashboard
curl -X GET "http://localhost:5000/api/dashboard" \
  -b cookies.txt

# 4. Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

---

## JavaScript/Axios Example

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true // Important: include cookies
});

// Register
async function register(email, password, firstName) {
  const res = await api.post('/auth/register', {
    email, password, firstName
  });
  return res.data;
}

// Create expense
async function createExpense(amount, category, date) {
  const res = await api.post('/expenses', {
    amount, category, date, scope: 'FAMILY'
  });
  return res.data;
}

// Get dashboard
async function getDashboard(month) {
  const res = await api.get('/dashboard', {
    params: { month }
  });
  return res.data;
}
```

---

## Useful Links

- 📘 **Swagger UI**: http://localhost:5000/api/docs
- 📄 **OpenAPI Spec**: /backend/openapi.json
- 🚀 **GitHub**: https://github.com/ayieprime-prog/rumah-kas
- 🌐 **Live Demo**: https://rumah-kas-development.up.railway.app

---

## Support

For issues or questions:
1. Check Swagger UI documentation first
2. Review example requests in this document
3. Check server logs for detailed error messages

---

**Last Updated:** September 29, 2026  
**API Version:** 1.0.0
