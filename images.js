/* ============================================================
   XPRESSO — IMAGE MANIFEST

   All images below are Unsplash (images.unsplash.com), which is
   free for commercial use with no attribution required.
   Deliberately NO plus.unsplash.com URLs — those are Unsplash+
   (paid licence) and would be a licensing problem on a live
   commercial site.

   These are placeholders standing in for real Xpresso photography.
   When you have real store/product shots, swap the `src` values —
   nothing else needs to change.
   ============================================================ */

const IMG = (id, w = 1600, q = 74) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=${q}&auto=format&fit=crop`;

const IMAGES = {
  /* wide, atmospheric — full-bleed banner backgrounds */
  counter:     { src: IMG('1567880905822-56f8e06fe630', 2000), alt: 'Coffee shop counter' },
  cafeBulbs:   { src: IMG('1511081692775-05d0f180a065', 2000), alt: 'Café interior with warm hanging lights' },
  cafeRoom:    { src: IMG('1554118811-1e0d58224f24',   2000), alt: 'Coffee shop interior' },
  beansField:  { src: IMG('1447933601403-0c6688de566e', 2000), alt: 'Roasted coffee beans' },

  /* the hero product / people moments */
  threeCups:   { src: IMG('1495474472287-4d71bcdd2085', 1400), alt: 'Three people holding takeaway coffee cups' },
  mug:         { src: IMG('1514432324607-a09d9b4aefdd', 1200), alt: 'Cup of coffee' },
  latteMug:    { src: IMG('1509042239860-f550ce710b93', 1200), alt: 'Freshly poured coffee' },

  /* food + craft */
  croissant:   { src: IMG('1542372147193-a7aca54189cd', 1400), alt: 'Coffee and a croissant on a café table' },
  barista:     { src: IMG('1541167760496-1628856ab772', 1400), alt: 'Barista pouring latte art' },
  flatlay:     { src: IMG('1511920170033-f8396924c348', 1400), alt: 'Coffee, ground beans and beans flat lay' },
  heartLatte:  { src: IMG('1512568400610-62da28bc8a13', 1000), alt: 'Latte with heart art, top down' },
  machine:     { src: IMG('1453614512568-c4024d13c247', 1400), alt: 'Espresso machine on the counter' },
  tables:      { src: IMG('1600093463592-8e36ae95ef56', 1200), alt: 'Café tables and chairs' },
  plantTable:  { src: IMG('1534040385115-33dcb3acba5b', 1000), alt: 'Café table by a window' },
  bikes:       { src: IMG('1493857671505-72967e2e2760', 1200), alt: 'Bikes parked inside a café' },
};

/* The customer photo wall — Duckbill-style community grid */
const WALL = [
  { k: 'threeCups', cls: 'wide' },
  { k: 'barista',   cls: 'tall' },
  { k: 'heartLatte',cls: '' },
  { k: 'croissant', cls: '' },
  { k: 'machine',   cls: '' },
  { k: 'tables',    cls: '' },
  { k: 'plantTable',cls: '' },
  { k: 'bikes',     cls: 'wide' },
];
