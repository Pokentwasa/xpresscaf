/* ============================================================
   XPRESSO — CONTENT DATA
   Source of truth: https://xpressocafe.co.za/
   ============================================================ */

/* ------------------------------------------------------------
   THE PRICE.
   The live site states R10 across the homepage, all testimonials
   and all press quotes. If the menu price changes, change it
   HERE ONLY — it propagates to the hero, the price moment, the
   menu rows, SEO copy and the footer.
   ------------------------------------------------------------ */
const XPRESSO_PRICE = 'R14';

/* ------------------------------------------------------------
   MENU — the full Xpresso range, from the official R14 menu.
   Grouped into categories that render as expandable dropdowns.
   Every item is one price (XPRESSO_PRICE). `icon` maps to the
   drawn icon set in app.js. Items are strings, or {name,note}
   when a tag (e.g. "Vegan") applies.
   ------------------------------------------------------------ */
const MENU = [
  { key:'coffee', title:'Coffees', icon:'coffee', items:[
    'Americano','Espresso','Double Espresso','Cappuccino','Café Latte','Café Mocha',
    'Macchiato','Flat White','Hazelnut Cappuccino','Hazelnut Delight','Toffee Caramel Latte',
    'Toffee Caramel Dream','Hot Chocolate','White Hot Chocolate','Top Deck Hot Chocolate',
    'Salted Caramel Hottie'
  ]},
  { key:'tea', title:'Teas', icon:'tea', items:[
    'Chai Latte','Dirty Chai Latte','Rooibos Tea','Five Roses English Tea'
  ]},
  { key:'pastries', title:'Pastries & More', icon:'croissant', items:[
    'Custard Danish','Apple Danish','Cinnamon Choc Twist','Custard Croissant','Plain Croissant',
    'Custard Copenhagen','Quiches Vegs / Chicken','Pies','Thai Twist','Vetkoek'
  ]},
  { key:'sweet', title:'Sweet Treats & More', icon:'doughnut', items:[
    'Caramel Doughnut','Chocolate Doughnut','Decadent Brownie','Choc Mousse Cronut','Muffins','Hertzoggie'
  ]},
  { key:'sandwiches', title:'Sandwiches', icon:'sandwich', items:[
    'Chicken Salad', { name:'Garlic Knot', note:'Vegan' }
  ]},
  { key:'cold', title:'Cold Drinks & Juices', icon:'cold', items:[
    'Fresh Juice Daily','Canned Drinks','Water: Still / Sparkling','Sparkling Refresher',
    'Popping Boba','Ice Coffee (Ice)','Mango Slushy','Strawberry Slushy'
  ]},
  { key:'other', title:'Other', icon:'beans', items:[
    'Droëwors','Oats Cup'
  ]}
];

/* ------------------------------------------------------------
   LOCATIONS — 8 real stores seeded (Western Cape), each with
   coordinates for the nearest-store engine. Structured with
   province + city + lat/lng so scaling to the full 75+ national
   footprint is just appending objects in this same shape.
   >>> ADD THE REMAINING ~67 STORES BELOW IN THIS EXACT FORMAT. <<<
   ------------------------------------------------------------ */
const LOCATIONS = [
  {
    name:'Durbanville', province:'Western Cape', city:'Durbanville', tag:'Head office',
    lat:-33.8309, lng:18.6469,
    address:'16 Wellington Road, Basol Building, Durbanville',
    phone:'021 975 4209',
    hours:[['Mon – Fri','7am – 6pm'],['Sat','7am – 4pm'],['Sun','8am – 1pm'],['Public holidays','8am – 1pm']]
  },
  {
    name:'Canal Walk', province:'Western Cape', city:'Cape Town', tag:'Mall',
    lat:-33.8916, lng:18.5116,
    address:'Century Blvd, Shop LP7, Upper level, Entrance 12',
    phone:'021 551 0548',
    hours:[['Mon – Fri','8am – 9pm'],['Sat','8am – 9pm'],['Sun','8am – 9pm'],['Public holidays','8am – 9pm']]
  },
  {
    name:'Cape Town CBD', province:'Western Cape', city:'Cape Town', tag:'City',
    lat:-33.9226, lng:18.4213,
    address:'Shop 6, Town Square, 61 Adderley Street, Cape Town',
    phone:'021 422 0437',
    hours:[['Mon – Fri','6:15am – 6pm'],['Sat','7am – 4pm'],['Sun','8am – 1pm'],['Public holidays','8am – 1pm']]
  },
  {
    name:'Cape Gate', province:'Western Cape', city:'Brackenfell', tag:'Mall',
    lat:-33.842, lng:18.696,
    address:'Cape Gate Mall, Cnr Okavango & de Bron, Brackenfell (Woolworths Entrance)',
    phone:'021 981 3057',
    hours:[['Mon – Fri','8am – 8pm'],['Sat','8am – 8pm'],['Sun','8am – 6pm'],['Public holidays','8am – 6pm']]
  },
  {
    name:'Stellenbosch', province:'Western Cape', city:'Stellenbosch', tag:'Mall',
    lat:-33.9369, lng:18.8602,
    address:'Shop 44, Eikestad Mall, Adringa Street, Stellenbosch',
    phone:'021 883 3012',
    hours:[['Mon – Fri','7am – 6pm'],['Sat','7am – 6pm'],['Sun','8am – 2pm'],['Public holidays','7am – 6pm']]
  },
  {
    name:'N1 City', province:'Western Cape', city:'Goodwood', tag:'Mall',
    lat:-33.893, lng:18.557,
    address:'Shop U28B N1 City, Food Court Entrance, Next to RocoMamas',
    phone:'021 595 0013',
    hours:[['Mon – Fri','9am – 7pm'],['Sat','9am – 5pm'],['Sun','9am – 5pm'],['Public holidays','9am – 5pm']]
  },
  {
    name:'Vangate Mall', province:'Western Cape', city:'Athlone', tag:'Mall',
    lat:-33.972, lng:18.523,
    address:'Shop 68 Vangate Mall, Jakes Gerwel Drive, Athlone, Cape Town',
    phone:'081 776 6366',
    hours:[['Mon – Fri','8am – 7pm'],['Sat','8am – 7pm'],['Sun','8am – 6pm'],['Public holidays','9am – 5pm']]
  },
  {
    name:'Table Bay Mall', province:'Western Cape', city:'Sunningdale', tag:'Mall',
    lat:-33.765, lng:18.49,
    address:'Table Bay Mall, Shop G014, W Coast Rd & Berkshire Blvd, Sunningdale, Cape Town',
    phone:null, /* PLACEHOLDER: no phone number published for this branch */
    hours:[['Mon – Fri','8am – 7pm'],['Sat','8am – 7pm'],['Sun','8am – 5pm'],['Public holidays','9am – 5pm']]
  }
];

/* ------------------------------------------------------------
   VOICES — real customer + press quotes, trimmed for length.
   ------------------------------------------------------------ */
const VOICES = [
  { q:'An absolute must visit for anyone who loves coffee and snacking on pastries and sweet treats. Loved the quality — and it\'s a bargain.', s:'Zomato — Durbanville' },
  { q:'Fantastic quality without feeling uitgebuit. I love the professional and friendly staff. It is really an excellent experience.', s:'Elize Erasmus — Customer' },
  { q:'The best coffee shop I have ever been in. The freshest chocolate doughnuts I have ever eaten. I rate you 10 out of 10.', s:'Shannon — Customer' },
  { q:'I was blown away not only by the concept, but the service and quality on offer. The vibe was great.', s:'Coleen — Cape Gate' },
  { q:'Heralded as the best priced coffee shop in South Africa — the food\'s tasty without being pretentious.', s:'TravelStart' },
  { q:'Not only does this make XPRESSO Café one of the most competitive brands in South Africa, it\'s helping out cash-strapped Capetonians too.', s:'Entrepreneur Magazine' },
  { q:'I don\'t know how they do it, but Xpresso Cafe manages to churn out some pretty fabulous cafe items for cheap as chips.', s:'Mess & Mojitos' },
  { q:'SA\'s first coffee shop where everything on the menu is one price. This isn\'t a prank. We promise.', s:'Food24' }
];

/* ------------------------------------------------------------
   ENVIRONMENTS — background + foreground per section.
   The scroll transition between these is animated.
   ------------------------------------------------------------ */
const ENVIRONMENTS = {
  espresso:{ bg:'#1C1614', fg:'#F9F6F0' },  /* Deep Espresso */
  bean:    { bg:'#241A15', fg:'#F9F6F0' },  /* one soft step up */
  crema:   { bg:'#EFEAD8', fg:'#201B18' },  /* Oatmeal Canvas */
  paper:   { bg:'#F9F6F0', fg:'#201B18' },  /* Soft Cream */
  milk:    { bg:'#EFEAD8', fg:'#201B18' }   /* aligned to Oatmeal */
};
