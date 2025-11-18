# API Integration Tests

Integration tests สำหรับ API routes ใน eBizCard web application

## โครงสร้าง

```
__tests__/
├── utils/
│   └── api-test-helpers.ts    # Test utilities และ helpers
└── integration/
    └── api/
        ├── contact.test.ts           # Contact API tests
        ├── get-profile.test.ts       # Get Profile API tests
        ├── update-profile.test.ts    # Update Profile API tests
        └── web-settings.test.ts      # Web Settings API tests
```

## Test Utilities

### `api-test-helpers.ts`

Helper functions สำหรับการทดสอบ API routes:

- `createMockRequest()` - สร้าง mock NextRequest สำหรับ testing
- `createMockSupabaseClient()` - สร้าง mock Supabase client
- `getResponseJson()` - แปลง Response เป็น JSON
- `expectJsonResponse()` - ตรวจสอบ status code และแปลงเป็น JSON

## Test Coverage

### Contact API (`/api/contact`)

- ✅ ส่ง contact form สำเร็จ
- ✅ Validation: ตรวจสอบ required fields
- ✅ Validation: ตรวจสอบ email format
- ✅ Error handling: Email service failure
- ✅ Error handling: Missing Resend API key
- ✅ Error handling: Database errors
- ✅ Error handling: Missing contact email setting

### Get Profile API (`/api/get-profile`)

- ✅ ดึง profile สำเร็จพร้อม valid token
- ✅ Error handling: Missing access token
- ✅ Error handling: Invalid token
- ✅ Error handling: Missing profile
- ✅ Error handling: Missing addresses (graceful)
- ✅ Parse addresses จาก profile table

### Update Profile API (`/api/update-profile`)

- ✅ อัปเดต profile สำเร็จ
- ✅ Validation: Missing userId
- ✅ Validation: Missing updates
- ✅ Validation: Payload size limit
- ✅ Exclude avatar_url และ profile_image จาก metadata
- ✅ Error handling: Database errors
- ✅ CORS: OPTIONS preflight request
- ✅ Error handling: Missing service role key

### Web Settings API (`/api/admin/web-settings`)

#### GET
- ✅ ดึง settings สำเร็จ
- ✅ Parse JSON fields (home_slider, features_items)
- ✅ Convert number fields (max_cards_per_user, etc.)
- ✅ Error handling: Database errors
- ✅ Error handling: Invalid JSON (graceful)

#### POST
- ✅ บันทึก settings สำเร็จ (admin)
- ✅ บันทึก settings สำเร็จ (owner)
- ✅ Authentication: Missing authorization header
- ✅ Authentication: Invalid token
- ✅ Authorization: Regular user (403)
- ✅ Validation: Invalid settings data
- ✅ JSON fields handling
- ✅ Error handling: Database upsert errors

## การรัน Tests

```bash
# รัน tests ทั้งหมด
npm test

# รัน tests แบบ watch mode
npm run test:watch

# รัน tests พร้อม coverage report
npm run test:coverage

# รัน tests เฉพาะ API integration tests
npm test -- integration/api
```

## Best Practices

1. **Mocking**: ใช้ mocks สำหรับ external dependencies (Supabase, Resend, etc.)
2. **Isolation**: แต่ละ test ควรเป็นอิสระและไม่ขึ้นกับ test อื่น
3. **Coverage**: ครอบคลุมทั้ง success cases และ error cases
4. **Validation**: ทดสอบ input validation และ error handling
5. **Authentication**: ทดสอบ authentication และ authorization

## การเพิ่ม Tests ใหม่

เมื่อเพิ่ม API route ใหม่:

1. สร้าง test file ใน `__tests__/integration/api/`
2. ใช้ `api-test-helpers.ts` สำหรับ utilities
3. Mock external dependencies (Supabase, etc.)
4. ครอบคลุม:
   - Success cases
   - Validation errors
   - Authentication/Authorization
   - Error handling
5. ตรวจสอบว่า tests ผ่านก่อน commit

## หมายเหตุ

- Tests ใช้ Jest และ Next.js testing utilities
- Mock Supabase client เพื่อหลีกเลี่ยงการเชื่อมต่อ database จริง
- Environment variables ถูก mock ใน `jest.setup.js`
- Tests ไม่ควรขึ้นกับ external services (email, database, etc.)

