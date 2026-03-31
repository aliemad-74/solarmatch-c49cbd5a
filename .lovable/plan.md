

## خطة: استبدال AI Advisor بشات بوت تفاعلي كامل

### الفكرة
شيل كارت النصيحة الكتابية (`AIAdvisor`) واستبدلها بفقاعة شات عائمة. لما المستخدم يفتحها، أول رسالة تكون تحليل الـ AI اللي جاي من الـ checkpoint (`aiReviewText`). بعدها يقدر يسأل أي سؤال ويكمل محادثة حقيقية مع streaming.

---

### الملفات والتغييرات

| ملف | عملية |
|-----|-------|
| `supabase/functions/solar-chat/index.ts` | **إنشاء** - Edge function جديدة للشات مع streaming SSE |
| `src/components/SolarChatBot.tsx` | **إنشاء** - الفقاعة العائمة + نافذة الشات |
| `src/components/ResultsDashboard.tsx` | **تعديل** - حذف AIAdvisor (سطور 722-733) |
| `src/pages/Index.tsx` | **تعديل** - إضافة SolarChatBot وتمرير البيانات |
| `src/i18n/locales/en.json` | **تعديل** - مفاتيح ترجمة الشات |
| `src/i18n/locales/ar.json` | **تعديل** - مفاتيح ترجمة الشات |

---

### 1. Edge Function: `solar-chat`

- **Model**: `google/gemini-3-flash-preview` عبر Lovable AI Gateway مع streaming
- **Input**: `{ messages: [{role, content}], solarContext?: {...} }`
- `solarContext` يحتوي بيانات التقرير (حجم النظام، التكلفة، التوفير، الموقع، فترة الاسترداد)
- **System Prompt**: خبير طاقة شمسية في مصر، لو فيه `solarContext` يجاوب بناءً على بيانات التقرير الفعلية
- **Output**: SSE stream يتمرر مباشرة للفرونت
- Rate limiting (15 req/min) + معالجة 429/402

### 2. Component: `SolarChatBot.tsx`

- **فقاعة عائمة** (fixed، أسفل يسار LTR / أسفل يمين RTL) - أيقونة `Sparkles`
- **نافذة شات** ~360×460px تظهر فوق الفقاعة:
  - Header بعنوان "Solar AI Chat" + زرار إغلاق
  - منطقة رسائل مع `ScrollArea` + `ReactMarkdown`
  - 3 أسئلة مقترحة سريعة (أزرار صغيرة)
  - Input + زرار إرسال
- **أول فتحة**: لو فيه `preloadedRecommendation` → تتحط كأول رسالة assistant تلقائياً
- **Streaming**: token-by-token rendering باستخدام SSE parsing
- **RTL/LTR**: تلقائي حسب اللغة

### 3. حذف AIAdvisor من ResultsDashboard

- شيل import الـ `AIAdvisor` (سطر 9)
- شيل الـ JSX بتاعه (سطور 722-733)
- الملف `AIAdvisor.tsx` يفضل موجود مؤقتاً (مش هنمسحه عشان مفيش مشكلة)

### 4. تعديل Index.tsx

- إضافة `<SolarChatBot>` بعد `<Footer>` بالـ props:
  - `results` - نتائج التقرير
  - `locationName` - اسم الموقع
  - `preloadedRecommendation` - الـ `aiReviewText` من الـ checkpoint

### 5. الترجمة

مفاتيح جديدة:
- `chat.title` / `chat.placeholder` / `chat.send`
- `chat.suggested1-3` (أسئلة مقترحة)
- `chat.error` / `chat.rateLimit`

---

### Flow

```text
المستخدم يحسب تقرير → checkpoint يرجع aiReviewText
  ↓
يدوس الفقاعة العائمة → الشات يفتح
  ↓
أول رسالة = aiReviewText (التحليل الجاهز)
  ↓
يكتب سؤال → يتبعت messages + solarContext للـ edge function
  ↓
streaming response → يظهر token by token
  ↓
يقدر يكمل محادثة بأي عدد رسائل
```

