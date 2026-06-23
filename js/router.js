let renderer = () => {};

export function setRenderer(nextRenderer) {
  renderer = nextRenderer;
}

export function navigate(route) {
  window.location.hash = route;
}

export function currentRoute() {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

export function startRouter() {
  window.addEventListener("hashchange", () => renderer(currentRoute()));
  renderer(currentRoute());
}
