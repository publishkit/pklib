import { asArray } from "./array";

export const remove: ObjectAny = {};

// remove class
remove.class = (classes: string, target: any) =>
  asArray(classes).forEach((classname) => {
    const els = target.querySelectorAll(classname);
    els.forEach((el: HTMLElement) => {
      el.classList.remove(classname.replace(".", ""));
    });
  });

// remove el on documents
remove.el = (els: string, target: any) =>
  asArray(els).forEach((selector: string) => {
    const els = target.querySelectorAll(selector);
    els.forEach((el: HTMLElement) => {
      el.parentElement?.removeChild(el);
    });
  });

// remove attribute on documents
remove.attr = (attrs: string, target: any) =>
  asArray(attrs).forEach((attr) => {
    const els = target.querySelectorAll(`[${attr}]`);
    els.forEach((el: HTMLElement) => {
      el.removeAttribute(attr);
    });
  });

// remove empty only attribute on documents
remove.emptyAttr = (attrs: string, target: any) =>
  asArray(attrs).forEach((attr) => {
    const els = target.querySelectorAll(`[${attr}=""]`);
    els.forEach((el: HTMLElement) => {
      el.removeAttribute(attr);
    });
  });

// remove empty tags
remove.emptyTags = (tags: string, target: any) =>
  asArray(tags).forEach((tag) => {
    const els = target.querySelectorAll(`${tag}`);
    els.forEach((el: HTMLElement) => {
      const inside = (el.innerHTML||"").trim()
      if (inside === '&nbsp;' || !inside) {
        el.parentNode?.removeChild(el);
      }
    });
  });

// extract value from html
export const parseUl = (win: Window, rootUl: HTMLUListElement | null) => {
  const { $ } = win;
  if (!rootUl) return { items: [] };
  const array = [] as any;

  // nested with section
  if ($(rootUl).find("ul").length) {
    for (const el of $(rootUl).find("> li")) {
      const label =
        $(el).find("label")[0]?.innerHTML ||
        $(el).clone().children().remove().end().text().trim();
      const isOpen = !$(el).find('[type="checkbox"][checked=""]')[0];
      const items: ObjectAny[] = [];

      $(el)
        .find("ul li")
        .map(function () {
          const item = $(this)
            .html()
            .split("||")
            .map((slot: string) => (slot || "").trim());
          items.push(item);
        });

      const section = { label, isOpen, items };

      array.push(section);
    }
    return { nested: true, items: array };
  } else {
    for (const el of $(rootUl).find("> li")) {
      const item = $(el)
        .html()
        .split("||")
        .map((slot: string) => (slot || "").trim());
      array.push(item);
    }
    return { nested: false, items: array };
  }
};
