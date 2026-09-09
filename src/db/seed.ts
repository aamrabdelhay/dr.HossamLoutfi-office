// بيانات تشغيل واقعية لمكتب د. حسام لطفي — تشغيل: npx tsx src/db/seed.ts
import "dotenv/config";
import { db } from "./index";
import {
  accessTokens, activityLogs, adminSettings, cases, caseEvents, categories, clients,
  comments, emailReminders, lawyers, locationRelations, locations, notifications,
  reminders, services, taskAssignments, tasks, users,
} from "./schema";
import { dateOffset, distanceBucketOf, todayStr } from "../lib/utils";
import { ALL_SEED_LOCATIONS, CATEGORIES, GENERAL_SERVICES } from "./seed-locations-data";

const daysAgo = (n: number, h = 10) => new Date(Date.now() - n * 86400000 + h * 60000);

const GENERIC_HOURS = "الأحد – الخميس · 9:00 ص – 2:00 م";
const GENERIC_SOURCE = "قاعدة معرفة المكتب — تحتاج مراجعة ميدانية";

// قواعد توليد الاختصاص
function jurisdictionFor(subtype: string, gov: string): string {
  if (["نقض", "دستورية عليا", "إدارية عليا", "مقر قضائي"].includes(subtype)) return "على مستوى الجمهورية";
  if (subtype === "استئناف") return `دائرة محكمة استئناف ${gov}`;
  if (subtype === "قضاء إداري") return "القضاء الإداري — مجلس الدولة";
  return `دائرة محافظة ${gov}`;
}

async function main() {
  console.log("⏳ مسح البيانات القديمة...");
  for (const t of [
    comments, notifications, taskAssignments, activityLogs, caseEvents, emailReminders,
    reminders, accessTokens, tasks, cases, clients, locationRelations, locations,
    services, categories, lawyers, users, adminSettings,
  ]) {
    await db.delete(t);
  }

  // ---------- التصنيفات والخدمات ----------
  console.log("⏳ إدخال 47 تصنيفاً و28 خدمة...");
  const catRows = await db.insert(categories).values(
    CATEGORIES.map(([slug, name, nameEn], i) => ({ slug, name, nameEn, displayOrder: i + 1 })),
  ).returning();
  const catId = new Map(catRows.map((c) => [c.slug, c.id]));
  await db.insert(services).values(GENERAL_SERVICES.map((name, i) => ({ name, displayOrder: i + 1 })));

  // ---------- 146 جهة معتمدة + 3 في طابور التحقق ----------
  console.log("⏳ إدخال قاعدة الجهات (محاكم + حكومية + عدلية)...");
  const locValues = ALL_SEED_LOCATIONS.map((l, i) => ({
    slug: l.slug,
    name: l.name,
    nameEn: l.en,
    type: l.type,
    subtype: l.subtype,
    categoryId: catId.get(l.cat) ?? null,
    governorate: l.gov,
    city: l.city,
    district: l.city,
    address: l.addr,
    phone: null as string | null,
    website: null as string | null,
    mapsUrl: null as string | null,
    lat: l.lat ?? null,
    lng: l.lng ?? null,
    openingHours: GENERIC_HOURS,
    services: l.services,
    jurisdiction: jurisdictionFor(l.subtype, l.gov),
    requiresPresence: l.presence ?? true,
    onlineService: l.online ?? false,
    source: GENERIC_SOURCE,
    lastVerifiedAt: daysAgo(45, 3),
    confidence: (l.lat != null ? "HIGH" : "MEDIUM") as "HIGH" | "MEDIUM",
    distanceKm: l.km,
    distanceBucket: distanceBucketOf(l.km),
    status: "VERIFIED" as const,
    displayOrder: i + 1,
  }));
  const locRows = await db.insert(locations).values(locValues).returning();
  const locId = new Map(locRows.map((r) => [r.slug, r.id]));

  const queueLoc = await db.insert(locations).values([
    {
      slug: "october-primary-court", name: "محكمة 6 أكتوبر الابتدائية", nameEn: "6th of October Primary Court",
      type: "COURT", subtype: "ابتدائية", categoryId: catId.get("courts"), governorate: "الجيزة", city: "6 أكتوبر",
      district: "الحي الأول", address: "المحور المركزي — بجوار جهاز المدينة", openingHours: "غير مؤكد بعد",
      services: ["مدني", "جنح"], jurisdiction: "دائرة محافظة الجيزة", requiresPresence: true,
      source: "زميل خارج المكتب", confidence: "LOW", distanceKm: 24.5, distanceBucket: distanceBucketOf(24.5),
      status: "PENDING", displayOrder: 500, description: "بيانات أولية — تنتظر التحقق الميداني من العنوان والمواعيد.",
    },
    {
      slug: "egyptian-bar-general", name: "النقابة العامة للمحامين", nameEn: "Egyptian Bar Association",
      type: "AGENCY", subtype: "نقابة", categoryId: catId.get("bar"), governorate: "القاهرة", city: "رمسيس",
      district: "رمسيس", address: "٤٩ شارع رمسيس", openingHours: GENERIC_HOURS,
      services: ["تجديد عضوية", "صرف الكارنيه", "دورات التدريب"], jurisdiction: "على مستوى الجمهورية",
      requiresPresence: false, onlineService: true, source: "اتصال هاتفي قديم", confidence: "NEEDS_VERIFICATION",
      distanceKm: 10.2, distanceBucket: distanceBucketOf(10.2), status: "NEEDS_REVIEW", displayOrder: 501,
      description: "رقم الهاتف والمواعيد تحتاج إعادة تأكيد.",
    },
    {
      slug: "october-real-estate-registry", name: "الشهر العقاري بمدينة 6 أكتوبر", nameEn: "October Real Estate Registry",
      type: "AGENCY", subtype: "شهر عقاري", categoryId: catId.get("real-estate"), governorate: "الجيزة", city: "6 أكتوبر",
      district: "الحي الثاني", address: "محور 26 يوليو", jurisdiction: "مدينتا 6 أكتوبر والشيخ زايد",
      requiresPresence: true, confidence: "NEEDS_VERIFICATION", distanceKm: 25, distanceBucket: distanceBucketOf(25),
      status: "DRAFT", displayOrder: 502, description: "مسودة — تُستكمل بعد الزيارة المقبلة.",
    },
  ]).returning();
  console.log(`  ✔ ${locRows.length + queueLoc.length} جهة`);

  // ---------- علاقات بين الجهات ----------
  await db.insert(locationRelations).values([
    { fromId: locId.get("north-giza-economic-court")!, toId: locId.get("north-giza-family-court")!, type: "SAME_BUILDING" },
    { fromId: locId.get("south-giza-economic-court")!, toId: locId.get("south-giza-family-court")!, type: "SAME_BUILDING" },
    { fromId: locId.get("public-prosecutor-office")!, toId: locId.get("supreme-judiciary-house")!, type: "LOCATED_IN" },
    { fromId: locId.get("cairo-appeal-execution-office")!, toId: locId.get("cairo-court-of-appeal")!, type: "LOCATED_IN" },
    { fromId: locId.get("administrative-judiciary-giza")!, toId: locId.get("state-commissioners")!, type: "ASSOCIATED_WITH" },
    { fromId: locId.get("giza-experts-office")!, toId: locId.get("experts-authority-cairo")!, type: "SUBORDINATE_TO" },
    { fromId: queueLoc[0].id, toId: locId.get("north-giza-bar")!, type: "REFERS_TO" },
  ]);

  // ---------- إعدادات المكتب ----------
  await db.insert(adminSettings).values([
    { key: "office_lat", value: "30.038", label: "خط عرض مقر المكتب" },
    { key: "office_lng", value: "31.2", label: "خط طول مقر المكتب" },
    { key: "office_label", value: "الدقي – الجيزة", label: "اسم مقر المكتب" },
    { key: "demo_lock", value: "off", label: "قفل وضع العرض التجريبي" },
  ]);

  // ---------- المحامون ----------
  console.log("⏳ إدخال المحامين...");
  const lw = await db.insert(lawyers).values([
    {
      slug: "hossam-lotfy", firstName: "حسام", lastName: "لطفي", title: "دكتور",
      phone: "0100 234 5871", email: "hossam.lotfy@office.legal", specialty: "القضايا المدنية والتجارية والتحكيم الدولي",
      bio: "مؤسس المكتب. دكتوراه في القانون التجاري، محكم معتمد لدى مركز القاهرة الإقليمي للتحكيم التجاري الدولي، وخبرة تتجاوز ٢٥ عاماً أمام محاكم النقض والاستئناف.",
      jobTitle: "المحامي الرئيسي ومؤسس المكتب", isPrincipal: true, isApproved: true, displayOrder: 1,
      gmailIdentity: "hossam.lotfy@gmail.com",
      statusText: "في جلسة بمحكمة النقض حتى الثانية عشرة", statusUpdatedAt: daysAgo(0, 2),
    },
    {
      slug: "ahmed-abdelaziz", firstName: "أحمد", lastName: "عبد العزيز", title: "محامي",
      phone: "0111 845 2203", email: "ahmed.aziz@office.legal", specialty: "الجنح والقضايا العمالية",
      bio: "محامٍ أول بالمكتب، متخصص في الدفاع في الجنح الاقتصادية ومنازعات العمل منذ ٢٠١٣.",
      jobTitle: "محامٍ أول", isApproved: true, displayOrder: 2, statusText: "متاح للتكليفات", statusUpdatedAt: daysAgo(0, 5),
    },
    {
      slug: "sara-mahmoud", firstName: "سارة", lastName: "محمود", title: "محامي",
      phone: "0102 778 9410", email: "sara.mahmoud@office.legal", specialty: "الأحوال الشخصية والقضايا الأسرية",
      bio: "محامية أولى متخصصة في قضايا الأسرة والحضانة والنفقات، ومقررة لجنة المرأة بنقابة المحامين.",
      jobTitle: "محامية أولى", isApproved: true, displayOrder: 3,
    },
    {
      slug: "mohamed-elshely", firstName: "محمد", lastName: "الشاذلي", title: "محامي",
      phone: "0122 335 6618", email: "m.shely@office.legal", specialty: "القانون المدني والتجاري",
      bio: "متخصص في صياغة ومراجعة العقود التجارية ومنازعات الشركات.",
      jobTitle: "محامٍ أول", isApproved: true, displayOrder: 4, statusText: "في الشهر العقاري حتى الواحدة",
    },
    {
      slug: "mona-khalil", firstName: "منى", lastName: "خليل", title: "محامي",
      phone: "0106 902 4477", email: "mona.khalil@office.legal", specialty: "قانون الشركات والعقود",
      bio: "استشارات تأسيس الشركات وعقود المقاولات والتوريد.",
      jobTitle: "محامية", isApproved: true, displayOrder: 5, statusText: "في إجازة حتى الخميس",
    },
    {
      slug: "karim-fouad", firstName: "كريم", lastName: "فؤاد", title: "محامي",
      phone: "0109 441 8832", email: "karim.fouad@office.legal", specialty: "الجنح والمرور",
      bio: "متابعة الجنح اليومية وتقارير الخبراء.",
      jobTitle: "محامٍ", isApproved: true, displayOrder: 6,
    },
    {
      slug: "nourhan-samy", firstName: "نورهان", lastName: "سامي", title: "محامي",
      phone: "0103 556 2290", email: "nourhan.samy@gmail.com", specialty: "القانون المدني",
      bio: "خريجة حقوق القاهرة ٢٠٢٤.",
      jobTitle: "محامية تحت التمرين", isApproved: false, displayOrder: 40,
    },
    {
      slug: "yasser-adel", firstName: "ياسر", lastName: "عادل", title: "محامي",
      phone: "0112 990 3345", email: "yasser.adel@gmail.com", specialty: "قضايا الإيجارات",
      bio: "كان يتولى ملف الإيجارات حتى نهاية ٢٠٢٤.",
      jobTitle: "محامٍ سابق", isApproved: true, isActive: false, displayOrder: 50,
    },
  ]).returning();
  const [hossam, ahmed, sara, mohamed, mona, karim] = lw;
  console.log(`  ✔ ${lw.length} محامون`);

  // ---------- العملاء ----------
  console.log("⏳ إدخال العملاء...");
  const cl = await db.insert(clients).values([
    { name: "شركة النيل للتطوير العقاري", phone: "0122 700 4456", email: "legal@nile-dev.com", address: "برج النيل — كورنيش المعادي", notes: "عميل شركات منذ ٢٠٢١؛ الفوترة ربع سنوية", responsibleLawyerId: mohamed.id },
    { name: "شركة المتحدة للمقاولات والتوريدات", phone: "0100 882 1190", email: "contracts@united-const.com", address: "الدور ١٢ — برج التجاريين بالمهندسين", notes: "تنبيه: لا مراسلات إلا عبر مدير العقود", responsibleLawyerId: ahmed.id },
    { name: "أ/ محمود سعد الدين", phone: "0111 223 9045", email: "mahmoud.saad@gmail.com", nationalId: "28704150102211", address: "١٥ شارع البطل أحمد عبد العزيز — الدقي", responsibleLawyerId: ahmed.id },
    { name: "أ/ عبد الرحمن حجازي", phone: "0109 664 3012", nationalId: "29011220881734", address: "العجوزة — شارع شامبليون", notes: "يفضل التواصل مساءً", responsibleLawyerId: sara.id },
    { name: "أ/ سامية فهمي", phone: "0102 118 7734", email: "samia.fahmy@yahoo.com", nationalId: "27309261122458", address: "فيصل — شارع الملك", responsibleLawyerId: sara.id },
    { name: "شركة الدلتا للصناعات الغذائية", phone: "02 3584 0011", email: "info@delta-food.eg", address: "المنطقة الصناعية — 6 أكتوبر", responsibleLawyerId: mona.id },
    { name: "مؤسسة الصفا التجارية", phone: "0114 550 2288", address: "وسط البلد — شارع قصر النيل", responsibleLawyerId: karim.id },
    { name: "شركة روافد للتكنولوجيا", phone: "0128 991 6645", email: "legal@rawafed.tech", address: "المعادي التكنولوجية — قطعة 44", notes: "قضية تحكيم نشطة — سرية تامة", responsibleLawyerId: hossam.id },
  ]).returning();
  console.log(`  ✔ ${cl.length} عملاء`);

  // ---------- القضايا ----------
  console.log("⏳ إدخال القضايا...");
  const cs = await db.insert(cases).values([
    { name: "قضية فسخ عقد وتعويض — شركة النيل", caseNumber: "1245/2024 مدني كلي", clientId: cl[0].id, status: "OPEN", description: "فسخ عقد مقاولة التشطيبات مع المطور المنافس والمطالبة بالتعويض عن التأخير." },
    { name: "دعوى عمالية — مستحقات نهاية الخدمة", caseNumber: "823/2023 عمالي", clientId: cl[2].id, status: "OPEN", description: "مطالبة بمكافأة نهاية الخدمة وبدل الإخطار لصالح الأستاذ محمود سعد الدين." },
    { name: "دعوى طلاق للضرر ونفقات", caseNumber: "551/2025 أسرة", clientId: cl[4].id, status: "OPEN", description: "طلاق للضرر مع مطالبة بمؤخر ونفقة عدّة ومتعة." },
    { name: "جنحة شيك بدون رصيد", caseNumber: "9914/2024 جنح مستأنفة", clientId: cl[1].id, status: "OPEN", description: "جنحة شيك مقامة ضد أحد موردي شركة المتحدة للمقاولات." },
    { name: "قضية تحكيم تجاري — منازعة مقاولة", caseNumber: "تحكيم 33/2024", clientId: cl[7].id, status: "OPEN", description: "تحكيم مؤسسي أمام مركز القاهرة — منازعة بنود الأداء والغرامات التعاقدية." },
    { name: "دعوى صحة توقيع", caseNumber: "310/2025 صحة توقيع", clientId: cl[3].id, status: "OPEN", description: "صحة توقيع على عقد بيع ابتدائي لوحدة سكنية بالعجوزة." },
    { name: "دعوى إلغاء قرار إداري", caseNumber: "71234/79 ق.إ", clientId: cl[5].id, status: "OPEN", description: "طعن على قرار الشطب من السجل التجاري أمام القضاء الإداري." },
    { name: "تصحيح شطب سجل تجاري", caseNumber: "88/2025 سجل تجاري", clientId: cl[5].id, status: "CLOSED", description: "تم الحكم لصالح الشركة وقيد السجل من جديد." },
    { name: "دعوى طرد للغير — شقة المعادي", caseNumber: "410/2025 إيجارات", clientId: null, status: "OPEN", description: "قضية إيجار جديدة بانتظار ربطها بملف العميل." },
    { name: "دعوى بطلان عقد بيع سيارة", caseNumber: "77/2025 مدني", clientId: null, status: "OPEN", description: "واردة من استشارة هاتفية — العميل لم يوقّع عقد الوكالة بعد." },
    { name: "قضية تعويض حادث سيارة (قديمة)", caseNumber: "88/2020 تعويضات", clientId: null, status: "ARCHIVED", description: "ملف مؤرشف بعد انقضاء مراحل التقاضي." },
  ]).returning();
  console.log(`  ✔ ${cs.length} قضية`);

  await db.insert(caseEvents).values([
    { caseId: cs[0].id, type: "فتح ملف", description: "فتح الملف واستلام عقد المقاولة والمراسلات من العميل", authorName: "الإدارة", createdAt: daysAgo(65) },
    { caseId: cs[0].id, type: "إجراء", description: "إرسال إنذار قانوني بالفسخ على يد محضر", authorName: "محامي محمد الشاذلي", createdAt: daysAgo(40) },
    { caseId: cs[0].id, type: "جلسة", description: "أولى الجلسات أمام الدائرة ٧ مدني كلي — تأجيلت لسماع دفوع الشكل", authorName: "محامي محمد الشاذلي", createdAt: daysAgo(18) },
    { caseId: cs[1].id, type: "فتح ملف", description: "فتح الملف بعد توقيع اتفاق الأتعاب", authorName: "الإدارة", createdAt: daysAgo(120) },
    { caseId: cs[1].id, type: "جلسة", description: "ندب خبير حسابي لحصر مستحقات نهاية الخدمة", authorName: "محامي أحمد عبد العزيز", createdAt: daysAgo(33) },
    { caseId: cs[3].id, type: "جلسة", description: "جلسة أولى أمام محكمة الجنح المستأنفة — حضر المتهم وتقرر التأجيل", authorName: "محامي أحمد عبد العزيز", createdAt: daysAgo(9) },
    { caseId: cs[4].id, type: "إجراء", description: "إيداع لائحة الدعوى ومذكرة شروح الطرفين لدى أمانة المركز", authorName: "دكتور حسام لطفي", createdAt: daysAgo(22) },
    { caseId: cs[6].id, type: "حكم", description: "صدر الحكم بقبول الدعوى شكلاً وإحالتها لهيئة مفوضي الدولة", authorName: "أمانة الجلسة", createdAt: daysAgo(14) },
    { caseId: cs[7].id, type: "حكم", description: "حكم نهائي لصالح الشركة — تم قفل الملف وإثبات انتهاء المنازعة", authorName: "الإدارة", createdAt: daysAgo(50) },
  ]);

  // ---------- المهام والجلسات ----------
  console.log("⏳ إدخال المهام والجلسات...");
  const L = (slug: string) => locId.get(slug)!;
  type T = typeof tasks.$inferInsert;
  const taskDefs: Array<T & { asg: number[]; comments?: Array<[string, string, number]> }> = [
    { title: "جلسة دعوى التحكيم — سماع شاهد الإثبات", type: "SESSION", status: "COMPLETED", priority: "IMPORTANT", date: dateOffset(-9), time: "10:00", locationId: L("north-giza-district-court"), caseId: cs[4].id, notes: "سمع الشاهد وأُعلن الطرفان", createdByName: "الإدارة", createdAt: daysAgo(12), asg: [hossam.id] },
    { title: "توثيق عقد بيع وحدة الدقي", type: "ENTITY_VISIT", status: "COMPLETED", priority: "NORMAL", date: dateOffset(-6), time: "11:30", locationId: L("dokki-real-estate"), caseId: cs[5].id, notes: "تم التصديق والتسليم", createdByName: "الإدارة", createdAt: daysAgo(8), asg: [mohamed.id] },
    { title: "جلسة دعوى صحة التوقيع", type: "SESSION", status: "COMPLETED", priority: "NORMAL", date: dateOffset(-4), time: "09:30", locationId: L("north-giza-primary-court"), caseId: cs[5].id, createdByName: "الإدارة", createdAt: daysAgo(7), asg: [mohamed.id, karim.id] },
    { title: "استلام تقرير الخبير الحسابي", type: "ENTITY_VISIT", status: "COMPLETED", priority: "IMPORTANT", date: dateOffset(-1), time: "12:00", locationId: L("giza-experts-office"), caseId: cs[1].id, createdByName: "الإدارة", createdAt: daysAgo(3), asg: [ahmed.id] },
    { title: "جلسة جنحة الشيك بدون رصيد — الرول الأول", type: "SESSION", status: "IN_PROGRESS", priority: "CRITICAL", date: dateOffset(0), time: "09:00", locationId: L("north-giza-primary-court"), caseId: cs[3].id, description: "حضور إلزامي مع أصل التوكيل والشيك محل الجنحة", notes: "المحضر: يُرفق كشف حساب بنكي حديث", createdByName: "الإدارة", createdAt: daysAgo(2), asg: [ahmed.id, karim.id],
      comments: [["الإدارة", "تأكدوا من وصول أصل الشيك من أمانة القلم قبل دخول الجلسة", 1]] },
    { title: "حضور مأمورية الشهر العقاري — تقديم طلب اطلاع", type: "ENTITY_VISIT", status: "PENDING", priority: "IMPORTANT", date: dateOffset(0), time: "11:00", locationId: L("dokki-real-estate"), caseId: cs[5].id, notes: "رقم الطلب الجاهز 4471", createdByName: "الإدارة", createdAt: daysAgo(1), asg: [mohamed.id] },
    { title: "اجتماع مع مندوب شركة روافد لمراجعة مذكرة الدفوع", type: "ACTIVITY", status: "PENDING", priority: "IMPORTANT", date: dateOffset(0), time: "13:00", caseId: cs[4].id, notes: "في مقر المكتب — قاعة الاجتماعات", createdByName: "دكتور حسام لطفي", createdAt: daysAgo(1), asg: [hossam.id] },
    { title: "جلسة فسخ العقد والتعويض — الدائرة ٧ مدني كلي", type: "SESSION", status: "PENDING", priority: "CRITICAL", date: dateOffset(1), time: "09:30", locationId: L("south-giza-primary-court"), caseId: cs[0].id, description: "جلسة مرافعة — لائحة الدفوع الأخيرة جاهزة بالملف", notes: "إرفاق صورة الإنذار القانوني", createdByName: "الإدارة", createdAt: daysAgo(1), asg: [mohamed.id, hossam.id],
      comments: [["دكتور حسام لطفي", "سأحضر المرافعة بنفسي — جهّزوا نسختين من حوافظ المستندات", 0]] },
    { title: "جلسة الدعوى العمالية — مناقشة تقرير الخبير", type: "SESSION", status: "PENDING", priority: "CRITICAL", date: dateOffset(1), time: "10:30", locationId: L("north-giza-primary-court"), caseId: cs[1].id, createdByName: "الإدارة", createdAt: daysAgo(1), asg: [ahmed.id],
      comments: [["الإدارة", "التقرير في صالحنا — ركزوا على بند بدل الإخطار", 0], ["محامي أحمد عبد العزيز", "تمت المراجعة وحفظ النقاط، سأحمل نسخة مصورة", 0]] },
    { title: "تجديد عضوية النقابة لأ/ منى خليل", type: "ENTITY_VISIT", status: "PENDING", priority: "NORMAL", date: dateOffset(1), time: "12:00", locationId: L("north-giza-bar"), createdByName: "الإدارة", createdAt: daysAgo(1), asg: [karim.id] },
    { title: "تسليم مستخرج السجل التجاري المحدّث", type: "ENTITY_VISIT", status: "PENDING", priority: "NORMAL", date: dateOffset(1), time: "13:30", locationId: L("giza-commercial-registry"), caseId: cs[7].id, createdByName: "الإدارة", createdAt: daysAgo(0, 3), asg: [mona.id] },
    { title: "تقديم أوراق تصريح سفر لموكّل قضية التحكيم", type: "ENTITY_VISIT", status: "PENDING", priority: "NORMAL", date: dateOffset(2), time: "10:00", locationId: L("giza-passports"), caseId: cs[4].id, createdByName: "الإدارة", createdAt: daysAgo(0, 5), asg: [karim.id] },
    { title: "جلسة دعوى إلغاء القرار الإداري — هيئة المفوضين", type: "SESSION", status: "PENDING", priority: "CRITICAL", date: dateOffset(3), time: "10:00", locationId: L("state-commissioners") ?? null, caseId: cs[6].id, description: "تقرير المفوضين متاح — تحتاج مذكرة بالرد", notes: "مهلة تقديم المذكرة تنتهي مع الجلسة", createdByName: "دكتور حسام لطفي", createdAt: daysAgo(0, 2), asg: [hossam.id, sara.id] },
    { title: "جلسة دعوى الطلاق للضرر — تحقيق", type: "SESSION", status: "PENDING", priority: "IMPORTANT", date: dateOffset(5), time: "09:30", locationId: L("south-giza-family-court"), caseId: cs[2].id, createdByName: "الإدارة", createdAt: daysAgo(0, 4), asg: [sara.id] },
    { title: "حضور فحص ملف الشركة بمكتب ضرائب الدقي", type: "ENTITY_VISIT", status: "PENDING", priority: "IMPORTANT", date: dateOffset(6), time: "11:00", locationId: L("dokki-tax-office"), caseId: cs[4].id, notes: "بصحبة المحاسب القانوني", createdByName: "الإدارة", createdAt: daysAgo(0, 6), asg: [mona.id] },
    { title: "جلسة طعن النقض المدني — الدائرة التجارية ب", type: "SESSION", status: "PENDING", priority: "IMPORTANT", date: dateOffset(8), time: "09:00", locationId: L("court-of-cassation"), caseId: cs[4].id, description: "تقرير تلخيص الطعن مودع", createdByName: "دكتور حسام لطفي", createdAt: daysAgo(0, 8), asg: [hossam.id] },
    { title: "استخراج صورة رسمية من الحكم لصالح شركة الدلتا", type: "ENTITY_VISIT", status: "PENDING", priority: "NORMAL", date: dateOffset(10), time: "12:30", locationId: L("north-giza-primary-court"), caseId: cs[7].id, createdByName: "الإدارة", createdAt: daysAgo(0, 2), asg: [karim.id] },
    { title: "جلسة أولى — محكمة القاهرة الجديدة الابتدائية", type: "SESSION", status: "PENDING", priority: "NORMAL", date: dateOffset(12), time: "10:00", locationId: L("new-cairo-primary-court"), caseId: cs[8].id, notes: "رحلة طويلة — انطلاق 8 ص", createdByName: "الإدارة", createdAt: daysAgo(0, 1), asg: [sara.id] },
    { title: "حضور تحقيق النيابة الكلية — شمال الجيزة", type: "ENTITY_VISIT", status: "PENDING", priority: "IMPORTANT", date: dateOffset(14), time: "11:00", locationId: L("north-giza-prosecution"), caseId: cs[3].id, notes: "مع المتهم ومحضر البلاغ", createdByName: "الإدارة", createdAt: daysAgo(0, 3), asg: [ahmed.id, karim.id] },
    { title: "معاينة العقار محل دعوى البطلان", type: "ACTIVITY", status: "PENDING", priority: "NORMAL", date: dateOffset(14), time: "16:00", caseId: cs[9].id, notes: "بصحبة الخبير الهندسي", createdByName: "الإدارة", createdAt: daysAgo(0, 3), asg: [mohamed.id] },
    { title: "جلسة دعوى الطرد للغير", type: "SESSION", status: "PENDING", priority: "NORMAL", date: dateOffset(17), time: "09:30", locationId: L("north-giza-district-court"), caseId: cs[8].id, createdByName: "الإدارة", createdAt: daysAgo(0, 1), asg: [karim.id] },
    { title: "جدولة استئناف حكم صحة التوقيع", type: "SESSION", status: "PENDING", priority: "NORMAL", date: dateOffset(20), time: "10:00", locationId: L("giza-court-of-appeal"), caseId: cs[5].id, createdByName: "الإدارة", createdAt: daysAgo(0), asg: [mohamed.id] },
    { title: "مراجعة اشتراكات التأمينات لمؤسسة الصفا", type: "ENTITY_VISIT", status: "PENDING", priority: "NORMAL", date: dateOffset(24), time: "11:00", locationId: L("giza-social-insurance"), createdByName: "الإدارة", createdAt: daysAgo(0), asg: [karim.id] },
    { title: "جلسة تحكيم — مرافعة ختامية", type: "SESSION", status: "PENDING", priority: "IMPORTANT", date: dateOffset(28), time: "10:00", caseId: cs[4].id, notes: "مقر مركز القاهرة للتحكيم", createdByName: "دكتور حسام لطفي", createdAt: daysAgo(0), asg: [hossam.id, mona.id] },
    { title: "جلسة تحقيق — مكتب محكمة جنوب الزقازيق", type: "SESSION", status: "PENDING", priority: "NORMAL", date: dateOffset(30), time: "09:00", locationId: L("south-zagazig-primary-court"), caseId: cs[0].id, notes: "سفرية خارج المحافظة", createdByName: "الإدارة", createdAt: daysAgo(0), asg: [ahmed.id] },
    { title: "تسليم صورة المذكرة لخصم قضية الإيجارات", type: "ASSIGNMENT", status: "PENDING", priority: "IMPORTANT", date: dateOffset(-2), time: "12:00", caseId: cs[8].id, notes: "لم تُسلّم — تابع فوراً", createdByName: "الإدارة", createdAt: daysAgo(6), asg: [karim.id] },
    { title: "مراجعة عقد التوريد السنوي لشركة المتحدة", type: "ASSIGNMENT", status: "PENDING", priority: "IMPORTANT", description: "مراجعة البنود الجزائية وشرط التحكيم قبل التوقيع", createdByName: "الإدارة", createdAt: daysAgo(1, 6), asg: [mona.id, mohamed.id] },
    { title: "ترجمة لائحة الدعوى للغة الإنجليزية", type: "ASSIGNMENT", status: "PENDING", priority: "NORMAL", description: "قضية التحكيم — ترجمة معتمدة لصالح أمانة المركز", createdByName: "الإدارة", createdAt: daysAgo(2, 5), asg: [] },
    { title: "تحديث ملفات القضايا على الأرشيف الإلكتروني", type: "ACTIVITY", status: "IN_PROGRESS", priority: "NORMAL", createdByName: "الإدارة", createdAt: daysAgo(3, 2), asg: [karim.id] },
    { title: "تنبيه: قلم الاستئناف بمحكمة استئناف الجيزة مغلق الخميس القادم لأعمال الصيانة — خططوا المواعيد وفقاً لذلك.", type: "POST", status: "COMPLETED", priority: "NORMAL", createdByName: "الإدارة", createdAt: daysAgo(0, 4), asg: [] },
    { title: "تم الفصل لصالحنا في دعوى تصحيح شطب السجل التجاري لشركة الدلتا — تهانينا لفريق العمل.", type: "POST", status: "COMPLETED", priority: "NORMAL", createdByName: "دكتور حسام لطفي", createdAt: daysAgo(2, 1), asg: [],
      comments: [["محامي أحمد عبد العزيز", "الحمد لله — خطوة مهمة للعميل", 1], ["محامي منى خليل", "مبروك للجميع!", 1]] },
    { title: "قاعة الاجتماعات محجوزة غداً من ١ لـ ٣ لاجتماع شركة روافد.", type: "POST", status: "COMPLETED", priority: "NORMAL", createdByName: "الإدارة", createdAt: daysAgo(1, 2), asg: [] },
  ];

  const createdTasks = await db.insert(tasks).values(
    taskDefs.map(({ asg, comments: _c, ...t }) => ({ ...t }) as T),
  ).returning();
  console.log(`  ✔ ${createdTasks.length} مهمة`);

  for (let i = 0; i < taskDefs.length; i++) {
    const def = taskDefs[i];
    const task = createdTasks[i];
    for (const lid of def.asg) {
      await db.insert(taskAssignments).values({ taskId: task.id, lawyerId: lid }).onConflictDoNothing();
    }
    for (const [author, body, khours] of def.comments ?? []) {
      await db.insert(comments).values({ taskId: task.id, authorName: author, body, createdAt: daysAgo(0, khours * 60) });
    }
  }

  // ---------- التذكيرات الشخصية ----------
  const findTask = (title: string) => createdTasks.find((t) => t.title.includes(title))!.id;
  await db.insert(reminders).values([
    { title: "مراجعة ملف التحكيم قبل المرافعة الختامية", note: "التركيز على بند الغرامات", date: dateOffset(1), time: "08:30", lawyerId: hossam.id, createdByName: "الإدارة" },
    { title: "الاتصال بمكتب الخبراء لتأكيد موعد التقرير", note: "قضية المستحقات العمالية", date: todayStr(), time: "12:00", lawyerId: ahmed.id, createdByName: "الإدارة" },
    { title: "شراء نماذج التوكيلات من النقابة", date: dateOffset(2), lawyerId: karim.id, createdByName: "الإدارة" },
    { title: "اجتماع تخطيط الأسبوع — كل المحامين", note: "قاعة الاجتماعات — حضور إلزامي", date: dateOffset(0), time: "15:00", lawyerId: null, createdByName: "الإدارة" },
    { title: "مراجعة أرشيف القضايا المغلقة نهاية الشهر", date: dateOffset(-1), time: "10:00", lawyerId: null, createdByName: "الإدارة", notifiedAt: daysAgo(0, 5) },
  ]);

  // ---------- سجل تذكيرات البريد (عينات مرسلة) ----------
  await db.insert(emailReminders).values([
    { taskId: findTask("جدولة استئناف"), kind: "D14", recipientLawyerId: mohamed.id, recipientEmail: mohamed.email, taskTitle: "جدولة استئناف حكم صحة التوقيع", sessionDate: dateOffset(20), sentAt: daysAgo(6, 4) },
    { taskId: findTask("حضور فحص ملف الشركة"), kind: "D7", recipientLawyerId: mona.id, recipientEmail: mona.email, taskTitle: "حضور فحص ملف الشركة بمكتب ضرائب الدقي", sessionDate: dateOffset(6), sentAt: daysAgo(1, 7) },
    { taskId: findTask("جلسة دعوى إلغاء القرار الإداري"), kind: "D3", recipientLawyerId: hossam.id, recipientEmail: hossam.email, taskTitle: "جلسة دعوى إلغاء القرار الإداري — هيئة المفوضين", sessionDate: dateOffset(3), sentAt: daysAgo(0, 6) },
    { taskId: findTask("جلسة فسخ العقد والتعويض"), kind: "NIGHT", recipientLawyerId: mohamed.id, recipientEmail: mohamed.email, taskTitle: "جلسة فسخ العقد والتعويض — الدائرة ٧ مدني كلي", sessionDate: dateOffset(1), sentAt: daysAgo(0, 3) },
  ]);

  // ---------- رابط دخول تجريبي ----------
  await db.insert(accessTokens).values({
    token: `demo-${Date.now().toString(36)}-ahmed`,
    label: "رابط دخول شخصي — أحمد عبد العزيز",
    lawyerId: ahmed.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });

  // ---------- الإشعارات ----------
  await db.insert(notifications).values([
    { type: "assignment", title: "تكليف جديد باسمك", body: "جلسة فسخ العقد والتعويض — الدائرة ٧ مدني كلي", link: "/sessions", lawyerId: mohamed.id, createdAt: daysAgo(0, 2) },
    { type: "comment", title: "تعليق من دكتور حسام لطفي", body: "سأحضر المرافعة بنفسي — جهّزوا نسختين من حوافظ المستندات", link: "/tasks", lawyerId: mohamed.id, createdAt: daysAgo(0, 1) },
    { type: "assignment", title: "تكليف جديد باسمك", body: "مراجعة عقد التوريد السنوي لشركة المتحدة", link: "/tasks", lawyerId: mona.id, createdAt: daysAgo(1, 3) },
    { type: "email_reminder", title: "تذكير ليلة الجلسة: «جلسة فسخ العقد والتعويض»", body: `أُرسل تذكير بريدي إلى ${mohamed.email}`, link: "/tasks", lawyerId: mohamed.id, createdAt: daysAgo(0, 3), isRead: true },
    { type: "reminder", title: "تذكير: اجتماع تخطيط الأسبوع", body: "قاعة الاجتماعات — حضور إلزامي", link: "/admin?tab=reminders", lawyerId: null, createdAt: daysAgo(0, 4) },
    { type: "lawyer_pending", title: "طلب اعتماد محامٍ جديد", body: "نورهان سامي سجّلت وتنتظر الاعتماد", link: "/admin?tab=lawyers", lawyerId: null, createdAt: daysAgo(2, 4) },
    { type: "status", title: "تم تنفيذ: استلام تقرير الخبير", body: "محامي أحمد عبد العزيز أنهى التكليف", link: "/tasks", lawyerId: null, createdAt: daysAgo(1, 5), isRead: true },
  ]);

  // ---------- سجل النشاط ----------
  await db.insert(activityLogs).values([
    { action: "update_status", summary: "محامي أحمد عبد العزيز بدأ تنفيذ «جلسة جنحة الشيك بدون رصيد»", actorName: "محامي أحمد عبد العزيز", taskId: findTask("جلسة جنحة الشيك"), createdAt: daysAgo(0, 1) },
    { action: "comment", summary: "دكتور حسام لطفي علّق على جلسة فسخ العقد", actorName: "دكتور حسام لطفي", taskId: findTask("جلسة فسخ العقد"), createdAt: daysAgo(0, 2) },
    { action: "email_cron", summary: "دورة تذكيرات البريد: فُحص 9 جلسات وأُرسل 4 تذكيرات بريدية", actorName: "النظام (Cron)", createdAt: daysAgo(0, 6) },
    { action: "create_reminder", summary: "تذكير مكتب جديد: «اجتماع تخطيط الأسبوع»", actorName: "الإدارة", createdAt: daysAgo(0, 5) },
    { action: "access_link", summary: "توليد رابط دخول شخصي للمحامي أحمد عبد العزيز", actorName: "الإدارة", lawyerId: ahmed.id, createdAt: daysAgo(1, 2) },
    { action: "create_task", summary: "الإدارة أنشأت جلسة: «دعوى إلغاء القرار الإداري — هيئة المفوضين»", actorName: "الإدارة", taskId: findTask("إلغاء القرار الإداري"), createdAt: daysAgo(0, 5) },
    { action: "verify_location", summary: "الإدارة وثّقت بيانات «مكتب ضرائب الدقي»", actorName: "الإدارة", locationId: locId.get("dokki-tax-office")!, createdAt: daysAgo(2, 7) },
    { action: "create_post", summary: "دكتور حسام لطفي نشر تحديثاً: الفوز في قضية السجل التجاري", actorName: "دكتور حسام لطفي", createdAt: daysAgo(2, 1) },
    { action: "register_lawyer", summary: "نورهان سامي سجّلت حساباً وتنتظر الاعتماد", actorName: "نورهان سامي", lawyerId: lw[6].id, createdAt: daysAgo(2, 4) },
    { action: "link_case", summary: "تم ربط قضية «دعوى إلغاء قرار إداري» بشركة الدلتا للصناعات الغذائية", actorName: "الإدارة", createdAt: daysAgo(3, 3) },
    { action: "archive_lawyer", summary: "أرشفة المحامي ياسر عادل — يظل سجله محفوظاً", actorName: "الإدارة", lawyerId: lw[7].id, createdAt: daysAgo(30) },
  ]);

  // ---------- المستخدمون ----------
  await db.insert(users).values([
    { name: "د. حسام لطفي", email: "hossam@office.legal", role: "SUPER_ADMIN" },
    { name: "أمانة الإدارة", email: "admin@office.legal", role: "ADMIN" },
    { name: "مكتب المدير — أ/ رشا", email: "manager@office.legal", role: "OFFICE_MANAGER" },
    { name: "محامي أول — أحمد عبد العزيز", email: "ahmed.aziz@office.legal", role: "LAWYER" },
    { name: "سكرتارية الاستقبال", email: "reception@office.legal", role: "SECRETARY" },
    { name: "حساب متابعة خارجية", email: "viewer@office.legal", role: "VIEWER" },
  ]);

  console.log("✅ اكتملت البيانات التجريبية بنجاح");
  console.log(`  📍 ${locRows.length + queueLoc.length} جهة · 47 تصنيف · 28 خدمة · ${lw.length} محامون · ${cl.length} عملاء · ${cs.length} قضية · ${createdTasks.length} مهمة`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
