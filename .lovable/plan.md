

## خطة: دمج AI Advisor مع شات بوت تفاعلي

### الفكرة
بدل ما يكون فيه AIAdvisor card في الداشبورد + شات بوت منفصل، نعمل **فقاعة عائمة واحدة** تشتغل كالتالي:
1. لما المستخدم يدوس عليها، يفتح نافذة شات والرسالة الأولى تكون **تحليل الـ AI** (الـ preloadedRecommendation من الـ checkpoint)
2. بعدها المستخدم يقدر يكمل محادثة ويسأل أسئلة عن التقرير والطاقة الشمسية
3. الردود بتظهر كلمة كلمة (streaming)

### الملفات

| ملف | عملية |
|-----|-------|
| `supabase/functions/solar-chat/index.ts` | إنشاء - Edge function للشات مع streaming |
| `src/components/SolarChatBot.tsx` | إنشاء - الفقاعة العائمة + نافذة الشات |
| `src/components/ResultsDashboard.tsx` | تعديل - شيل AIAdvisor card |
| `src/pages/Index.tsx` | تعديل - إضافة SolarChatBot مع تمرير results و preloadedRecommendation |
| `src/i18n/locales/en.json` | تعديل - مفاتيح الشات |
| `src/i18n/locales/ar.json` | تعديل - مفاتيح الشات |

---

### 1. Edge Function: `solar-chat`
- تستخدم Lovable AI Gateway مع **streaming SSE**
- Model: `google/gemini-3-flash-preview`
- System prompt متخصص في الطاقة الشمسية في مصر + بيانات التقرير الحالي كـ context
- بتستقبل `messages` array (تاريخ المحادثة) + `solarContext` (بيانات التقرير)
- Rate limiting + معالجة أخطاء 429/402

### 2. Component: `SolarChatBot.tsx`
- **فقاعة عائمة** (fixed bottom-left/right حسب RTL) - أيقونة Sparkles
- لما تتفتح أول مرة ولو فيه `preloadedRecommendation`:
  - بتحط التحليل كأول رسالة assistant تلقائياً
  - المستخدم يقدر يرد عليها ويسأل أسئلة
- لو مفيش تقرير: شات عادي عن الطاقة الشمسية
- نافذة ~350×450px مع:
  - Header + زرار إغلاق
  - منطقة رسائل مع scroll + markdown
  - أسئلة مقترحة سريعة (3 أزرار)
  - Input + زرار إرسال
- Streaming: token by token rendering

### 3. تعديل ResultsDashboard
- شيل الـ `<AIAdvisor>` card من أسفل الداشبورد (سطر 722-733)

### 4. تعديل Index.tsx
- إضافة `<SolarChatBot>` مع props:
  - `results` - نتائج التقرير
  - `locationName` - اسم الموقع
  - `preloadedRecommendation` - تحليل الـ checkpoint
  - `solarContext` - بيانات التقرير للـ context

---

### التفاصيل التقنية

**الـ Flow:**
```text
المستخدم يدوس الفقاعة
  → لو فيه preloadedRecommendation → تظهر كأول رسالة assistant
  → المستخدم يكتب سؤال → يتبعت مع كل تاريخ المحادثة + solarContext
  → Edge function تبني system prompt بالـ context → streaming response
  → الرد يظهر token by token
```

**System Prompt** بيتضمن بيانات التقرير (حجم النظام، التكلفة، التوفير، الموقع) عشان الـ AI يرد بناءً على البيانات الفعلية.

