import type { Category, MenuItem, OptionGroup, Tenant, FeatureFlags } from "../types";

/** Sample data only. Photos load from Unsplash; a branded placeholder shows if one fails. */
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=70`;

export const ALL_FEATURES: FeatureFlags = {
  ordering: true,
  amharic: true,
  photos: true,
  filters: true,
  upselling: true,
  liveSoldOut: true,
  callWaiter: true,
  analytics: true,
  orderNotes: true,
};

export const TENANTS: Tenant[] = [
  {
    slug: "tsehay-coffee",
    name: { en: "Abol Coffee House", am: "አቦል ቡና ቤት" },
    tagline: { en: "Coffee, breakfast and fasting food in Bole", am: "ቡና፣ ቁርስ እና የጾም ምግብ በቦሌ" },
    type: "cafe",
    address: "Bole, Addis Ababa",
    phone: "+251 900 000 000",
    currency: "ETB",
    tables: 12,
    serviceChargePct: 10,
    vatPct: 15,
    owner: { email: "owner@abol.demo", password: "demo1234" },
    features: { ...ALL_FEATURES },
    plan: "growth",
    appearance: { theme: "espresso", headings: "serif", layout: "list", corners: "soft" },
  },
  {
    slug: "buna-corner",
    name: { en: "Lomi Café", am: "ሎሚ ካፌ" },
    tagline: { en: "A small café on the Starter plan: view-only menu", am: "ትንሽ ካፌ፦ ለማየት ብቻ የሆነ ምናሌ" },
    type: "cafe",
    address: "Piassa, Addis Ababa",
    phone: "+251 900 000 001",
    currency: "ETB",
    tables: 4,
    serviceChargePct: 0,
    vatPct: 15,
    owner: { email: "owner@lomicafe.demo", password: "demo1234" },
    features: { ...ALL_FEATURES, ordering: false, upselling: false, callWaiter: false, analytics: false, orderNotes: false },
    plan: "starter",
    appearance: { theme: "emerald", headings: "sans", layout: "grid", corners: "round" },
  },
];

export const CATEGORIES: Category[] = [
  { id: "coffee", name: { en: "Coffee", am: "ቡና" }, icon: "☕" },
  { id: "tea", name: { en: "Tea & hot drinks", am: "ሻይ እና ትኩስ መጠጦች" }, icon: "🫖" },
  { id: "juice", name: { en: "Fresh juices", am: "ትኩስ ጭማቂ" }, icon: "🥑" },
  { id: "breakfast", name: { en: "Breakfast", am: "ቁርስ" }, icon: "🍳" },
  { id: "fasting", name: { en: "Fasting dishes", am: "የጾም ምግቦች" }, icon: "🌿" },
  { id: "mains", name: { en: "Burgers & mains", am: "በርገር እና ዋና ምግቦች" }, icon: "🍔" },
  { id: "bakery", name: { en: "Cakes & bakery", am: "ኬክ እና ዳቦ" }, icon: "🍰" },
];

const size = (small: number, large: number): OptionGroup => ({
  id: "size",
  name: { en: "Size", am: "መጠን" },
  type: "single",
  required: true,
  choices: [
    { id: "regular", name: { en: "Regular", am: "መደበኛ" }, priceDelta: small },
    { id: "large", name: { en: "Large", am: "ትልቅ" }, priceDelta: large },
  ],
});

const milk: OptionGroup = {
  id: "milk",
  name: { en: "Milk", am: "ወተት" },
  type: "single",
  required: true,
  choices: [
    { id: "cow", name: { en: "Fresh cow milk", am: "የላም ወተት" }, priceDelta: 0 },
    { id: "oat", name: { en: "Oat milk (fasting)", am: "የአጃ ወተት (ጾም)" }, priceDelta: 40, makesFasting: true },
  ],
};

const coffeeExtras: OptionGroup = {
  id: "extras",
  name: { en: "Extras", am: "ተጨማሪ" },
  type: "multi",
  max: 3,
  choices: [
    { id: "shot", name: { en: "Extra espresso shot", am: "ተጨማሪ ኤስፕሬሶ" }, priceDelta: 25 },
    { id: "nosugar", name: { en: "No sugar", am: "ያለ ስኳር" }, priceDelta: 0 },
    { id: "cinnamon", name: { en: "Cinnamon on top", am: "ቀረፋ" }, priceDelta: 10 },
  ],
};

const fatOption: OptionGroup = {
  id: "fat",
  name: { en: "Cooked with", am: "የሚበስልበት" },
  type: "single",
  required: true,
  choices: [
    { id: "butter", name: { en: "Spiced butter (niter kibbeh)", am: "ቅቤ" }, priceDelta: 0 },
    { id: "oil", name: { en: "Oil (fasting)", am: "ዘይት (ጾም)" }, priceDelta: 0, makesFasting: true },
  ],
};

export const ITEMS: MenuItem[] = [
  // Coffee
  {
    id: "macchiato", categoryId: "coffee", price: 70, photo: u("photo-1557006021-b85faa2bc5e2"),
    name: { en: "Macchiato", am: "ማኪያቶ" },
    description: { en: "Our signature espresso with steamed milk, made light, regular or dark the Addis way.", am: "ፊርማችን የሆነ ኤስፕሬሶ ከወተት ጋር፤ ቀላል፣ መደበኛ ወይም ጠቆር ያለ።" },
    tags: ["popular"], allergens: ["dairy"], fastingOption: true, soldOut: false, prepMinutes: 4,
    options: [
      { id: "style", name: { en: "Strength", am: "ጥንካሬ" }, type: "single", required: true, choices: [
        { id: "light", name: { en: "Light (more milk)", am: "ቀላል" }, priceDelta: 0 },
        { id: "regular", name: { en: "Regular", am: "መደበኛ" }, priceDelta: 0 },
        { id: "dark", name: { en: "Dark (more coffee)", am: "ጠቆር ያለ" }, priceDelta: 0 },
      ] },
      size(0, 20), milk, coffeeExtras,
    ],
    pairsWith: ["croissant", "chechebsa", "chocolate-cake"],
  },
  {
    id: "jebena", categoryId: "coffee", price: 50, photo: u("photo-1610632380989-680fe40816c6"),
    name: { en: "Jebena buna", am: "የጀበና ቡና" },
    description: { en: "Traditional coffee from the clay pot, roasted and brewed fresh, served with frankincense.", am: "በጀበና የተፈላ ባህላዊ ቡና፣ ከእጣን ጋር።" },
    tags: ["fasting", "popular"], allergens: [], soldOut: false, prepMinutes: 6,
    options: [
      { id: "add", name: { en: "Add to your cup", am: "ወደ ስኒዎ ይጨምሩ" }, type: "multi", choices: [
        { id: "tenadam", name: { en: "Tena adam (rue)", am: "ጤና አዳም" }, priceDelta: 0 },
        { id: "butter", name: { en: "Spoon of butter", am: "ቅቤ" }, priceDelta: 15 },
      ] },
      { id: "side", name: { en: "On the side", am: "ከጎን" }, type: "multi", choices: [
        { id: "kolo", name: { en: "Kolo (roasted barley)", am: "ቆሎ" }, priceDelta: 30 },
        { id: "popcorn", name: { en: "Popcorn", am: "ፈንድሻ" }, priceDelta: 25 },
      ] },
    ],
    pairsWith: ["kinche", "fetira"],
  },
  {
    id: "cappuccino", categoryId: "coffee", price: 90, photo: u("photo-1572442388796-11668a67e53d"),
    name: { en: "Cappuccino", am: "ካፑቺኖ" },
    description: { en: "Double espresso with thick milk foam.", am: "ድርብ ኤስፕሬሶ ከወፍራም የወተት አረፋ ጋር።" },
    tags: [], allergens: ["dairy"], fastingOption: true, soldOut: false, prepMinutes: 4,
    options: [size(0, 25), milk, coffeeExtras],
    pairsWith: ["croissant", "chocolate-cake"],
  },
  {
    id: "espresso", categoryId: "coffee", price: 55, photo: u("photo-1510591509098-f4fdc6d0ff04"),
    name: { en: "Espresso", am: "ኤስፕሬሶ" },
    description: { en: "A short, strong shot of single-origin Yirgacheffe.", am: "አጭር እና ጠንካራ የይርጋጨፌ ኤስፕሬሶ።" },
    tags: ["fasting"], allergens: [], soldOut: false, prepMinutes: 2,
    options: [{ id: "shots", name: { en: "Shots", am: "መጠን" }, type: "single", required: true, choices: [
      { id: "single", name: { en: "Single", am: "ነጠላ" }, priceDelta: 0 },
      { id: "double", name: { en: "Double", am: "ድርብ" }, priceDelta: 30 },
    ] }],
    pairsWith: ["chocolate-cake"],
  },
  // Tea
  {
    id: "shai", categoryId: "tea", price: 40, photo: u("photo-1597318181409-cf64d0b5d8a2"),
    name: { en: "Spiced tea", am: "ቅመም ሻይ" },
    description: { en: "Black tea brewed with your choice of spices.", am: "በመረጡት ቅመም የተፈላ ሻይ።" },
    tags: ["fasting"], allergens: [], soldOut: false, prepMinutes: 3,
    options: [{ id: "spice", name: { en: "Spice", am: "ቅመም" }, type: "multi", max: 2, choices: [
      { id: "ginger", name: { en: "Ginger", am: "ዝንጅብል" }, priceDelta: 0 },
      { id: "cinnamon", name: { en: "Cinnamon", am: "ቀረፋ" }, priceDelta: 0 },
      { id: "clove", name: { en: "Clove", am: "ቅርንፉድ" }, priceDelta: 0 },
    ] }, { id: "lemon", name: { en: "Extras", am: "ተጨማሪ" }, type: "multi", choices: [
      { id: "lemon", name: { en: "Lemon", am: "ሎሚ" }, priceDelta: 5 },
      { id: "honey", name: { en: "Honey", am: "ማር" }, priceDelta: 20 },
    ] }],
    pairsWith: ["fetira", "croissant"],
  },
  {
    id: "milk-tea", categoryId: "tea", price: 55, photo: u("photo-1571934811356-5cc061b6821f"),
    name: { en: "Milk tea", am: "የወተት ሻይ" },
    description: { en: "Tea simmered in fresh milk.", am: "በትኩስ ወተት የተፈላ ሻይ።" },
    tags: [], allergens: ["dairy"], fastingOption: true, soldOut: false, prepMinutes: 4,
    options: [milk],
    pairsWith: ["kinche"],
  },
  // Juice
  {
    id: "avocado", categoryId: "juice", price: 160, photo: u("photo-1623065422902-30a2d299bbe4"),
    name: { en: "Avocado juice", am: "የአቮካዶ ጭማቂ" },
    description: { en: "Thick avocado blended fresh, with lime and a drizzle of syrup.", am: "ወፍራም የአቮካዶ ጭማቂ ከሎሚ ጋር።" },
    tags: ["fasting", "popular"], allergens: [], soldOut: false, prepMinutes: 5,
    options: [size(0, 50), { id: "sweet", name: { en: "Sweetness", am: "ጣፋጭነት" }, type: "single", required: true, choices: [
      { id: "normal", name: { en: "Normal", am: "መደበኛ" }, priceDelta: 0 },
      { id: "less", name: { en: "Less sugar", am: "አነስተኛ ስኳር" }, priceDelta: 0 },
      { id: "none", name: { en: "No sugar", am: "ያለ ስኳር" }, priceDelta: 0 },
    ] }],
    pairsWith: ["ful", "chechebsa"],
  },
  {
    id: "spris", categoryId: "juice", price: 180, photo: u("photo-1600271886742-f049cd451bba"),
    name: { en: "Spris", am: "ስፕሪስ" },
    description: { en: "Layered avocado, mango and papaya juice. A café classic.", am: "በንብርብር የተዘጋጀ አቮካዶ፣ ማንጎ እና ፓፓያ።" },
    tags: ["fasting", "new"], allergens: [], soldOut: false, prepMinutes: 6,
    options: [size(0, 50)],
    pairsWith: ["club", "burger"],
  },
  {
    id: "mango", categoryId: "juice", price: 150, photo: u("photo-1546173159-315724a31696"),
    name: { en: "Mango juice", am: "የማንጎ ጭማቂ" },
    description: { en: "Fresh Ethiopian mango, nothing added.", am: "ትኩስ የኢትዮጵያ ማንጎ።" },
    tags: ["fasting"], allergens: [], soldOut: true, prepMinutes: 4,
    options: [size(0, 40)],
    pairsWith: ["club"],
  },
  // Breakfast
  {
    id: "chechebsa", categoryId: "breakfast", price: 280, photo: u("photo-1567620905732-2d1ec7ab7445"),
    name: { en: "Chechebsa", am: "ጨጨብሳ" },
    description: { en: "Torn flatbread tossed in berbere and spiced butter, served with honey and yogurt.", am: "በበርበሬ እና በቅቤ የተለወሰ ቂጣ፣ ከማር እና እርጎ ጋር።" },
    tags: ["popular"], allergens: ["gluten", "dairy"], fastingOption: true, soldOut: false, prepMinutes: 12,
    options: [fatOption, { id: "top", name: { en: "Toppings", am: "ተጨማሪ" }, type: "multi", choices: [
      { id: "honey", name: { en: "Extra honey", am: "ተጨማሪ ማር" }, priceDelta: 30 },
      { id: "egg", name: { en: "Fried egg", am: "የተጠበሰ እንቁላል" }, priceDelta: 40 },
      { id: "yogurt", name: { en: "Extra yogurt", am: "ተጨማሪ እርጎ" }, priceDelta: 30 },
    ] }],
    pairsWith: ["macchiato", "avocado"],
  },
  {
    id: "firfir", categoryId: "breakfast", price: 250, photo: u("photo-1504674900247-0877df9cc836"),
    name: { en: "Firfir", am: "ፍርፍር" },
    description: { en: "Injera or bread soaked in spicy berbere sauce.", am: "በበርበሬ ወጥ የተለወሰ እንጀራ ወይም ዳቦ።" },
    tags: ["spicy"], allergens: ["gluten"], fastingOption: true, soldOut: false, prepMinutes: 10,
    options: [
      { id: "base", name: { en: "Made with", am: "የሚዘጋጀው በ" }, type: "single", required: true, choices: [
        { id: "injera", name: { en: "Injera", am: "እንጀራ" }, priceDelta: 0 },
        { id: "bread", name: { en: "Bread", am: "ዳቦ" }, priceDelta: 0 },
      ] },
      fatOption,
      { id: "top", name: { en: "Add", am: "ይጨምሩ" }, type: "multi", choices: [
        { id: "egg", name: { en: "Egg", am: "እንቁላል" }, priceDelta: 40 },
        { id: "meat", name: { en: "Beef (quanta)", am: "ቋንጣ" }, priceDelta: 120 },
      ] },
    ],
    pairsWith: ["macchiato", "shai"],
  },
  {
    id: "ful", categoryId: "breakfast", price: 220, photo: u("photo-1547496502-affa22d38842"),
    name: { en: "Special ful", am: "ስፔሻል ፉል" },
    description: { en: "Mashed fava beans with tomato, onion, green chilli and olive oil, served with fresh bread.", am: "የተፈጨ ባቄላ ከቲማቲም፣ ሽንኩርት እና ቃሪያ ጋር፣ ከትኩስ ዳቦ ጋር።" },
    tags: ["fasting", "popular"], allergens: ["gluten"], soldOut: false, prepMinutes: 8,
    options: [{ id: "top", name: { en: "Add", am: "ይጨምሩ" }, type: "multi", choices: [
      { id: "egg", name: { en: "Egg (not fasting)", am: "እንቁላል (የፍስክ)" }, priceDelta: 40 },
      { id: "yogurt", name: { en: "Yogurt (not fasting)", am: "እርጎ (የፍስክ)" }, priceDelta: 30 },
      { id: "bread", name: { en: "Extra bread", am: "ተጨማሪ ዳቦ" }, priceDelta: 20 },
    ] }],
    pairsWith: ["avocado", "shai"],
  },
  {
    id: "kinche", categoryId: "breakfast", price: 200, photo: u("photo-1517093728432-a0440f8d45af"),
    name: { en: "Kinche", am: "ቅንጬ" },
    description: { en: "Cracked wheat porridge with spiced butter.", am: "በቅቤ የተሰራ ቅንጬ።" },
    tags: [], allergens: ["gluten", "dairy"], fastingOption: true, soldOut: false, prepMinutes: 8,
    options: [fatOption],
    pairsWith: ["jebena", "milk-tea"],
  },
  {
    id: "fetira", categoryId: "breakfast", price: 260, photo: u("photo-1528207776546-365bb710ee93"),
    name: { en: "Fetira", am: "ፈጢራ" },
    description: { en: "Flaky layered pastry with egg, finished with honey.", am: "በእንቁላል የተሰራ ፈጢራ ከማር ጋር።" },
    tags: [], allergens: ["gluten", "egg", "dairy"], soldOut: false, prepMinutes: 12,
    options: [{ id: "top", name: { en: "Add", am: "ይጨምሩ" }, type: "multi", choices: [
      { id: "honey", name: { en: "Extra honey", am: "ተጨማሪ ማር" }, priceDelta: 30 },
    ] }],
    pairsWith: ["jebena", "shai"],
  },
  // Fasting
  {
    id: "beyaynetu", categoryId: "fasting", price: 320, photo: u("photo-1541518763669-27fef04b14ea"),
    name: { en: "Beyaynetu", am: "በያይነቱ" },
    description: { en: "A colourful fasting platter: misir, shiro, gomen, tikil gomen and salad on injera.", am: "በእንጀራ ላይ ምስር፣ ሽሮ፣ ጎመን፣ ጥቅል ጎመን እና ሰላጣ።" },
    tags: ["fasting", "vegetarian", "popular"], allergens: [], soldOut: false, prepMinutes: 10,
    options: [{ id: "injera", name: { en: "Injera", am: "እንጀራ" }, type: "single", required: true, choices: [
      { id: "teff", name: { en: "Pure teff", am: "ንጹህ ጤፍ" }, priceDelta: 30 },
      { id: "mixed", name: { en: "Mixed", am: "ድብልቅ" }, priceDelta: 0 },
    ] }],
    pairsWith: ["spris", "avocado"],
  },
  {
    id: "shiro", categoryId: "fasting", price: 240, photo: u("photo-1455619452474-d2be8b1e70cd"),
    name: { en: "Shiro tegabino", am: "ሽሮ ተጋቢኖ" },
    description: { en: "Bubbling chickpea stew served in a clay pot with injera.", am: "በሸክላ ድስት የሚቀርብ ሽሮ ከእንጀራ ጋር።" },
    tags: ["fasting", "vegetarian", "spicy"], allergens: [], soldOut: false, prepMinutes: 9,
    options: [{ id: "heat", name: { en: "Spice level", am: "የቅመም መጠን" }, type: "single", required: true, choices: [
      { id: "mild", name: { en: "Mild", am: "ቀላል" }, priceDelta: 0 },
      { id: "hot", name: { en: "Hot", am: "ቅመም የበዛ" }, priceDelta: 0 },
    ] }],
    pairsWith: ["mango", "spris"],
  },
  // Mains
  {
    id: "burger", categoryId: "mains", price: 450, photo: u("photo-1568901346375-23c9450c58cd"),
    name: { en: "Tsehay burger", am: "ፀሐይ በርገር" },
    description: { en: "Grilled beef patty, tomato, lettuce and house sauce, with fries.", am: "የተጠበሰ የበሬ ሥጋ፣ ቲማቲም፣ ሰላጣ እና ልዩ ሶስ፣ ከድንች ጋር።" },
    tags: ["popular"], allergens: ["gluten", "egg"], soldOut: false, prepMinutes: 15,
    options: [
      { id: "extras", name: { en: "Make it bigger", am: "ተጨማሪ" }, type: "multi", choices: [
        { id: "cheese", name: { en: "Extra cheese", am: "ተጨማሪ ቺዝ" }, priceDelta: 60 },
        { id: "patty", name: { en: "Extra patty", am: "ተጨማሪ ሥጋ" }, priceDelta: 150 },
        { id: "egg", name: { en: "Fried egg", am: "እንቁላል" }, priceDelta: 40 },
      ] },
      { id: "side", name: { en: "Side", am: "ከጎን" }, type: "single", required: true, choices: [
        { id: "fries", name: { en: "Fries", am: "ድንች ጥብስ" }, priceDelta: 0 },
        { id: "salad", name: { en: "Salad", am: "ሰላጣ" }, priceDelta: 0 },
      ] },
    ],
    pairsWith: ["spris", "avocado"],
  },
  {
    id: "club", categoryId: "mains", price: 420, photo: u("photo-1528735602780-2552fd46c7af"),
    name: { en: "Club sandwich", am: "ክለብ ሳንድዊች" },
    description: { en: "Toasted triple-decker with chicken, egg, cheese and vegetables.", am: "ዶሮ፣ እንቁላል፣ ቺዝ እና አትክልት ያለው ሳንድዊች።" },
    tags: [], allergens: ["gluten", "egg", "dairy"], soldOut: false, prepMinutes: 12,
    options: [{ id: "side", name: { en: "Side", am: "ከጎን" }, type: "single", required: true, choices: [
      { id: "fries", name: { en: "Fries", am: "ድንች ጥብስ" }, priceDelta: 0 },
      { id: "salad", name: { en: "Salad", am: "ሰላጣ" }, priceDelta: 0 },
    ] }],
    pairsWith: ["mango", "spris"],
  },
  {
    id: "pizza", categoryId: "mains", price: 520, photo: u("photo-1574071318508-1cdbab80d002"),
    name: { en: "Margherita pizza", am: "ማርጋሪታ ፒዛ" },
    description: { en: "Tomato, mozzarella and fresh basil on a thin crust.", am: "ቲማቲም፣ ሞዛሬላ እና ባሲል በቀጭን ሊጥ።" },
    tags: ["vegetarian"], allergens: ["gluten", "dairy"], soldOut: false, prepMinutes: 18,
    options: [size(0, 180), { id: "extras", name: { en: "Extras", am: "ተጨማሪ" }, type: "multi", choices: [
      { id: "cheese", name: { en: "Extra cheese", am: "ተጨማሪ ቺዝ" }, priceDelta: 60 },
      { id: "olives", name: { en: "Olives", am: "ወይራ" }, priceDelta: 40 },
      { id: "chilli", name: { en: "Green chilli", am: "ቃሪያ" }, priceDelta: 15 },
    ] }],
    pairsWith: ["spris", "mango"],
  },
  // Bakery
  {
    id: "croissant", categoryId: "bakery", price: 120, photo: u("photo-1555507036-ab1f4038808a"),
    name: { en: "Butter croissant", am: "ክሮሳን" },
    description: { en: "Baked every morning in-house.", am: "በየጠዋቱ እዚሁ የሚጋገር።" },
    tags: ["vegetarian"], allergens: ["gluten", "dairy", "egg"], soldOut: false, prepMinutes: 2,
    options: [{ id: "fill", name: { en: "Filling", am: "ሙሌት" }, type: "single", required: true, choices: [
      { id: "plain", name: { en: "Plain", am: "ተራ" }, priceDelta: 0 },
      { id: "choco", name: { en: "Chocolate", am: "ቸኮሌት" }, priceDelta: 30 },
    ] }],
    pairsWith: ["macchiato", "cappuccino"],
  },
  {
    id: "chocolate-cake", categoryId: "bakery", price: 180, photo: u("photo-1578985545062-69928b1d9587"),
    name: { en: "Chocolate cake", am: "ቸኮሌት ኬክ" },
    description: { en: "Rich three-layer chocolate cake, by the slice.", am: "ባለ ሶስት ንብርብር ቸኮሌት ኬክ።" },
    tags: ["vegetarian"], allergens: ["gluten", "dairy", "egg", "nuts"], soldOut: false, prepMinutes: 2,
    options: [],
    pairsWith: ["macchiato", "espresso"],
  },
];
