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
const XPRESSO_PRICE = 'R10';

/* ------------------------------------------------------------
   MENU
   The live site lists CATEGORIES, not individual products with
   names. Individual items are set per store ("Items may vary
   depending on location"), so we present the real categories
   rather than inventing product names.
   ------------------------------------------------------------ */
const MENU = [
  { cat:'coffee',  name:'Freshly Brewed Coffee', desc:'Flavourful coffee, ground and brewed in store, all day.', glyph:'☕' },
  { cat:'coffee',  name:'Individual Teas',       desc:'Freshly packaged individual tea bags.', glyph:'🍵' },
  { cat:'baked',   name:'Pastries & More',       desc:'Because coffee needs a friend.', glyph:'🥐' },
  { cat:'savoury', name:'Sandwiches',            desc:'Freshly made daily.', glyph:'🥪' },
  { cat:'sweet',   name:'Sweet Treats & More',   desc:'Because you deserve it.', glyph:'🍩' },
  { cat:'sweet',   name:'Doughnuts',             desc:'The ones people write to us about.', glyph:'🍩' },
  { cat:'cold',    name:'Cold Drinks & Juices',  desc:'Chilled, and the same price as everything else.', glyph:'🥤' },
  { cat:'coffee',  name:'Hot Chocolate',         desc:'For the non-coffee crowd.', glyph:'🍫' }
];

/* ------------------------------------------------------------
   LOCATIONS — all 8 currently listed, Western Cape.
   Structured with province so national expansion just works.
   ------------------------------------------------------------ */
const LOCATIONS = [
  {
    name:'Durbanville', province:'Western Cape', city:'Durbanville', tag:'Head office',
    address:'16 Wellington Road, Basol Building, Durbanville',
    phone:'021 975 4209',
    hours:[['Mon – Fri','7am – 6pm'],['Sat','7am – 4pm'],['Sun','8am – 1pm'],['Public holidays','8am – 1pm']]
  },
  {
    name:'Canal Walk', province:'Western Cape', city:'Cape Town', tag:'Mall',
    address:'Century Blvd, Shop LP7, Upper level, Entrance 12',
    phone:'021 551 0548',
    hours:[['Mon – Fri','8am – 9pm'],['Sat','8am – 9pm'],['Sun','8am – 9pm'],['Public holidays','8am – 9pm']]
  },
  {
    name:'Cape Town CBD', province:'Western Cape', city:'Cape Town', tag:'City',
    address:'Shop 6, Town Square, 61 Adderley Street, Cape Town',
    phone:'021 422 0437',
    hours:[['Mon – Fri','6:15am – 6pm'],['Sat','7am – 4pm'],['Sun','8am – 1pm'],['Public holidays','8am – 1pm']]
  },
  {
    name:'Cape Gate', province:'Western Cape', city:'Brackenfell', tag:'Mall',
    address:'Cape Gate Mall, Cnr Okavango & de Bron, Brackenfell (Woolworths Entrance)',
    phone:'021 981 3057',
    hours:[['Mon – Fri','8am – 8pm'],['Sat','8am – 8pm'],['Sun','8am – 6pm'],['Public holidays','8am – 6pm']]
  },
  {
    name:'Stellenbosch', province:'Western Cape', city:'Stellenbosch', tag:'Mall',
    address:'Shop 44, Eikestad Mall, Adringa Street, Stellenbosch',
    phone:'021 883 3012',
    hours:[['Mon – Fri','7am – 6pm'],['Sat','7am – 6pm'],['Sun','8am – 2pm'],['Public holidays','7am – 6pm']]
  },
  {
    name:'N1 City', province:'Western Cape', city:'Goodwood', tag:'Mall',
    address:'Shop U28B N1 City, Food Court Entrance, Next to RocoMamas',
    phone:'021 595 0013',
    hours:[['Mon – Fri','9am – 7pm'],['Sat','9am – 5pm'],['Sun','9am – 5pm'],['Public holidays','9am – 5pm']]
  },
  {
    name:'Vangate Mall', province:'Western Cape', city:'Athlone', tag:'Mall',
    address:'Shop 68 Vangate Mall, Jakes Gerwel Drive, Athlone, Cape Town',
    phone:'081 776 6366',
    hours:[['Mon – Fri','8am – 7pm'],['Sat','8am – 7pm'],['Sun','8am – 6pm'],['Public holidays','9am – 5pm']]
  },
  {
    name:'Table Bay Mall', province:'Western Cape', city:'Sunningdale', tag:'Mall',
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
  espresso:{ bg:'#140C08', fg:'#FAF5EE' },
  bean:    { bg:'#241610', fg:'#FAF5EE' },
  crema:   { bg:'#E4C9A3', fg:'#140C08' },
  paper:   { bg:'#FAF5EE', fg:'#140C08' },
  milk:    { bg:'#F2EAE0', fg:'#140C08' }
};
