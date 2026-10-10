# دليل النشر (مجاني — Cloudflare Pages)

> **الحالة:** لم يتم نشر أي شيء حتى الآن (لا حساب ولا نطاق مصرّح به). هذا الدليل خطوات للتنفيذ بواسطتك.

## 1) النطاق (قرار حاسم)

الرابط المكتوب على البطاقات **دائم**. اختر نطاقاً تملكه وتضمن تجديده لسنوات (مثلاً `reviews.اسم-شركتك.com`). لا تستخدم نطاقاً مؤقتاً مثل `*.pages.dev` على بطاقات تُباع. يمكنك أثناء الاختبار استخدام `*.pages.dev`، **لكن لا تكتب البطاقات النهائية قبل ربط النطاق الدائم واختباره**.

## 2) إنشاء المشروع

1. ادخل إلى Cloudflare ← *Workers & Pages* ← *Create* ← *Pages* ← *Connect to Git* واختر المستودع.
2. الإعدادات:
   - Production branch: `main` (بعد دمج الفرع بمراجعة).
   - **Root directory:** `review-platform`
   - **Build command:** `npm ci && npm run build`
   - **Build output directory:** `dist`
   - الإصدار: الملف `.node-version` يحدد Node ‏22.18.0 (مطلوب ≥ 22.18 لأن السكربتات تعمل بـ TypeScript مباشرة)
3. لا يوجد أي مفتاح أو سر مطلوب.

## 3) ربط النطاق

*Custom domains* ← أضف النطاق ← اتبع إعداد DNS. HTTPS يُفعَّل تلقائياً. (الرأس `Strict-Transport-Security` موجود في `public/_headers`.)

## 4) التحقق بعد النشر (إلزامي قبل كتابة البطاقات)

```bash
curl -sI https://<النطاق>/r/branch-001 | grep -iE "content-security-policy|x-robots|strict-transport|referrer"
curl -s -o /dev/null -w "%{http_code}\n" https://<النطاق>/r/branch-999     # يجب 404
```
وافتح `/r/branch-001` على Android وiPhone وتأكد أن الزر يفتح نموذج التقييم الصحيح.

## 5) تحديث وجهة بطاقة موجودة

`npm run admin -- set-destination branch-001 <placeId>` ← تحقق (`verify`) ← `git push`. لا حاجة لإعادة كتابة البطاقة.

## 6) الحماية الإدارية

لا توجد لوحة إدارة على الإنترنت. الصلاحية = صلاحية المستودع. فعّل حماية الفرع `main` واشترط مراجعة لأي تعديل في `review-platform/data/`.

## 7) بدائل مجانية

Netlify أو GitHub Pages يعملان أيضاً؛ ملف `_headers` يعمل على Netlify وCloudflare. على GitHub Pages لا تتوفر رؤوس HTTP المخصصة (فتفقد CSP كرأس) — لذا لا نوصي به.

## 8) النشر على Vercel (تم فعلياً كنسخة تجريبية)

- المشروع: `nfc-review` على حساب Vercel — الرابط الحالي: `https://nfc-review-faisalkabs-9775.vercel.app/r/branch-001`
- رُفعت نسخة `dist/` المبنية مسبقاً (نفس الملفات التي اختُبرت)، مع `vercel.json` للرؤوس الأمنية. تم التحقق من الموقع الحي: 200 للفرع، 404 لمعرّف غير موجود، والرؤوس (CSP, HSTS, noindex…) تصل.
- **حماية Vercel Authentication أُطفئت لهذا المشروع**؛ وإلا يُحوَّل الزائر إلى صفحة تسجيل دخول Vercel.
- **تنبيه تجاري:** خطة Vercel المجانية (Hobby) مخصصة للاستخدام الشخصي غير التجاري وفق شروط Vercel. بيع بطاقات للأنشطة التجارية استخدام تجاري، فراجع الشروط الحالية؛ على الأرجح تحتاج خطة Pro (مدفوعة). Cloudflare Pages المجاني يسمح بالاستخدام التجاري.
- ربط دومين: Project ← Settings ← Domains ← Add، ثم أضف سجل DNS الذي تطلبه Vercel عند مسجّل الدومين. **لا تكتب البطاقات قبل اختبار الدومين النهائي.**
- التحديث التلقائي عبر Git يتطلب دمج الفرع في `main` (عبر PR) وربط المستودع بالمشروع وضبط Root Directory=`review-platform`. الملف `review-platform/vercel.json` في المستودع مخصص لذلك (بناء Astro).
