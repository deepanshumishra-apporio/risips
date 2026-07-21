"use client";

import { useStore } from "../lib/store";
import { CartIcon } from "./icons";

export function CartButton() {
  const { state, go } = useStore();
  const count = state.cart.length;
  return (
    <button
      className="iconbtn noti-wrap"
      onClick={() => go("cart")}
      aria-label="Cart"
    >
      <CartIcon size={22} />
      {count > 0 && <span className="cart-badge">{count}</span>}
    </button>
  );
}
