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

// remove empry only attribute on documents
remove.emptyAttr = (attrs: string, target: any) =>
  asArray(attrs).forEach((attr) => {
    const els = target.querySelectorAll(`[${attr}=""]`);
    els.forEach((el: HTMLElement) => {
      el.removeAttribute(attr);
    });
  });
