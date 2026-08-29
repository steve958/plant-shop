export const scrollToProductCatalogue = () => {
  const catalogue = document.querySelector<HTMLElement>("[data-product-catalogue]");
  if (!catalogue) return false;

  const activeHeader = document.querySelector<HTMLElement>(".shop-header--search-active");
  const navigation = document.querySelector<HTMLElement>(".shop-navigation");
  const stickyOffset = (activeHeader?.offsetHeight ?? 0) + (navigation?.offsetHeight ?? 0) + 24;
  const targetTop = catalogue.getBoundingClientRect().top + window.scrollY - stickyOffset;
  window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  return true;
};
