
# خطة حفظ طلبات العملاء في قاعدة البيانات

## الهدف
حفظ جميع طلبات التواصل من نموذج "تواصل مع خبير" في قاعدة بيانات حتى تتمكن من متابعتها.

---

## المرحلة 1: إنشاء جدول قاعدة البيانات

### جدول `leads`
| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | معرف فريد (تلقائي) |
| name | TEXT | اسم العميل |
| phone | TEXT | رقم الهاتف |
| email | TEXT | البريد الإلكتروني |
| preferred_contact | TEXT | طريقة التواصل (call/whatsapp/email) |
| best_time | TEXT | أفضل وقت للاتصال |
| location_name | TEXT | اسم الموقع |
| rooftop_area | NUMERIC | مساحة السطح |
| kw_installed | NUMERIC | القدرة المركبة (kW) |
| estimated_cost | NUMERIC | التكلفة المتوقعة |
| estimated_savings | NUMERIC | التوفير السنوي المتوقع |
| status | TEXT | حالة الطلب (new/contacted/converted) |
| created_at | TIMESTAMP | تاريخ الإنشاء |

### سياسة الأمان (RLS)
- السماح بالإدراج للجميع (INSERT) - لأن العملاء غير مسجلين
- منع القراءة من الواجهة (SELECT) - للحماية

---

## المرحلة 2: تحديث نموذج التواصل

### التغييرات في `ContactExpertDialog.tsx`
1. استبدال `console.log` بإرسال البيانات لـ Supabase
2. إضافة حقل `status: 'new'` تلقائياً
3. معالجة الأخطاء بشكل صحيح

```text
الكود الحالي:
console.log("Lead captured:", leadData);
await new Promise(resolve => setTimeout(resolve, 1000));

الكود الجديد:
const { error } = await supabase
  .from('leads')
  .insert([leadData]);
```

---

## المرحلة 3: عرض الطلبات

### طريقة 1: من لوحة Cloud
- يمكنك فتح Cloud من الإعدادات
- الذهاب إلى Database → Tables → leads
- رؤية جميع الطلبات وتصديرها كـ CSV

### طريقة 2: صفحة إدارة (اختياري - مستقبلاً)
- إنشاء صفحة `/admin/leads` محمية
- عرض الطلبات في جدول
- تحديث حالة كل طلب

---

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| (قاعدة البيانات) | إنشاء جدول `leads` مع RLS |
| `src/components/ContactExpertDialog.tsx` | إرسال البيانات لـ Supabase |

---

## النتيجة النهائية

بعد التنفيذ:
- كل طلب يُحفظ تلقائياً في قاعدة البيانات
- يمكنك رؤية جميع الطلبات من لوحة Cloud
- يمكنك تصدير الطلبات كـ CSV للمتابعة
- البيانات محمية ولا يمكن للزوار رؤيتها

