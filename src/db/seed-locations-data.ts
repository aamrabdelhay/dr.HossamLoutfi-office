// قاعدة معرفة المكتب — 116 محكمة + 15 جهة حكومية + 15 جهة عدلية
// مصدر البيانات: قاعدة معرفة المكتب — تحتاج مراجعة ميدانية

export type SeedLoc = {
  type: "COURT" | "AGENCY";
  slug: string;
  name: string;
  en: string;
  subtype: string;
  gov: string;
  city: string;
  addr: string | null;
  km: number;
  lat?: number;
  lng?: number;
  cat: string;
  services: string[];
  presence?: boolean;
  online?: boolean;
  desc?: string;
};

const COURT_SVC: Record<string, string[]> = {
  "ابتدائية": ["مدني كلي", "جنح", "عمالي", "إيجارات"],
  "جزئية": ["جنح", "مدني جزئي", "تسويات ودية"],
  "اقتصادية": ["منازعات اقتصادية", "شركات", "ملكية فكرية"],
  "أسر": ["أحوال شخصية", "نفقات", "حضانة"],
  "استئناف": ["استئناف مدني", "استئناف جنح مستأنفة"],
  "نقض": ["طعون بالنقض مدني وجنائي"],
  "دستورية عليا": ["فتاوى دستورية", "طعون دستورية"],
  "إدارية عليا": ["تفسير الأحكام", "إلغاء القرارات الإدارية", "تنفيذ الأحكام"],
  "قضاء إداري": ["دعاوى الإلغاء", "منازعات العقود الإدارية"],
  "مقر قضائي": ["خدمات قضائية مركزية"],
};

const ct = (
  slug: string, name: string, en: string, subtype: string, gov: string, city: string,
  addr: string | null, km: number, lat?: number, lng?: number, cat = "courts",
): SeedLoc => ({
  type: "COURT", slug, name, en, subtype, gov, city, addr, km, lat, lng, cat,
  services: COURT_SVC[subtype] ?? ["خدمات قضائية عامة"],
});

const ag = (
  slug: string, name: string, en: string, subtype: string, gov: string, city: string,
  addr: string | null, km: number, cat: string, services: string[],
  opts: { lat?: number; lng?: number; presence?: boolean; online?: boolean; desc?: string } = {},
): SeedLoc => ({
  type: "AGENCY", slug, name, en, subtype, gov, city, addr, km, cat, services,
  lat: opts.lat, lng: opts.lng, presence: opts.presence, online: opts.online, desc: opts.desc,
});

// ======================= 116 محكمة =======================
export const COURTS: SeedLoc[] = [
  // ---------- الجيزة (15) ----------
  ct("north-giza-primary-court", "محكمة شمال الجيزة الابتدائية", "North Giza Primary Court", "ابتدائية", "الجيزة", "الجيزة", "ميدان المحاكم — شارع الجيزة", 2.5, 30.0219, 31.2075),
  ct("north-giza-district-court", "محكمة شمال الجيزة الجزئية", "North Giza District Court", "جزئية", "الجيزة", "الدقي", "شارع التحرير — الدقي", 1.2, 30.0385, 31.2118),
  ct("north-giza-economic-court", "محكمة شمال الجيزة الاقتصادية", "North Giza Economic Court", "اقتصادية", "الجيزة", "الجيزة", "مجمع محاكم الجيزة — شارع الجيزة", 3, 30.0199, 31.2049),
  ct("north-giza-family-court", "محكمة شمال الجيزة للأسر", "North Giza Family Court", "أسر", "الجيزة", "الجيزة", "مجمع محاكم الجيزة", 3, 30.0205, 31.2056),
  ct("south-giza-primary-court", "محكمة جنوب الجيزة الابتدائية", "South Giza Primary Court", "ابتدائية", "الجيزة", "الهرم", "طريق الكورنيش — فيصل", 6.5, 29.9585, 31.1902),
  ct("south-giza-district-court", "محكمة جنوب الجيزة الجزئية", "South Giza District Court", "جزئية", "الجيزة", "الهرم", "طريق الهرم — جنوب الجيزة", 7, 29.9521, 31.1837),
  ct("south-giza-economic-court", "محكمة جنوب الجيزة الاقتصادية", "South Giza Economic Court", "اقتصادية", "الجيزة", "فيصل", "مجمع محاكم جنوب الجيزة", 8),
  ct("south-giza-family-court", "محكمة جنوب الجيزة للأسر", "South Giza Family Court", "أسر", "الجيزة", "فيصل", "مجمع محاكم جنوب الجيزة", 8),
  ct("kerdasa-district-court", "محكمة كرداسة الجزئية", "Kerdasa District Court", "جزئية", "الجيزة", "كرداسة", "شارع المحكمة — كرداسة", 12, 30.0816, 31.1462),
  ct("oseem-district-court", "محكمة أوسيم الجزئية", "Oseem District Court", "جزئية", "الجيزة", "أوسيم", "شارع المحكمة — أوسيم", 14),
  ct("badrashein-district-court", "محكمة البدرشين الجزئية", "Badrashein District Court", "جزئية", "الجيزة", "البدرشين", "شارع المحكمة — البدرشين", 18),
  ct("saff-district-court", "محكمة الصف الجزئية", "Saff District Court", "جزئية", "الجيزة", "الصف", "شارع المحكمة — الصف", 24),
  ct("ayat-district-court", "محكمة العياط الجزئية", "Ayat District Court", "جزئية", "الجيزة", "العياط", "شارع المحكمة — العياط", 28),
  ct("abu-nomros-district-court", "محكمة أبو النمرس الجزئية", "Abu Nomros District Court", "جزئية", "الجيزة", "أبو النمرس", "شارع المحكمة", 20),
  ct("mansheyat-qanater-district-court", "محكمة منشأة القناطر الجزئية", "Mansheyat El-Qanater District Court", "جزئية", "الجيزة", "منشأة القناطر", "شارع المحكمة", 22),

  // ---------- القاهرة (21) ----------
  ct("supreme-administrative-court", "المحكمة الإدارية العليا — مجلس الدولة", "Supreme Administrative Court — Council of State", "إدارية عليا", "القاهرة", "وسط القاهرة", "مبنى مجلس الدولة — شارع 26 يوليو، جاردن سيتي", 6, 30.0444, 31.2249, "state-council"),
  ct("administrative-judiciary-cairo", "محكمة القضاء الإداري — مجلس الدولة (القاهرة)", "Administrative Judicial Court — Cairo", "قضاء إداري", "القاهرة", "وسط القاهرة", "مبنى مجلس الدولة — ميدان التحرير", 5.5, 30.0447, 31.2353, "state-council"),
  ct("administrative-judiciary-giza", "محكمة القضاء الإداري — مجلس الدولة (الجيزة)", "Administrative Judicial Court — Giza", "قضاء إداري", "الجيزة", "الجيزة", "فرع مجلس الدولة — شارع الجيزة", 3.5, undefined, undefined, "state-council"),
  ct("supreme-judiciary-house", "دار القضاء العالي", "House of the Supreme Judiciary", "مقر قضائي", "القاهرة", "وسط القاهرة", "شارع 26 يوليو — جاردن سيتي", 6, 30.0416, 31.2244),
  ct("court-of-cassation", "محكمة النقض", "Court of Cassation", "نقض", "القاهرة", "وسط القاهرة", "مبنى محكمة النقض — 11 شارع رمسيس", 6.5, 30.0527, 31.2337),
  ct("supreme-constitutional-court", "المحكمة الدستورية العليا", "Supreme Constitutional Court", "دستورية عليا", "القاهرة", "وسط القاهرة", "شارع محمد فريد — وسط البلد", 6, undefined, undefined, "constitutional-court"),
  ct("cairo-court-of-appeal", "محكمة استئناف القاهرة", "Cairo Court of Appeal", "استئناف", "القاهرة", "وسط القاهرة", "مبنى المحاكم — شارع رمسيس", 6.5, 30.0552, 31.2335),
  ct("giza-court-of-appeal", "محكمة استئناف الجيزة", "Giza Court of Appeal", "استئناف", "الجيزة", "الجيزة", "مبنى استئناف الجيزة — شارع الجيزة", 3),
  ct("north-cairo-primary-court", "محكمة شمال القاهرة الابتدائية", "North Cairo Primary Court", "ابتدائية", "القاهرة", "شبرا", "مجمع محاكم شمال القاهرة — شارع شبرا", 8, 30.0994, 31.2458),
  ct("south-cairo-primary-court", "محكمة جنوب القاهرة الابتدائية", "South Cairo Primary Court", "ابتدائية", "القاهرة", "حلوان", "مجمع محاكم جنوب القاهرة", 14),
  ct("north-cairo-economic-court", "محكمة شمال القاهرة الاقتصادية", "North Cairo Economic Court", "اقتصادية", "القاهرة", "وسط القاهرة", "مجمع المحاكم الاقتصادية — وسط القاهرة", 6),
  ct("south-cairo-economic-court", "محكمة جنوب القاهرة الاقتصادية", "South Cairo Economic Court", "اقتصادية", "القاهرة", "حلوان", "مجمع محاكم جنوب القاهرة", 14),
  ct("cairo-economic-court", "محكمة القاهرة الاقتصادية", "Cairo Economic Court", "اقتصادية", "القاهرة", "وسط القاهرة", "مجمع المحاكم الاقتصادية — صلاح سالم", 7),
  ct("abedin-district-court", "محكمة عابدين الجزئية", "Abedin District Court", "جزئية", "القاهرة", "عابدين", "شارع عابدين", 6.5),
  ct("nasr-city-district-court", "محكمة مدينة نصر الجزئية", "Nasr City District Court", "جزئية", "القاهرة", "مدينة نصر", "شارع عباس العقاد", 10),
  ct("helwan-primary-court", "محكمة حلوان الابتدائية", "Helwan Primary Court", "ابتدائية", "القاهرة", "حلوان", "ميدان المحكمة — حلوان", 25, 29.8441, 31.3346),
  ct("helwan-district-court", "محكمة حلوان الجزئية", "Helwan District Court", "جزئية", "القاهرة", "حلوان", "ميدان المحكمة — حلوان", 25),
  ct("helwan-family-court", "محكمة حلوان للأسر", "Helwan Family Court", "أسر", "القاهرة", "حلوان", "مجمع محاكم حلوان", 25),
  ct("new-cairo-primary-court", "محكمة القاهرة الجديدة الابتدائية", "New Cairo Primary Court", "ابتدائية", "القاهرة", "القاهرة الجديدة", "الحي الأول — التجمع الخامس", 32, 30.0302, 31.4685),
  ct("new-cairo-district-court", "محكمة القاهرة الجديدة الجزئية", "New Cairo District Court", "جزئية", "القاهرة", "القاهرة الجديدة", "التجمع الخامس", 32),
  ct("new-cairo-economic-court", "محكمة القاهرة الجديدة الاقتصادية", "New Cairo Economic Court", "اقتصادية", "القاهرة", "القاهرة الجديدة", "التجمع الخامس", 32),

  // ---------- القليوبية (8) ----------
  ct("north-banha-primary-court", "محكمة شمال بنها الابتدائية", "North Banha Primary Court", "ابتدائية", "القليوبية", "بنها", "شارع الجيش — بنها", 48, 30.4594, 31.1787),
  ct("south-banha-primary-court", "محكمة جنوب بنها الابتدائية", "South Banha Primary Court", "ابتدائية", "القليوبية", "بنها", "شارع الجيش — بنها", 48),
  ct("banha-district-court", "محكمة بنها الجزئية", "Banha District Court", "جزئية", "القليوبية", "بنها", "شارع المحكمة — بنها", 48),
  ct("shubra-kheima-primary-court", "محكمة شبرا الخيمة الابتدائية", "Shubra El-Kheima Primary Court", "ابتدائية", "القليوبية", "شبرا الخيمة", "شارع المحكمة — شبرا الخيمة", 15, 30.1286, 31.2422),
  ct("shubra-kheima-district-court", "محكمة شبرا الخيمة الجزئية", "Shubra El-Kheima District Court", "جزئية", "القليوبية", "شبرا الخيمة", "شارع المحكمة", 15),
  ct("qalyub-primary-court", "محكمة قليوب الابتدائية", "Qalyub Primary Court", "ابتدائية", "القليوبية", "قليوب", "شارع المحكمة — قليوب", 20, 30.1754, 31.2067),
  ct("qalyub-district-court", "محكمة قليوب الجزئية", "Qalyub District Court", "جزئية", "القليوبية", "قليوب", "شارع المحكمة", 20),
  ct("qanater-kheirya-district-court", "محكمة القناطر الخيرية الجزئية", "Qanater El-Kheirya District Court", "جزئية", "القليوبية", "القناطر الخيرية", "شارع المحكمة", 25),

  // ---------- المنوفية (3) ----------
  ct("shibin-kom-primary-court", "محكمة شبين الكوم الابتدائية", "Shibin El-Kom Primary Court", "ابتدائية", "المنوفية", "شبين الكوم", "شارع الجيش", 62, 30.5565, 31.0093),
  ct("shibin-kom-district-court", "محكمة شبين الكوم الجزئية", "Shibin El-Kom District Court", "جزئية", "المنوفية", "شبين الكوم", "شارع المحكمة", 62),
  ct("shibin-kom-economic-court", "محكمة شبين الكوم الاقتصادية", "Shibin El-Kom Economic Court", "اقتصادية", "المنوفية", "شبين الكوم", "مجمع محاكم شبين الكوم", 62),

  // ---------- الغربية (5) ----------
  ct("west-tanta-primary-court", "محكمة غرب طنطا الابتدائية", "West Tanta Primary Court", "ابتدائية", "الغربية", "طنطا", "شارع البحر", 85, 30.7865, 30.9982),
  ct("west-tanta-district-court", "محكمة غرب طنطا الجزئية", "West Tanta District Court", "جزئية", "الغربية", "طنطا", "شارع البحر", 85),
  ct("east-tanta-primary-court", "محكمة شرق طنطا الابتدائية", "East Tanta Primary Court", "ابتدائية", "الغربية", "طنطا", "شارع الجيش", 85),
  ct("east-tanta-district-court", "محكمة شرق طنطا الجزئية", "East Tanta District Court", "جزئية", "الغربية", "طنطا", "شارع الجيش", 85),
  ct("tanta-economic-court", "محكمة طنطا الاقتصادية", "Tanta Economic Court", "اقتصادية", "الغربية", "طنطا", "مجمع المحاكم الاقتصادية", 85),

  // ---------- كفر الشيخ (3) ----------
  ct("kafr-sheikh-primary-court", "محكمة كفر الشيخ الابتدائية", "Kafr El-Sheikh Primary Court", "ابتدائية", "كفر الشيخ", "كفر الشيخ", "شارع الجيش", 130, 31.1107, 30.9388),
  ct("kafr-sheikh-district-court", "محكمة كفر الشيخ الجزئية", "Kafr El-Sheikh District Court", "جزئية", "كفر الشيخ", "كفر الشيخ", "شارع المحكمة", 130),
  ct("kafr-sheikh-family-court", "محكمة كفر الشيخ للأسر", "Kafr El-Sheikh Family Court", "أسر", "كفر الشيخ", "كفر الشيخ", "مجمع محاكم كفر الشيخ", 130),

  // ---------- دمياط (3) ----------
  ct("damietta-primary-court", "محكمة دمياط الابتدائية", "Damietta Primary Court", "ابتدائية", "دمياط", "دمياط", "شارع الجيش", 200, 31.4165, 31.8133),
  ct("damietta-district-court", "محكمة دمياط الجزئية", "Damietta District Court", "جزئية", "دمياط", "دمياط", "شارع المحكمة", 200),
  ct("damietta-family-court", "محكمة دمياط للأسر", "Damietta Family Court", "أسر", "دمياط", "دمياط", "مجمع محاكم دمياط", 200),

  // ---------- الدقهلية (5) ----------
  ct("south-mansoura-primary-court", "محكمة جنوب المنصورة الابتدائية", "South Mansoura Primary Court", "ابتدائية", "الدقهلية", "المنصورة", "شارع الجمهورية", 120, 31.0341, 31.3807),
  ct("south-mansoura-district-court", "محكمة جنوب المنصورة الجزئية", "South Mansoura District Court", "جزئية", "الدقهلية", "المنصورة", "شارع المحكمة", 120),
  ct("north-mansoura-primary-court", "محكمة شمال المنصورة الابتدائية", "North Mansoura Primary Court", "ابتدائية", "الدقهلية", "المنصورة", "طريق شربين", 120),
  ct("north-mansoura-district-court", "محكمة شمال المنصورة الجزئية", "North Mansoura District Court", "جزئية", "الدقهلية", "المنصورة", "شارع المحكمة", 120),
  ct("mansoura-economic-court", "محكمة المنصورة الاقتصادية", "Mansoura Economic Court", "اقتصادية", "الدقهلية", "المنصورة", "مجمع المحاكم الاقتصادية", 120),

  // ---------- الشرقية (4) ----------
  ct("south-zagazig-primary-court", "محكمة جنوب الزقازيق الابتدائية", "South Zagazig Primary Court", "ابتدائية", "الشرقية", "الزقازيق", "ميدان المحكمة", 65, 30.5877, 31.502),
  ct("south-zagazig-district-court", "محكمة جنوب الزقازيق الجزئية", "South Zagazig District Court", "جزئية", "الشرقية", "الزقازيق", "شارع المحكمة", 65),
  ct("north-zagazig-primary-court", "محكمة شمال الزقازيق الابتدائية", "North Zagazig Primary Court", "ابتدائية", "الشرقية", "الزقازيق", "طريق أبو حماد", 65),
  ct("north-zagazig-district-court", "محكمة شمال الزقازيق الجزئية", "North Zagazig District Court", "جزئية", "الشرقية", "الزقازيق", "شارع المحكمة", 65),

  // ---------- الإسكندرية (7) ----------
  ct("east-alexandria-primary-court", "محكمة شرق الإسكندرية الابتدائية", "East Alexandria Primary Court", "ابتدائية", "الإسكندرية", "شرق الإسكندرية", "ميدان المحكمة — محرم بك", 220, 31.205, 29.92),
  ct("east-alexandria-district-court", "محكمة شرق الإسكندرية الجزئية", "East Alexandria District Court", "جزئية", "الإسكندرية", "شرق الإسكندرية", "شارع المحكمة — محرم بك", 220),
  ct("west-alexandria-primary-court", "محكمة غرب الإسكندرية الابتدائية", "West Alexandria Primary Court", "ابتدائية", "الإسكندرية", "غرب الإسكندرية", "ميدان المحكمة — العجمي", 225),
  ct("west-alexandria-district-court", "محكمة غرب الإسكندرية الجزئية", "West Alexandria District Court", "جزئية", "الإسكندرية", "غرب الإسكندرية", "شارع المحكمة", 225),
  ct("alexandria-economic-court", "محكمة الإسكندرية الاقتصادية", "Alexandria Economic Court", "اقتصادية", "الإسكندرية", "الإسكندرية", "مجمع المحاكم الاقتصادية — سموحة", 218),
  ct("east-alexandria-family-court", "محكمة شرق الإسكندرية للأسر", "East Alexandria Family Court", "أسر", "الإسكندرية", "شرق الإسكندرية", "مجمع محاكم شرق الإسكندرية", 220),
  ct("alexandria-court-of-appeal", "محكمة استئناف الإسكندرية", "Alexandria Court of Appeal", "استئناف", "الإسكندرية", "الإسكندرية", "مبنى استئناف الإسكندرية — محطة الرمل", 215, 31.2245, 29.9443),

  // ---------- البحيرة (4) ----------
  ct("north-damanhour-primary-court", "محكمة شمال دمنهور الابتدائية", "North Damanhour Primary Court", "ابتدائية", "البحيرة", "دمنهور", "شارع الجيش", 160, 31.0409, 30.4695),
  ct("north-damanhour-district-court", "محكمة شمال دمنهور الجزئية", "North Damanhour District Court", "جزئية", "البحيرة", "دمنهور", "شارع المحكمة", 160),
  ct("south-damanhour-primary-court", "محكمة جنوب دمنهور الابتدائية", "South Damanhour Primary Court", "ابتدائية", "البحيرة", "دمنهور", "طريق كفر الدوار", 160),
  ct("south-damanhour-district-court", "محكمة جنوب دمنهور الجزئية", "South Damanhour District Court", "جزئية", "البحيرة", "دمنهور", "شارع المحكمة", 160),

  // ---------- مطروح (2) ----------
  ct("marsa-matrouh-primary-court", "محكمة مرسى مطروح الابتدائية", "Marsa Matrouh Primary Court", "ابتدائية", "مطروح", "مرسى مطروح", "شارع البحر", 440, 31.3543, 27.2373),
  ct("marsa-matrouh-district-court", "محكمة مرسى مطروح الجزئية", "Marsa Matrouh District Court", "جزئية", "مطروح", "مرسى مطروح", "شارع المحكمة", 440),

  // ---------- الإسماعيلية (3) ----------
  ct("ismailia-primary-court", "محكمة الإسماعيلية الابتدائية", "Ismailia Primary Court", "ابتدائية", "الإسماعيلية", "الإسماعيلية", "شارع السلطة", 140, 30.5852, 32.2654),
  ct("ismailia-district-court", "محكمة الإسماعيلية الجزئية", "Ismailia District Court", "جزئية", "الإسماعيلية", "الإسماعيلية", "شارع المحكمة", 140),
  ct("ismailia-economic-court", "محكمة الإسماعيلية الاقتصادية", "Ismailia Economic Court", "اقتصادية", "الإسماعيلية", "الإسماعيلية", "مجمع المحاكم الاقتصادية", 140),

  // ---------- بورسعيد (3) ----------
  ct("port-said-primary-court", "محكمة بورسعيد الابتدائية", "Port Said Primary Court", "ابتدائية", "بورسعيد", "بورسعيد", "شارع 23 يوليو", 200, 31.2653, 32.3019),
  ct("port-said-district-court", "محكمة بورسعيد الجزئية", "Port Said District Court", "جزئية", "بورسعيد", "بورسعيد", "شارع المحكمة", 200),
  ct("port-said-economic-court", "محكمة بورسعيد الاقتصادية", "Port Said Economic Court", "اقتصادية", "بورسعيد", "بورسعيد", "مجمع المحاكم الاقتصادية", 200),

  // ---------- السويس (3) ----------
  ct("suez-primary-court", "محكمة السويس الابتدائية", "Suez Primary Court", "ابتدائية", "السويس", "السويس", "شارع الجيش", 130, 29.9668, 32.5498),
  ct("suez-district-court", "محكمة السويس الجزئية", "Suez District Court", "جزئية", "السويس", "السويس", "شارع المحكمة", 130),
  ct("suez-family-court", "محكمة السويس للأسر", "Suez Family Court", "أسر", "السويس", "السويس", "مجمع محاكم السويس", 130),

  // ---------- شمال وجنوب سيناء (4) ----------
  ct("arish-primary-court", "محكمة العريش الابتدائية", "Arish Primary Court", "ابتدائية", "شمال سيناء", "العريش", "شارع المحكمة", 330, 31.1249, 33.7984),
  ct("arish-district-court", "محكمة العريش الجزئية", "Arish District Court", "جزئية", "شمال سيناء", "العريش", "شارع المحكمة", 330),
  ct("el-tor-primary-court", "محكمة الطور الابتدائية", "El-Tor Primary Court", "ابتدائية", "جنوب سيناء", "الطور", "شارع المحكمة", 320, 28.2416, 33.6179),
  ct("el-tor-district-court", "محكمة الطور الجزئية", "El-Tor District Court", "جزئية", "جنوب سيناء", "الطور", "شارع المحكمة", 320),

  // ---------- بني سويف (3) ----------
  ct("beni-suef-primary-court", "محكمة بني سويف الابتدائية", "Beni Suef Primary Court", "ابتدائية", "بني سويف", "بني سويف", "كورنيش النيل", 115, 29.0661, 31.0994),
  ct("beni-suef-district-court", "محكمة بني سويف الجزئية", "Beni Suef District Court", "جزئية", "بني سويف", "بني سويف", "شارع المحكمة", 115),
  ct("beni-suef-economic-court", "محكمة بني سويف الاقتصادية", "Beni Suef Economic Court", "اقتصادية", "بني سويف", "بني سويف", "مجمع المحاكم الاقتصادية", 115),

  // ---------- الفيوم (3) ----------
  ct("fayoum-primary-court", "محكمة الفيوم الابتدائية", "Fayoum Primary Court", "ابتدائية", "الفيوم", "الفيوم", "شارع الجيش", 100, 29.3084, 30.8428),
  ct("fayoum-district-court", "محكمة الفيوم الجزئية", "Fayoum District Court", "جزئية", "الفيوم", "الفيوم", "شارع المحكمة", 100),
  ct("fayoum-family-court", "محكمة الفيوم للأسر", "Fayoum Family Court", "أسر", "الفيوم", "الفيوم", "مجمع محاكم الفيوم", 100),

  // ---------- المنيا (3) ----------
  ct("minya-primary-court", "محكمة المنيا الابتدائية", "Minya Primary Court", "ابتدائية", "المنيا", "المنيا", "كورنيش النيل", 245, 28.1099, 30.7503),
  ct("minya-district-court", "محكمة المنيا الجزئية", "Minya District Court", "جزئية", "المنيا", "المنيا", "شارع المحكمة", 245),
  ct("minya-economic-court", "محكمة المنيا الاقتصادية", "Minya Economic Court", "اقتصادية", "المنيا", "المنيا", "مجمع المحاكم الاقتصادية", 245),

  // ---------- أسيوط (3) ----------
  ct("assiut-primary-court", "محكمة أسيوط الابتدائية", "Assiut Primary Court", "ابتدائية", "أسيوط", "أسيوط", "كورنيش النيل", 370, 27.1783, 31.1859),
  ct("assiut-district-court", "محكمة أسيوط الجزئية", "Assiut District Court", "جزئية", "أسيوط", "أسيوط", "شارع المحكمة", 370),
  ct("assiut-economic-court", "محكمة أسيوط الاقتصادية", "Assiut Economic Court", "اقتصادية", "أسيوط", "أسيوط", "مجمع المحاكم الاقتصادية", 370),

  // ---------- سوهاج (3) ----------
  ct("sohag-primary-court", "محكمة سوهاج الابتدائية", "Sohag Primary Court", "ابتدائية", "سوهاج", "سوهاج", "كورنيش النيل", 490, 26.5591, 31.6957),
  ct("sohag-district-court", "محكمة سوهاج الجزئية", "Sohag District Court", "جزئية", "سوهاج", "سوهاج", "شارع المحكمة", 490),
  ct("sohag-family-court", "محكمة سوهاج للأسر", "Sohag Family Court", "أسر", "سوهاج", "سوهاج", "مجمع محاكم سوهاج", 490),

  // ---------- قنا (3) ----------
  ct("qena-primary-court", "محكمة قنا الابتدائية", "Qena Primary Court", "ابتدائية", "قنا", "قنا", "كورنيش النيل", 600, 26.1551, 32.716),
  ct("qena-district-court", "محكمة قنا الجزئية", "Qena District Court", "جزئية", "قنا", "قنا", "شارع المحكمة", 600),
  ct("qena-economic-court", "محكمة قنا الاقتصادية", "Qena Economic Court", "اقتصادية", "قنا", "قنا", "مجمع المحاكم الاقتصادية", 600),

  // ---------- الأقصر (3) ----------
  ct("luxor-primary-court", "محكمة الأقصر الابتدائية", "Luxor Primary Court", "ابتدائية", "الأقصر", "الأقصر", "كورنيش النيل", 670, 25.6872, 32.6396),
  ct("luxor-district-court", "محكمة الأقصر الجزئية", "Luxor District Court", "جزئية", "الأقصر", "الأقصر", "شارع المحكمة", 670),
  ct("luxor-economic-court", "محكمة الأقصر الاقتصادية", "Luxor Economic Court", "اقتصادية", "الأقصر", "الأقصر", "مجمع المحاكم الاقتصادية", 670),

  // ---------- أسوان (3) ----------
  ct("aswan-primary-court", "محكمة أسوان الابتدائية", "Aswan Primary Court", "ابتدائية", "أسوان", "أسوان", "كورنيش النيل", 900, 24.0889, 32.8998),
  ct("aswan-district-court", "محكمة أسوان الجزئية", "Aswan District Court", "جزئية", "أسوان", "أسوان", "شارع المحكمة", 900),
  ct("aswan-economic-court", "محكمة أسوان الاقتصادية", "Aswan Economic Court", "اقتصادية", "أسوان", "أسوان", "مجمع المحاكم الاقتصادية", 900),

  // ---------- البحر الأحمر (2) ----------
  ct("hurghada-primary-court", "محكمة الغردقة الابتدائية", "Hurghada Primary Court", "ابتدائية", "البحر الأحمر", "الغردقة", "شارع المطار", 450, 27.2579, 33.8116),
  ct("hurghada-district-court", "محكمة الغردقة الجزئية", "Hurghada District Court", "جزئية", "البحر الأحمر", "الغردقة", "شارع المحكمة", 450),
];

// ======================= 15 جهة حكومية/قانونية =======================
export const PLACES: SeedLoc[] = [
  ag("dokki-tax-office", "مكتب ضرائب الدقي", "Dokki Tax Office", "ضرائب", "الجيزة", "الدقي", null, 1.5, "tax",
    ["تقديم الإقرارات الضريبية", "الفصل الضريبي", "الطعون الضريبية"], { online: true }),
  ag("dokki-real-estate", "الشهر العقاري — الدقي", "Dokki Real Estate Registration", "شهر عقاري", "الجيزة", "الدقي", null, 1.8, "real-estate",
    ["تقييد العقارات", "الرسوم العقارية", "صور رسمية للقيد"], { presence: true }),
  ag("giza-commercial-registry", "السجل التجاري — الجيزة", "Giza Commercial Registry", "سجل تجاري", "الجيزة", "الجيزة", null, 3, "commercial-registry",
    ["تأسيس الشركات", "التعديلات التجارية", "شهادة سجل تجاري"], { online: true }),
  ag("north-giza-bar", "نقابة المحامين — شمال الجيزة", "North Giza Bar Association", "نقابة", "الجيزة", "الجيزة", null, 2, "bar",
    ["تجديد التراخيص", "بطاقة نقابية", "شهادة حسن سيرة"]),
  ag("giza-survey-authority", "جهاز المساحة — مديرية الجيزة", "Giza Survey Authority", "مساحة", "الجيزة", "الجيزة", null, 4, "land-registry",
    ["رفع مساحي", "معاينات عقارية", "أعمال التسوية"], { presence: true }),
  ag("giza-passports", "مصلحة الجوازات والهجرة والجنسية — الجيزة", "Giza Passports & Immigration", "جوازات", "الجيزة", "الجيزة", null, 6, "passports",
    ["إصدار جواز سفر", "تجديد الجواز", "تأشيرات الخروج"], { online: true }),
  ag("giza-traffic", "إدارة مرور الجيزة", "Giza Traffic Department", "مرور", "الجيزة", "الجيزة", null, 3, "traffic",
    ["تجديد الرخص", "سداد المخالفات", "نقل ملكية سيارة"], { online: true }),
  ag("giza-social-insurance", "الهيئة القومية للتأمين الاجتماعي — الجيزة", "Giza Social Insurance", "تأمينات", "الجيزة", "الجيزة", null, 3.5, "social-insurance",
    ["تأمينات العاملين", "شهادة اشتراك", "المعاشات"]),
  ag("giza-labor-office", "مكتب العمل — الجيزة", "Giza Labor Office", "قوى عاملة", "الجيزة", "الجيزة", null, 4, "labour",
    ["تسجيل عقود العمل", "منازعات عمالية", "تصاريح العمل"]),
  ag("giza-customs", "جمارك الجيزة", "Giza Customs", "جمارك", "الجيزة", "الجيزة", null, 9, "customs",
    ["تخليص جمركي", "بيان جمركي", "طعون جمركية"]),
  ag("gafi-giza", "الهيئة العامة للاستثمار — مكتب الجيزة", "GAFI — Giza Office", "استثمار", "الجيزة", "الجيزة", null, 8, "gafi",
    ["تأسيس شركات المناطق الحرة", "حزم استثمارية", "الإعفاءات"], { online: true }),
  ag("giza-experts-office", "مكتب الخبراء — الجيزة", "Giza Experts Office", "خبراء", "الجيزة", "الجيزة", null, 3, "court-experts",
    ["إحالة خبرة", "تسعير عقاري", "خبرة فنية"]),
  ag("dokki-civil-registry", "السجل المدني — الدقي", "Dokki Civil Registry", "أحوال مدنية", "الجيزة", "الدقي", null, 2, "civil-status",
    ["شهادة ميلاد", "شهادة وفاة", "قيد عائلي"], { online: true }),
  ag("north-giza-prosecution", "النيابة الكلية — شمال الجيزة", "North Giza Prosecution", "نيابة عامة", "الجيزة", "الجيزة", null, 2.5, "prosecution",
    ["تحقيقات أولية", "دعاوى جنائية", "إنابة قضائية"], { presence: true }),
  ag("giza-governorate-hq", "محافظة الجيزة — ديوان عام", "Giza Governorate HQ", "محافظة", "الجيزة", "الجيزة", null, 3, "local-gov",
    ["شكاوى المواطنين", "خدمات الأراضي", "المشروعات"]),
];

// ======================= 15 جهة عدلية =======================
export const JUSTICE: SeedLoc[] = [
  ag("public-prosecutor-office", "مكتب النائب العام — دار القضاء العالي", "Public Prosecutor Office", "نيابة عامة", "القاهرة", "وسط القاهرة", "دار القضاء العالي — شارع 26 يوليو", 6, "prosecution",
    ["تصاريح وبلاغات", "طلبات النائب العام", "متابعة الدعاوى"]),
  ag("public-funds-prosecution", "نيابة الأموال العامة العليا — القاهرة", "Public Funds Prosecution", "نيابة عامة", "القاهرة", "وسط القاهرة", null, 6.5, "prosecution",
    ["قضايا الأموال العامة", "التحقيق في المال العام", "حظر التصرف"]),
  ag("admin-prosecution-hq-october", "رئاسة هيئة النيابة الإدارية — 6 أكتوبر", "Administrative Prosecution Authority HQ", "نيابة إدارية", "الجيزة", "6 أكتوبر", "ميدان النجدة — الحي الرابع (16117)", 24, "admin-prosecution",
    ["الدعاوى التأديبية", "التحقيق الإداري", "الإحالة للمحاكمة التأديبية"], { lat: 29.9479, lng: 30.9168 }),
  ag("admin-prosecution-new-cairo", "مجمع النيابة الإدارية — التجمع الخامس", "Administrative Prosecution Complex — Fifth Settlement", "نيابة إدارية", "القاهرة", "التجمع الخامس", "شارع التسعين الشمالي", 30, "admin-prosecution",
    ["الدعاوى التأديبية", "التحقيق الإداري", "المكتب الفني"], { lat: 30.0174, lng: 31.4466 }),
  ag("state-lawsuits-hq", "هيئة قضايا الدولة — المقر الرئيسي", "State Lawsuits Authority HQ", "قضايا الدولة", "القاهرة", "التجمع الأول", "جنوب القرنفل", 28, "state-lawsuits",
    ["تمثيل الدولة", "منازعات العقود الإدارية", "الفتاوى القانونية"], { lat: 30.0426, lng: 31.4629 }),
  ag("state-lawsuits-giza", "هيئة قضايا الدولة — قطاع الجيزة", "State Lawsuits Authority — Giza Sector", "قضايا الدولة", "الجيزة", "المهندسين", "شارع أحمد عرابي", 4, "state-lawsuits",
    ["تمثيل الدولة", "منازعات العقود الإدارية", "طلبات التسوية"], { lat: 30.0528, lng: 31.196 }),
  ag("state-commissioners", "مجلس الدولة — هيئة مفوضي الدولة", "State Council — Commissioners Authority", "مجلس الدولة", "الجيزة", "أرض المعارض", null, 5, "state-council",
    ["تقارير هيئة المفوضين", "الطعون الإدارية", "الفتاوى"]),
  ag("military-judiciary-cairo", "هيئة القضاء العسكري — القاهرة", "Military Judiciary Authority", "قضاء عسكري", "القاهرة", "وسط القاهرة", null, 8, "military-judiciary",
    ["الدعاوى العسكرية", "الطعون العسكرية", "الاستشارات"]),
  ag("experts-authority-cairo", "مصلحة الخبراء — القاهرة", "Experts Authority", "خبراء", "القاهرة", "لاظوغلي", null, 7, "court-experts",
    ["إحالة الخبرة", "خبرة هندسية وحسابية", "تسعير وتقييم"]),
  ag("forensic-medicine-cairo", "مصلحة الطب الشرعي — القاهرة", "Forensic Medicine Authority", "طب شرعي", "القاهرة", "السيدة زينب", "زينهم", 9, "forensic",
    ["تقارير الطب الشرعي", "التشريح الطبي القانوني", "أبحاث التزييف والتزوير"]),
  ag("execution-sector-moj", "قطاع التنفيذ — وزارة العدل", "Execution Sector — Ministry of Justice", "تنفيذ", "القاهرة", "لاظوغلي", null, 7, "execution",
    ["إجراءات التنفيذ", "إشكالات التنفيذ", "التنفيذ الجبري"]),
  ag("cairo-appeal-execution-office", "قلم التنفيذ — محكمة استئناف القاهرة", "Execution Office — Cairo Court of Appeal", "تنفيذ", "القاهرة", "وسط القاهرة", null, 6.5, "execution",
    ["تنفيذ الأحكام المدنية", "إشكالات التنفيذ", "الحجز والبيع"]),
  ag("prisons-sector-moi", "قطاع مصلحة السجون — وزارة الداخلية", "Prison Authority Sector — MOI", "سجون", "القاهرة", "وسط القاهرة", null, 8, "prisons",
    ["طلبات الزيارة", "العرائض المقدمة للسجون", "الإفراج الشرطي"]),
  ag("criminal-evidence-moi", "الإدارة العامة للأدلة الجنائية — وزارة الداخلية", "General Criminal Evidence Administration — MOI", "شرطة", "القاهرة", "وسط القاهرة", null, 8, "police",
    ["الأدلة الجنائية", "البصمات والتزييف", "فحص المستندات"]),
  ag("criminal-investigations-moi", "الإدارة العامة للمباحث الجنائية — وزارة الداخلية", "General Criminal Investigation Administration — MOI", "شرطة", "القاهرة", "وسط القاهرة", null, 8, "police",
    ["البلاغات الجنائية", "التحريات", "تنفيذ الأحكام"]),
];

export const ALL_SEED_LOCATIONS: SeedLoc[] = [...COURTS, ...PLACES, ...JUSTICE];

// ======================= 47 تصنيف =======================
export const CATEGORIES: Array<[string, string, string]> = [
  ["courts", "المحاكم", "Courts"],
  ["prosecution", "النيابة العامة", "Public Prosecution"],
  ["admin-prosecution", "النيابة الإدارية", "Administrative Prosecution"],
  ["state-lawsuits", "هيئة قضايا الدولة", "State Lawsuits Authority"],
  ["state-council", "مجلس الدولة", "State Council"],
  ["constitutional-court", "المحكمة الدستورية العليا", "Supreme Constitutional Court"],
  ["military-judiciary", "القضاء العسكري", "Military Judiciary"],
  ["court-experts", "الخبراء", "Court Experts"],
  ["forensic", "الطب الشرعي", "Forensic Medicine"],
  ["execution", "التنفيذ والقضاء", "Execution & Enforcement"],
  ["prisons", "السجون والإصلاح", "Prisons / Correction"],
  ["police", "الشرطة والأدلة الجنائية", "Police / Criminal Investigation"],
  ["real-estate", "الشهر العقاري", "Real Estate Registration"],
  ["notary", "التوثيق", "Notary / Documentation"],
  ["land-registry", "المساحة", "Land Registry / Survey"],
  ["real-estate-tax", "ضريبة العقارات", "Real Estate Tax"],
  ["commercial-registry", "السجل التجاري", "Commercial Registry"],
  ["chambers-commerce", "غرف التجارة", "Chambers of Commerce"],
  ["gafi", "الاستثمار (الهيئة العامة)", "GAFI / Investment"],
  ["fra", "الرقابة المالية", "FRA / Financial Regulation"],
  ["egx", "البورصة المصرية", "Egyptian Exchange"],
  ["industrial-dev", "التنمية الصناعية", "Industrial Development"],
  ["export-import", "الصادرات والواردات", "Export & Import Control"],
  ["customs", "الجمارك", "Customs"],
  ["tax", "مصلحة الضرائب", "Tax Authority"],
  ["social-insurance", "التأمينات الاجتماعية", "Social Insurance"],
  ["labour", "القوى العاملة", "Labour"],
  ["civil-status", "الأحوال المدنية", "Civil Status"],
  ["passports", "الجوازات والهجرة", "Passports / Immigration"],
  ["traffic", "المرور", "Traffic"],
  ["bar", "نقابة المحامين", "Bar Association"],
  ["local-gov", "الإدارة المحلية", "Local Government"],
  ["districts-cities", "الأحياء والمدن", "Districts / Cities"],
  ["building-licensing", "البناء والتراخيص", "Building / Planning / Licensing"],
  ["state-property", "أملاك الدولة", "State Property"],
  ["utilities", "المرافق", "Utilities"],
  ["environment", "البيئة", "Environment"],
  ["agriculture", "الزراعة", "Agriculture"],
  ["consumer-protection", "حماية المستهلك", "Consumer Protection"],
  ["competition", "جهاز حماية المنافسة", "Competition Authority"],
  ["ip", "الملكية الفكرية", "Intellectual Property"],
  ["medical-committees", "اللجان الطبية الرسمية", "Medical / Official Committees"],
  ["gov-hospitals", "المستشفيات الحكومية", "Government Hospitals"],
  ["postal", "البريد الحكومي", "Government Postal Services"],
  ["ports-airports", "الموانئ والمطارات", "Ports / Airports"],
  ["service-centers", "مراكز خدمة المواطنين", "Government Service Centers"],
  ["other", "جهات أخرى", "Other Authorities"],
];

// ======================= 28 خدمة =======================
export const GENERAL_SERVICES: string[] = [
  "عمل توكيل", "توثيق مستندات", "تسجيل شركة", "استخراج سجل تجاري", "رفع دعوى قضائية",
  "حضور جلسة", "تنفيذ حكم", "تسجيل عقار", "تسجيل ضريبي", "تقديم إقرار ضريبي",
  "خدمات تأمينات", "استخراج بطاقة رقم قومي", "استخراج شهادة ميلاد", "استخراج شهادة وفاة",
  "توثيق زواج", "توثيق طلاق", "إصدار جواز سفر", "ترخيص مركبة", "رخصة قيادة",
  "استشارة قانونية", "تقرير طبي شرعي", "رأي خبير", "تنفيذ إخلاء", "تعديل شركة",
  "ترخيص استثمار", "تخليص جمركي", "ترخيص بناء", "تصحيح بيانات",
];
