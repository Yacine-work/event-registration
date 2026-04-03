# 🚀 دليل النشر الكامل — موقع تسجيل الفعاليات

## ما الذي ستحتاجه؟
- حساب GitHub (مجاني)
- حساب Vercel (مجاني)
- حساب Resend (مجاني — 3000 إيميل/شهر)
- حساب Supabase (مجاني)

---

## الخطوة 1: إعداد Supabase (قاعدة البيانات)

1. اذهب إلى https://supabase.com وسجّل مجاناً
2. أنشئ مشروعاً جديداً واحفظ كلمة المرور
3. اذهب إلى **SQL Editor** والصق هذا الكود:

```sql
create table registrations (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null unique,
  code text not null,
  created_at timestamp default now()
);
```

4. من **Project Settings → API**، احفظ:
   - `Project URL` → هذا هو SUPABASE_URL
   - `service_role` key (ليس anon) → هذا هو SUPABASE_SERVICE_KEY

---

## الخطوة 2: إعداد Resend (إرسال الإيميلات)

1. اذهب إلى https://resend.com وسجّل مجاناً
2. من **API Keys** → **Create API Key** → احفظ المفتاح
3. (اختياري لكن مهم): أضف دومينك في **Domains** لتجنب الوقوع في Spam

> ⚠️ بدون دومين، يمكنك الإرسال فقط إلى إيميلك الشخصي في الـ free plan.
> لإرسال لأي شخص، أضف دومينك (مجاني على Resend).

4. في ملف `api/register.js`، غيّر هذا السطر:
```js
from: 'الفعالية السنوية <noreply@yourdomain.com>'
```
إلى دومينك الحقيقي أو استخدم:
```js
from: 'الفعالية السنوية <onboarding@resend.dev>'
```
(هذا يعمل للاختبار فقط)

---

## الخطوة 3: رفع المشروع على GitHub

1. اذهب إلى https://github.com → **New Repository**
2. اسمه مثلاً: `event-registration`
3. افتح Terminal وشغّل:

```bash
cd my-event
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/USERNAME/event-registration.git
git push -u origin main
```

---

## الخطوة 4: النشر على Vercel

1. اذهب إلى https://vercel.com → **Add New Project**
2. اختر مستودع GitHub الذي أنشأته
3. من **Environment Variables**، أضف هذه المتغيرات:

| الاسم | القيمة |
|-------|--------|
| `RESEND_API_KEY` | مفتاحك من Resend |
| `SUPABASE_URL` | رابط مشروعك من Supabase |
| `SUPABASE_SERVICE_KEY` | مفتاح service_role من Supabase |

4. اضغط **Deploy** 🎉

---

## الخطوة 5: تجربة الموقع

- سيعطيك Vercel رابطاً مثل: `https://event-registration-xxx.vercel.app`
- افتح الرابط وجرّب التسجيل
- تحقق من Supabase → Table Editor → registrations لترى التسجيلات
- تحقق من بريدك الإلكتروني للرمز

---

## مشاكل شائعة وحلولها

| المشكلة | الحل |
|---------|------|
| الإيميل لا يصل | تأكد من إضافة الدومين في Resend |
| خطأ 500 | تحقق من Vercel Logs → Functions |
| خطأ قاعدة البيانات | تأكد من SUPABASE_SERVICE_KEY (ليس anon key) |
| "مسجّل مسبقاً" | الإيميل موجود بالفعل في قاعدة البيانات |

---

## عرض التسجيلات (لوحة الإدارة)

اذهب إلى Supabase → Table Editor → registrations
ستجد كل المسجّلين مع رموزهم وتاريخ التسجيل.

يمكنك تصديرها CSV من زر Export في الأعلى.
