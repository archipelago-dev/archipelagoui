// src/components/Card.tsx
import { jsx } from "react/jsx-runtime";
function Card(props) {
  return /* @__PURE__ */ jsx("div", { className: `rounded-xl bg-white/5 border border-white/10 p-4 shadow ${props.className ?? ""}`, children: props.children });
}

// src/components/Title.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function Title(props) {
  return /* @__PURE__ */ jsx2("h2", { className: `text-xl font-bold mb-2 ${props.className ?? ""}`, children: props.children });
}
export {
  Card,
  Title
};
