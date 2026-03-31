

## خطة: هوية بصرية كاملة - Corporate/Enterprise لـ SolarMatch

### الوضع الحالي
- اللوجو حالياً: أيقونة Sun من Lucide في مربع gradient - شكل جنيريك جداً
- الخطوط: Inter فقط - مفيش تمييز
- الألوان: teal/green gradient - لطيف بس مش مميز
- الكاردات والعناصر: شكل Shadcn الافتراضي

---

### 1. لوجو SVG مخصوص (Component جديد)
إنشاء `SolarMatchLogo.tsx` - لوجو هندسي من ألواح شمسية مرتبة بشكل hexagonal/geometric مع شعاع شمس مدمج. يكون:
- SVG مرسوم بالكود (مش أيقونة جاهزة)
- يدعم light/dark mode
- حجمين: كامل (مع النص) ومصغر (أيقونة فقط)
- يُستخدم في Header + Footer + favicon

### 2. لوجو AI-Generated للـ Favicon و OG Image
استخدام `google/gemini-3-pro-image-preview` لتوليد:
- Favicon (لوجو مربع 512x512)
- OG Image للسوشيال ميديا (1200x630)

### 3. نظام خطوط جديد
- **Heading**: خط مميز زي `Plus Jakarta Sans` أو `Outfit` - أقوى وأكثر شخصية من Inter
- **Body**: `Inter` يفضل للقراءة
- **Arabic**: `IBM Plex Sans Arabic` أو `Noto Sans Arabic` - أنظف من الـ system font

### 4. تحديث نظام الألوان - Corporate Solar
تحويل من teal/green لباليت أكثر رسمية:
- **Primary**: Deep Navy Blue (`#0F2B46`) - ثقة واحترافية
- **Accent**: Solar Amber/Gold (`#E8A838`) - طاقة وتفاؤل  
- **Success**: Emerald (`#10B981`) - نتائج إيجابية
- تدرجات أرقى بدل الـ gradient الحالي

### 5. تحسين العناصر البصرية
- **Header**: لوجو جديد + تباعد أفضل + hover effects أنعم
- **Cards**: borders أخف + shadows أدق + hover transitions
- **Buttons**: أشكال أكثر رسمية (أقل rounded)
- **Hero section**: خلفية هندسية خفيفة بدل الـ gradient البسيط
- **Footer**: تصميم أنظف يليق بشركة طاقة

### 6. تحديث index.html
- Favicon جديد
- OG Image جديدة

---

### الملفات

| ملف | عملية |
|-----|-------|
| `src/components/SolarMatchLogo.tsx` | **إنشاء** - لوجو SVG مخصوص |
| `src/index.css` | **تعديل** - ألوان + خطوط + متغيرات جديدة |
| `tailwind.config.ts` | **تعديل** - خطوط + ألوان جديدة |
| `src/components/Header.tsx` | **تعديل** - اللوجو الجديد |
| `src/components/Footer.tsx` | **تعديل** - اللوجو الجديد + تصميم أنظف |
| `index.html` | **تعديل** - خطوط Google + favicon |
| `src/pages/About.tsx` | **تعديل** - تطبيق الهوية الجديدة |
| `src/pages/HowItWorks.tsx` | **تعديل** - تطبيق الهوية الجديدة |

### النتيجة المتوقعة
الموقع هيبان كأنه منتج **شركة طاقة محترفة** مش template جاهز - هوية بصرية موحدة من اللوجو للألوان للخطوط.

