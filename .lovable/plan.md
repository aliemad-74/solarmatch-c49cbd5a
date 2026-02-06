
# Admin Dashboard - خطة تنفيذ لوحة التحكم الكاملة

## ملخص المشروع
بناء لوحة تحكم Admin كاملة تشمل إدارة المستخدمين والتقارير والعملاء المحتملين (Leads) مع نظام صلاحيات آمن.

---

## الهيكل الحالي

### الجداول الموجودة:
- **app_users**: المستخدمين المسجلين (الاسم، الإيميل، الموبايل، عدد التقارير)
- **report_history**: سجل التقارير المولدة لكل مستخدم
- **leads**: طلبات التواصل من العملاء المحتملين
- **user_roles**: جدول الصلاحيات (فارغ حالياً، مربوط بـ auth.users)

### المشكلة الحالية:
- لا يوجد نظام تسجيل دخول حقيقي (Supabase Auth)
- جدول `user_roles` مربوط بـ `auth.users` لكن التطبيق يستخدم `app_users` فقط
- RLS policies على `leads` تتطلب admin role لكن لا أحد لديه هذا الـ role

---

## الحل المقترح

### نهج مبسط وآمن:
سنبني نظام Admin يعتمد على **Supabase Auth** للـ Admin فقط، مع الحفاظ على نظام التسجيل الحالي للمستخدمين العاديين.

```text
+------------------+     +------------------+
|   Regular Users  |     |   Admin Users    |
+------------------+     +------------------+
| app_users table  |     | auth.users +     |
| (name, email,    |     | user_roles table |
|  phone, etc.)    |     | (role = 'admin') |
+------------------+     +------------------+
        |                        |
        v                        v
  Registration Modal      /admin/login page
  (no auth required)      (Supabase Auth)
```

---

## المكونات المطلوبة

### 1. صفحات جديدة

| الصفحة | المسار | الوظيفة |
|--------|--------|---------|
| Admin Login | `/admin/login` | تسجيل دخول الـ Admin |
| Admin Dashboard | `/admin` | الصفحة الرئيسية للـ Admin |
| Users Management | `/admin/users` | عرض المستخدمين وتعديل الصلاحيات |
| Reports History | `/admin/reports` | عرض كل التقارير المولدة |
| Leads Management | `/admin/leads` | عرض وتعديل حالة الـ Leads |

### 2. المكونات الجديدة

- **AdminAuthContext**: إدارة حالة تسجيل دخول الـ Admin
- **AdminLayout**: Layout موحد لصفحات الـ Admin مع Sidebar
- **AdminProtectedRoute**: حماية صفحات الـ Admin
- **UsersTable**: جدول عرض المستخدمين مع البحث والفلترة
- **ReportsTable**: جدول عرض التقارير
- **LeadsTable**: جدول عرض وتعديل الـ Leads
- **StatsCards**: كروت إحصائيات (إجمالي المستخدمين، التقارير، الـ Leads)

### 3. تعديلات قاعدة البيانات

#### إضافة Admin User:
```sql
-- إنشاء حساب Admin عبر Supabase Auth ثم:
INSERT INTO user_roles (user_id, role) 
VALUES ('<admin-auth-user-id>', 'admin');
```

#### تحديث RLS Policies:
- تأكيد أن الـ Admin يمكنه قراءة كل الجداول
- إضافة policy للـ Admin لتعديل `app_users.report_limit`

---

## تدفق العمل (User Flow)

```text
Admin يفتح /admin/login
       |
       v
  Supabase Auth Login
  (email + password)
       |
       v
  التحقق من user_roles
  (هل لديه role = 'admin'?)
       |
   +---+---+
   |       |
  نعم     لا
   |       |
   v       v
Dashboard  رسالة خطأ
           "ليس لديك صلاحية"
```

---

## التفاصيل التقنية

### 1. Admin Authentication Context

```typescript
// src/contexts/AdminAuthContext.tsx
interface AdminAuthContextType {
  admin: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

- يستخدم Supabase Auth
- يتحقق من وجود role = 'admin' في `user_roles`
- يخزن الـ session تلقائياً

### 2. Admin Layout Component

- Sidebar مع روابط للصفحات
- Header يعرض اسم الـ Admin وزر تسجيل الخروج
- Responsive design (يتحول لـ drawer على الموبايل)
- دعم RTL للعربية

### 3. Dashboard Statistics

```typescript
interface DashboardStats {
  totalUsers: number;
  totalReports: number;
  totalLeads: number;
  newLeadsToday: number;
  usersToday: number;
}
```

### 4. Users Management Features

- عرض جدول المستخدمين (الاسم، الإيميل، الموبايل، التقارير، تاريخ التسجيل)
- البحث بالاسم أو الإيميل
- تعديل `report_limit` للسماح بتقارير إضافية
- عرض تفاصيل المستخدم (التقارير المولدة)

### 5. Leads Management Features

- عرض كل الـ Leads مع التفاصيل
- تغيير الحالة (new, contacted, qualified, closed)
- فلترة حسب الحالة وتاريخ الإضافة
- عرض تفاصيل المشروع (الموقع، حجم النظام، التكلفة)

### 6. Reports History Features

- عرض كل التقارير المولدة
- فلترة حسب التاريخ أو المستخدم
- عرض الموقع وحجم النظام

---

## الملفات الجديدة

```text
src/
├── contexts/
│   └── AdminAuthContext.tsx        # Admin auth state
├── components/admin/
│   ├── AdminLayout.tsx             # Layout with sidebar
│   ├── AdminSidebar.tsx            # Navigation sidebar
│   ├── AdminProtectedRoute.tsx     # Route guard
│   ├── StatsCards.tsx              # Dashboard stats
│   ├── UsersTable.tsx              # Users data table
│   ├── ReportsTable.tsx            # Reports data table
│   └── LeadsTable.tsx              # Leads data table
├── pages/admin/
│   ├── AdminLogin.tsx              # Login page
│   ├── AdminDashboard.tsx          # Main dashboard
│   ├── AdminUsers.tsx              # Users management
│   ├── AdminReports.tsx            # Reports history
│   └── AdminLeads.tsx              # Leads management
└── i18n/
    └── locales/
        ├── en.json                 # + admin translations
        └── ar.json                 # + admin translations
```

---

## الأمان (Security)

### ما سيتم تأمينه:

1. **Server-side validation**: RLS policies تمنع الوصول غير المصرح
2. **Role verification**: التحقق من الـ role باستخدام `has_role()` function
3. **Session management**: Supabase يدير الـ sessions تلقائياً
4. **Protected routes**: React Router يحمي الصفحات client-side

### RLS Policies المطلوبة:

```sql
-- Admin can read all app_users
CREATE POLICY "Admins can view all users"
ON public.app_users FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admin can update app_users (e.g., report_limit)
CREATE POLICY "Admins can update users"
ON public.app_users FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admin can read all report_history
CREATE POLICY "Admins can view all reports"
ON public.report_history FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

---

## خطوات التنفيذ

1. **إضافة RLS policies جديدة للـ Admin**
2. **بناء AdminAuthContext**
3. **بناء صفحة Admin Login**
4. **بناء AdminLayout و Sidebar**
5. **بناء Dashboard مع الإحصائيات**
6. **بناء صفحة إدارة المستخدمين**
7. **بناء صفحة إدارة التقارير**
8. **بناء صفحة إدارة Leads**
9. **إضافة الترجمات (EN + AR)**
10. **إنشاء أول Admin user**

---

## ملاحظة مهمة

بعد التنفيذ، ستحتاج إلى:
1. إنشاء حساب Admin عبر Backend (سأساعدك في ذلك)
2. اختبار تسجيل الدخول والصلاحيات
3. التأكد من عمل كل الصفحات

