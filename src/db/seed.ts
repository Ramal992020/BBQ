import { db } from "./index";
import { menuItems, users } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export type SeedMenuItem = {
  code: string;
  name: string;
  category: string;
  description: string;
  price: number;
  featured?: boolean;
};

const CATEGORY_IMAGES: Record<string, string> = {
  "برجر فحم": "/menu/charcoal-burger.jpg",
  "تشكن برجر": "/menu/chicken-burger.jpg",
  "سماش برجر": "/menu/smash-burger.jpg",
  وجبات: "/menu/meals-platter.jpg",
  "رول بطاطس": "/menu/potato-roll.jpg",
  بطاطس: "/menu/loaded-fries.jpg",
  "رول ساندوتش": "/menu/wrap-sandwich.jpg",
};

const MENU_SEED: SeedMenuItem[] = [
  // برجر فحم
  {
    code: "BRG-SGL-001",
    name: "برجر فحم سنجل",
    category: "برجر فحم",
    description: "150 جرام برجر لحم - خس، خيار مخلل، طماطم، موتزاريلا، ميكس صوصات مع البطاطس",
    price: 150,
    featured: true,
  },
  {
    code: "BRG-DBL-002",
    name: "برجر فحم دابل",
    category: "برجر فحم",
    description: "300 جرام برجر لحم - خس، خيار مخلل، طماطم، موتزاريلا، ميكس صوصات مع البطاطس",
    price: 200,
    featured: true,
  },
  // تشكن برجر
  {
    code: "CHK-KNT-003",
    name: "كنتوك",
    category: "تشكن برجر",
    description: "قطعة صدور فرش - خس - بيج تستي - طماطم - خيار مخلل - كاتشب - جبنه - موتزاريلا - بطاطس",
    price: 130,
  },
  {
    code: "CHK-RNS-004",
    name: "تشيكن رانش",
    category: "تشكن برجر",
    description: "قطعة صدور كرسبي متبلة - صوص رانش - موتزاريلا، خس، خيار مخلل، صوصات مميزة",
    price: 140,
  },
  {
    code: "CHK-MRS-005",
    name: "مارشملو تشيكن",
    category: "تشكن برجر",
    description: "قطعة صدور كرسبي متبلة مع كريمي مشروم - خس - موتزاريلا - خيار مخلل وصوصات مميزة",
    price: 150,
  },
  {
    code: "CHK-MZJ-006",
    name: "مايتى زنجر",
    category: "تشكن برجر",
    description: "قطعتين صدور فريش - خس - بيج تستي - طماطم - خيار مخلل - كاتشب - جبنه - موتزاريلا - بطاطس",
    price: 200,
    featured: true,
  },
  {
    code: "CHK-KNG-007",
    name: "تشيكن كنج",
    category: "تشكن برجر",
    description: "4 قطع صدور تندر - خس - بيج تستي - طماطم - خيار مخلل - كاتشب - جبنه - موتزاريلا - بطاطس",
    price: 200,
  },
  {
    code: "CHK-MIX-008",
    name: "برجر ميكس",
    category: "تشكن برجر",
    description: "قطعة بيف برجر مشوية علي الفحم مع قطعة صدور فراخ - خس - خيار مخلل - موتزاريلا - ميكس صوصات - بطاطس",
    price: 200,
    featured: true,
  },
  // سماش برجر
  {
    code: "SMS-ORG-S",
    name: "أوريجينال سنجل",
    category: "سماش برجر",
    description: "سماش برجر - خس - بيج تستي - بصل مكرمل - موتزاريلا - خيار مخلل - باربيكيو - جبنه - بطاطس",
    price: 120,
  },
  {
    code: "SMS-ORG-D",
    name: "أوريجينال دابل",
    category: "سماش برجر",
    description: "سندوتش أوريجينال دابل بقطعتين لحم",
    price: 150,
  },
  {
    code: "SMS-ORG-T",
    name: "أوريجينال تريبل",
    category: "سماش برجر",
    description: "سندوتش أوريجينال تريبل بثلاث قطع لحم",
    price: 180,
  },
  {
    code: "SMS-MSH-S",
    name: "مشروم سنجل",
    category: "سماش برجر",
    description: "سماش برجر - ماشروم كريمي - بصل مكرمل - موتزاريلا - خس - بيج تستي - خيار مخلل - باربيكيو - جبنه - بطاطس",
    price: 140,
  },
  {
    code: "SMS-MSH-D",
    name: "مشروم دابل",
    category: "سماش برجر",
    description: "سندوتش مشروم دابل",
    price: 170,
  },
  {
    code: "SMS-MSH-T",
    name: "مشروم تريبل",
    category: "سماش برجر",
    description: "سندوتش مشروم تريبل",
    price: 200,
  },
  {
    code: "SMS-ITL-S",
    name: "إيطاليانو سنجل",
    category: "سماش برجر",
    description: "سماش برجر - خلطة إيطالي - خس - بيج تستي - باربيكيو - بصل مكرمل - موتزاريلا - خيار مخلل - جبنه - بطاطس",
    price: 140,
  },
  {
    code: "SMS-ITL-D",
    name: "إيطاليانو دابل",
    category: "سماش برجر",
    description: "سندوتش إيطاليانو دابل",
    price: 170,
  },
  {
    code: "SMS-ITL-T",
    name: "إيطاليانو تريبل",
    category: "سماش برجر",
    description: "سندوتش إيطاليانو تريبل",
    price: 200,
  },
  {
    code: "SMS-SPR-S",
    name: "سوبريم سنجل",
    category: "سماش برجر",
    description: "سماش برجر - بيف بيكون - خس - خيار مخلل - بصل مكرمل - موتزاريلا - صوصات مميزة",
    price: 140,
  },
  {
    code: "SMS-SPR-D",
    name: "سوبريم دابل",
    category: "سماش برجر",
    description: "سندوتش سوبريم دابل",
    price: 170,
  },
  {
    code: "SMS-SPR-T",
    name: "سوبريم تريبل",
    category: "سماش برجر",
    description: "سندوتش سوبريم تريبل",
    price: 200,
    featured: true,
  },
  // وجبات
  {
    code: "MAL-KFT-025",
    name: "وجبة كفتة",
    category: "وجبات",
    description: "6 قطع كفتة - أرز بسمتي مبهر - بطاطس - طحينه - مخلل",
    price: 170,
  },
  {
    code: "MAL-SHT-026",
    name: "وجبة شيش طاووق",
    category: "وجبات",
    description: "6 قطع شيش مع الخضار المشوي - أرز بسمتي مبهر - بطاطس محمرة - طحينة - مخلل",
    price: 190,
  },
  {
    code: "MAL-SDR-027",
    name: "وجبة صدور مشوية",
    category: "وجبات",
    description: "250 جرام صدور مشوية ومتبلة - أرز بسمتي مبهر - بطاطس محمرة - طحينة - مخلل",
    price: 220,
    featured: true,
  },
  {
    code: "MAL-STR-028",
    name: "وجبة ستربس",
    category: "وجبات",
    description: "4 قطع ستربس - أرز بسمتي مبهر - بطاطس محمرة - صوص من اختيارك - مخلل",
    price: 180,
  },
  {
    code: "MAL-MIX-029",
    name: "ميكس جريل",
    category: "وجبات",
    description: "2 قطعة كفتة، 2 شيش طاووق، 2 سجق مشوي، 2 كبدة ستيك - أرز بسمتي مبهر - بطاطس محمرة - طحينة - مخلل",
    price: 240,
    featured: true,
  },
  // رول بطاطس
  {
    code: "POT-ROL-TBL",
    name: "رول بطاطس توابل",
    category: "رول بطاطس",
    description: "رول بطاطس متبل بالتوابل الخاصة",
    price: 45,
  },
  {
    code: "POT-ROL-KTC",
    name: "رول بطاطس كاتشب ومايونيز",
    category: "رول بطاطس",
    description: "رول بطاطس بصوص الكاتشب والمايونيز",
    price: 55,
  },
  {
    code: "POT-ROL-SHD",
    name: "رول بطاطس شيدر",
    category: "رول بطاطس",
    description: "رول بطاطس بجبنة الشيدر الذائبة",
    price: 65,
  },
  // بطاطس
  {
    code: "POT-TBL-033",
    name: "بطاطس توابل",
    category: "بطاطس",
    description: "بطاطس مقرمشة متبلة",
    price: 40,
  },
  {
    code: "POT-KTC-034",
    name: "بطاطس كاتشب مايونيز",
    category: "بطاطس",
    description: "بطاطس بصوص الكاتشب والمايونيز",
    price: 50,
  },
  {
    code: "POT-BBQ-035",
    name: "بطاطس باربيكيو",
    category: "بطاطس",
    description: "بطاطس بصوص الباربيكيو",
    price: 60,
  },
  {
    code: "POT-SHD-036",
    name: "بطاطس شيدر",
    category: "بطاطس",
    description: "بطاطس بصوص الشيدر",
    price: 60,
  },
  {
    code: "POT-MJX-037",
    name: "بطاطس ميكس جبن",
    category: "بطاطس",
    description: "بطاطس بخلطة الأجبان",
    price: 70,
  },
  {
    code: "POT-LDD-038",
    name: "لوديد فرايز",
    category: "بطاطس",
    description: "بطاطس محملة باللحم المفروم والأجبان والصوصات",
    price: 120,
    featured: true,
  },
  {
    code: "POT-STR-039",
    name: "ستربس فرايز",
    category: "بطاطس",
    description: "بطاطس مع قطع الستربس المقرمشة والأجبان",
    price: 120,
    featured: true,
  },
  // رول ساندوتش
  {
    code: "ROL-KFT-040",
    name: "رول كفتة",
    category: "رول ساندوتش",
    description: "بقدونس - طماطم - خيار مخلل - طحينه",
    price: 90,
  },
  {
    code: "ROL-SGQ-041",
    name: "رول سجق شرقي",
    category: "رول ساندوتش",
    description: "بقدونس - طماطم - خيار مخلل - طحينه",
    price: 90,
  },
  {
    code: "ROL-SQI-042",
    name: "رول سجق إيطالي",
    category: "رول ساندوتش",
    description: "خلطة إيطالي - جبنة شيدر - موتزاريلا",
    price: 100,
  },
  {
    code: "ROL-KBD-043",
    name: "رول كبدة ستيك",
    category: "رول ساندوتش",
    description: "طحينة - بقدونس - دبس رمان",
    price: 90,
  },
  {
    code: "ROL-SHT-044",
    name: "رول شيش طاووق",
    category: "رول ساندوتش",
    description: "خس - مايونيز - باربيكيو - جبنه - موتزاريلا",
    price: 100,
  },
  {
    code: "ROL-SDR-045",
    name: "رول صدور مشوية",
    category: "رول ساندوتش",
    description: "خس - مايونيز - كاتشب - خيار مخلل - جبنه - موتزاريلا",
    price: 120,
  },
  {
    code: "ROL-TRB-046",
    name: "رول طرب",
    category: "رول ساندوتش",
    description: "بقدونس - طماطم - خيار مخلل - طحينه",
    price: 130,
  },
  {
    code: "ROL-HDC-047",
    name: "هوت دوج كلاسيك",
    category: "رول ساندوتش",
    description: "كاتشب - مايونيز - خيار مخلل",
    price: 70,
  },
  {
    code: "ROL-HDJ-048",
    name: "هوت دوج بالجبنة",
    category: "رول ساندوتش",
    description: "خس - خيار مخلل - جبنة - موتزاريلا",
    price: 80,
  },
  {
    code: "ROL-STR-049",
    name: "رول ستربس",
    category: "رول ساندوتش",
    description: "خس - مايونيز - كاتشب - جبنه - موتزاريلا",
    price: 100,
  },
  {
    code: "ROL-LHM-050",
    name: "رول لحمة ستيك",
    category: "رول ساندوتش",
    description: "شرائح لحمة ستيك مشوية - صوصات مميزة - موتزاريلا",
    price: 130,
    featured: true,
  },
];

export async function seedMenu() {
  const existing = await db.select().from(menuItems).limit(1);
  if (existing.length > 0) {
    console.log(`Menu already seeded (${existing.length} items found). Skipping.`);
    return;
  }
  for (const item of MENU_SEED) {
    const img = CATEGORY_IMAGES[item.category] || "/menu/hero-bbq.jpg";
    await db.insert(menuItems).values({
      code: item.code,
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price.toString(),
      available: true,
      featured: item.featured ?? false,
      image: img,
    });
  }
  console.log(`Seeded ${MENU_SEED.length} menu items.`);
}

export async function seedAdmin() {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@bbq.com"))
    .limit(1);
  if (existing.length > 0) {
    console.log("Admin user already exists.");
    return;
  }
  const hashed = await bcrypt.hash("admin123", 10);
  await db.insert(users).values({
    name: "المدير العام",
    email: "admin@bbq.com",
    password: hashed,
    role: "admin",
    active: true,
    phone: "01220785729",
  });
  console.log("Created admin user: admin@bbq.com / admin123");
}

export async function seedAll() {
  await seedMenu();
  await seedAdmin();
}

// Allow running directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log("Seeding complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}
