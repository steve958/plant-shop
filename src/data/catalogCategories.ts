export type CatalogCategory = {
  label: string;
  subcategories: string[];
};

export const catalogCategories: CatalogCategory[] = [
  {
    label: "Zaštita bilja",
    subcategories: ["Herbicidi", "Fungicidi", "Insekticidi", "Organski preparati"],
  },
  {
    label: "Ishrana bilja",
    subcategories: [
      "Osnovna granulisana đubriva",
      "Kristalna vodootopiva đubriva",
      "Tečna đubriva i biostimulatori",
      "Đubriva na bazi mikroelemenata",
      "Organska đubriva i poboljšivači zemljišta",
      "Mikrobiološka đubriva",
    ],
  },
  {
    label: "Seme i sadnice",
    subcategories: [
      "Seme ratarskih kultura",
      "Seme povrtarskih kultura",
      "Sadnice ukrasnog bilja",
      "Sadnice voća",
    ],
  },
  {
    label: "Pet program",
    subcategories: [
      "Hrana za kućne ljubimce",
      "Oprema za kućne ljubimce",
      "Hrana za domaće životinje",
    ],
  },
  {
    label: "Garden oprema i alati",
    subcategories: [
      "Mašine",
      "Alati",
      "Oprema za navodnjavanje",
      "Folije i veziva",
      "Supstrati malčevi i zemlja za cveće",
      "Saksije i žardinjere",
      "Baštenski nameštaj",
      "HTZ oprema",
    ],
  },
];

export const getSubcategories = (category: string) =>
  catalogCategories.find((item) => item.label === category)?.subcategories ?? [];
