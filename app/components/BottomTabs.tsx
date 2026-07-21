"use client";

import { useStore, type ScreenName } from "../lib/store";
import {
  HomeIcon,
  ExploreIcon,
  OrdersIcon,
  PortfolioIcon,
  HeartIcon,
} from "./icons";

const TABS: { key: ScreenName; label: string; Icon: typeof HomeIcon }[] = [
  { key: "home", label: "Home", Icon: HomeIcon },
  { key: "explore", label: "Explore", Icon: ExploreIcon },
  { key: "wishlist", label: "Watchlist", Icon: HeartIcon },
  { key: "orders", label: "Orders", Icon: OrdersIcon },
  { key: "portfolio", label: "Portfolio", Icon: PortfolioIcon },
];

export function BottomTabs() {
  const { activeTab, switchTab } = useStore();
  return (
    <nav className="tabbar">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          className={`tab${activeTab === key ? " active" : ""}`}
          onClick={() => switchTab(key)}
        >
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  );
}
