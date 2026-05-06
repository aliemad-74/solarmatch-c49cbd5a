## الفكرة

لما المستخدم يرسم سطحه على الخريطة، ناخد صورة قمر صناعي عالية الدقة للمنطقة دي بالظبط، ونبعتها لـ **Gemini 2.5 Pro Vision** عشان يحللها هندسياً ويرجع:
- نسبة المساحة الصالحة فعلياً للألواح (بعد خصم العوائق)
- قائمة العوائق المكتشفة (خزانات، دشات، مكيفات، غرف)
- تقييم مستوى التظليل من المباني المجاورة
- اتجاه السطح التقريبي
- تحذيرات هندسية لو فيه مشاكل

النتيجة بتطبق على الحسابات وبتظهر للمستخدم في كارد جديد بالـ Results Dashboard.

---

## الملفات الجديدة

### 1. `supabase/functions/satellite-vision/index.ts` (Edge Function جديدة)
- بتاخد: `{ lat, lng, polygonPoints[], zoom?, language? }`
- بتبني URL لـ Google Static Maps API (بصورة Satellite، zoom 20، 640x640)
- بترسم الـ polygon فوق الصورة بـ `path=color:red|fillcolor:0xFF000033|...`
- بتحمّل الصورة وتحوّلها لـ base64
- بتبعتها لـ Lovable AI Gateway مع `google/gemini-2.5-pro` (multimodal)
- بـ tool calling للحصول على JSON منظم: `{ usableAreaRatio, obstacles[], shadingLevel, orientation, warnings[], confidence }`
- Cache 24h بنفس نمط الـ functions الباقية
- Disclaimer: مفيش تخزين للصور، بس النتائج

### 2. `src/components/SatelliteVisionCard.tsx` (UI Component جديد)
- يعرض نتيجة التحليل: نسبة الاستخدام، قائمة العوائق، مستوى التظليل
- Loading skeleton أثناء التحليل
- يدعم العربية والإنجليزية

---

## الملفات اللي هتتعدّل

### 3. `supabase/functions/solar-engine/index.ts`
- ياخد `polygonPoints` من الـ request body
- يستدعي `satellite-vision` بالتوازي مع باقي الـ APIs
- يطبّق `usableAreaRatio` على حساب `system_size_kw` (مثلاً: لو الـ ratio = 0.75، الإنتاج المتوقع ينخفض 25%)
- يضيف `vision_analysis` للـ response

### 4. `supabase/functions/solar-advisor/index.ts`
- يستقبل `visionAnalysis` ضمن الـ context
- الـ AI prompt يستخدم العوائق المكتشفة في توصياته (مثلاً: "بسبب وجود خزان مياه في الركن الشمالي، نوصي بـ...")

### 5. `src/pages/Index.tsx`
- يبعت `polygonPoints` للـ `solar-engine` مع باقي البيانات
- يمرّر `vision_analysis` للـ `ResultsDashboard`

### 6. `src/components/ResultsDashboard.tsx`
- يضيف `<SatelliteVisionCard />` في القسم البيئي/الهندسي
- Conditional rendering لو الـ analysis متاح

### 7. Database Migration
- إضافة عمودين لـ `solar_assessments`:
  - `vision_usable_area_ratio NUMERIC` (0.0 - 1.0)
  - `vision_obstacles_count INTEGER`

---

## الـ AI Prompt (مسودة)

```
أنت مهندس طاقة شمسية بتحلل صورة قمر صناعي لسطح مبنى.
المنطقة المحددة بالأحمر هي السطح اللي المستخدم رسمه.
حلّل الصورة وارجع JSON بالحقول التالية:
- usableAreaRatio: نسبة من 0 إلى 1 (المساحة الصالحة فعلياً للألواح بعد خصم العوائق)
- obstacles: قائمة بالعوائق المرئية (water_tank, satellite_dish, ac_unit, stairs_room, ...)
- shadingLevel: low | medium | high (من المباني المجاورة)
- orientation: north | south | east | west | mixed
- warnings: تحذيرات هندسية (سطح مائل بشدة، مساحة صغيرة جداً، إلخ)
- confidence: low | medium | high (مدى وضوح الصورة)
```

---

## التأثير الفعلي

**مثال:** سطح 100م² فيه خزان مياه ومدخنة:
- قبل: حساب 100م² كاملة → نظام 15kW
- بعد: vision يكشف 20% عوائق → 80م² صالحة → نظام 12kW (أصدق)
- المستخدم يشوف: "الـ AI اكتشف خزان مياه ومدخنة على سطحك. المساحة الفعلية الصالحة: 80م²"

---

## ملاحظات تقنية

- الـ Static Maps API مفعّل بالفعل (`GOOGLE_MAPS_API_KEY` موجود)
- Gemini Pro multimodal موجود في Lovable AI Gateway (مفيش API key جديد)
- Cache 24h بـ in-memory Map زي الـ functions الباقية
- Fallback: لو التحليل فشل، بنرجع للحساب العادي (مفيش breaking)
- التكلفة: ~$0.001 لكل تحليل (Gemini Pro)
