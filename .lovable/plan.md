

## المشكلة

لما المساحة كبيرة والاستهلاك قليل، السيستم بيبقى أكبر بكتير من المطلوب (coverage ratio 300%+). التوفير السنوي محدود بالاستهلاك الفعلي بس التكلفة محسوبة على السيستم الكامل، فالـ payback بيطلع عالي والموقع بيقول "Not Suitable" -- وده غلط لأن الموقع مناسب جداً، بس السيستم أكبر من اللازم.

## الحل

### 1. تعديل منطق الـ Feasibility (ملفين)

**`solar-engine/index.ts`** و **`ResultsDashboard.tsx`** -- إضافة حالة رابعة: `oversized`

المنطق الجديد:
- لو `coverage_ratio >= 3.0` (300%+) → `oversized` (مناسب بس محتاج تصغير)
- لو `coverage_ratio >= 0.7` و `payback <= 10` → `suitable`
- لو `coverage_ratio >= 0.3` و `payback <= 15` → `conditional`
- غير كده → `not_suitable`

### 2. حساب الحجم المثالي في الـ Engine

لما السيستم oversized، الـ engine هيحسب:
- **recommended_size_kw** = الحجم اللي يغطي 110% من الاستهلاك
- **recommended_area** = المساحة المطلوبة فعلياً
- **recommended_cost** = التكلفة بعد التصغير
- **savings_from_downsizing** = الفرق في التكلفة

### 3. عرض النتيجة في الـ UI

في `ResultsDashboard.tsx`:
- أيقونة خضرا مع علامة تعديل (مش أحمر)
- رسالة: "موقعك ممتاز للطاقة الشمسية! بس السيستم أكبر من اللازم. ممكن تقلل المساحة وتوفر في التكلفة"
- عرض الحجم المقترح والتكلفة الجديدة والتوفير

### الملفات المطلوب تعديلها

1. **`supabase/functions/solar-engine/index.ts`** -- إضافة منطق `oversized` + حساب الحجم المثالي
2. **`src/components/ResultsDashboard.tsx`** -- إضافة حالة `oversized` في الـ UI مع التوصيات
3. **`src/pages/Index.tsx`** -- تحديث الـ type ليشمل `oversized`
4. **`src/i18n/locales/en.json`** + **`ar.json`** -- إضافة ترجمات الحالة الجديدة

