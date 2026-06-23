export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);

  Object.entries(options).forEach(([key, value]) => {
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, value);
  });

  children.forEach((child) => {
    if (typeof child === "string") node.append(document.createTextNode(child));
    else if (child) node.append(child);
  });

  return node;
}

export function card(children, className = "") {
  return el("section", { className: `card ${className}`.trim() }, children);
}

export function topbar(title, backHandler) {
  return el("header", { className: "topbar" }, [
    backHandler
      ? el("button", { className: "back-button", type: "button", text: "←", onClick: backHandler, "aria-label": "返回" })
      : el("span"),
    el("h1", { className: "topbar-title", text: title }),
    el("span")
  ]);
}

export function metaGrid(items) {
  return el("div", { className: "meta-grid" }, items.map((item) =>
    el("div", { className: "meta-item" }, [
      el("span", { className: "meta-label", text: item.label }),
      el("span", { className: "meta-value", text: item.value })
    ])
  ));
}

export function chips(items) {
  return el("div", { className: "chips" }, items.map((item) => el("span", { className: "chip", text: item })));
}

export function patternList(items) {
  return el("ul", { className: "hint-list" }, items.map((item) => el("li", { text: item })));
}

export function resultBlock(title, text, soft = false) {
  return el("section", { className: soft ? "result-block soft-card" : "result-block card" }, [
    el("h2", { className: "result-title", text: title }),
    el("p", { className: "result-text", text })
  ]);
}
