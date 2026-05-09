## الوضع الحالي

عندنا 4 مجموعات من الـslugs:

| المصدر | عدد | الحالة الحالية |
|---|---|---|
| `BLOG_POSTS` (مدوّنة) | **6** مقالات فعلية | محتوى كامل (intro + 4 sections + FAQs) ✅ |
| `GOVERNORATES` | **27** محافظة | صفحات مولّدة من template في `generator.tsx` (intro + 3-4 sections + FAQs + روابط) ✅ |
| `PROPERTY_TYPES` | ~6 | نفس النظام (template) ✅ |
| `BILLS / GUIDES / COMPARISONS / FINANCING / ROI` | ~30 | نفس النظام (template) ✅ |

**يعني تقنياً مفيش لينك «فاضي»** — كل الـslugs بتفتح صفحة فيها محتوى. لكن الفرق إن:
- **6 مقالات المدوّنة** = محتوى مكتوب يدوياً، طويل ومتعمّق.
- باقي الـ60+ صفحة = محتوى مولّد من template + أرقام محسوبة (إشعاع، توفير، استرداد) + FAQs بسيطة.

طب لو قصدك إن الـtemplate ده مش كافي وعايز كل صفحة تبقى زي مقال المدوّنة (محتوى يدوي عميق) — ده شغل ضخم جداً. خلّيني أقترح خطة عملية على دفعات:

## الخطة المقترحة

### المرحلة 1 — توسيع المدوّنة (الأهم لـSEO)
أضيف **6 مقالات جديدة** كاملة المحتوى لتغطية الـclusters الناقصة:
1. `egypt-solar-tariff-2026-explained` (regulation/finance)
2. `solar-batteries-egypt-buyer-guide` (technology)
3. `solar-for-commercial-buildings-egypt` (market)
4. `khamaseen-dust-management-guide` (technology)
5. `egyptera-licensing-step-by-step` (regulation)
6. `solar-pumping-irrigation-egypt` (market)

كل مقال: intro + 4-5 sections + 4 FAQs بالعربي والإنجليزي.

### المرحلة 2 — تعميق صفحات المحافظات
أحوّل template الـ27 محافظة ليبقى أعمق (يضيف للمحتوى الحالي):
- قسم «أفضل المدن للتركيب» (مأخوذ من `cities[]`)
- قسم «الإطار التنظيمي المحلي»
- قسم «حالات حقيقية / أمثلة»
- 2 FAQs إضافية لكل محافظة

ده تعديل في `buildGovernoratePage` فيطبّق على الـ27 دفعة واحدة.

### المرحلة 3 — تعميق Comparisons + Guides
نفس الفكرة في `buildComparisonPage` و `buildGuidePage` — أضيف جدول مقارنة + خلاصة + FAQs أكثر، فيطبّق على كل المقالات تلقائياً.

### المرحلة 4 — صفحات الفواتير والتمويل والـROI
أعمّق template الفاتورة (يضيف breakdown شهري + سيناريوهات Economy/Standard/Premium) و template التمويل (مثال قسط فعلي).

## التفاصيل التقنية

- المرحلة 1 → تعديل `src/seo/data/blog.ts` فقط (يستفيد من باقي البنية تلقائياً، يدخل sitemap لما `scripts/generate-sitemaps.mjs` يشتغل).
- المرحلة 2-4 → تعديلات في `src/seo/generator.tsx` (تأثيرها يتضاعف على عشرات الصفحات).
- مفيش تأثير على الـcalculations أو الـbackend. كله frontend SEO content.

## السؤال

عايزني أبدأ بأي مرحلة الأول؟ توصيتي **المرحلة 1** (مقالات المدوّنة الجديدة) لأنها بتدّيك أعمق أثر SEO وأسرع، وأكتر حاجة بيقرأها اليوزر فعلاً. بعدها نمشي للـ2 والـ3.

لو وافقت أبدأ المرحلة 1 على طول.