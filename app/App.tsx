"use client";

import { StoreProvider, useStore, TAB_SCREENS } from "./lib/store";
import { BottomTabs } from "./components/BottomTabs";
import { StatusBar, HomeIndicator } from "./components/Device";
import { Toasts } from "./components/Toasts";

import { Splash } from "./screens/Splash";
import { OnboardWizard } from "./screens/Onboarding";
import { Login } from "./screens/Login";
import { Home } from "./screens/Home";
import { Explore } from "./screens/Explore";
import { FundDetail } from "./screens/FundDetail";
import { Payment } from "./screens/Payment";
import { OrderSuccess } from "./screens/OrderSuccess";
import { Orders } from "./screens/Orders";
import { OrderDetail } from "./screens/OrderDetail";
import { Portfolio } from "./screens/Portfolio";
import { Redeem } from "./screens/Redeem";
import { Sips } from "./screens/Sips";
import { Profile } from "./screens/Profile";
import { Notifications } from "./screens/Notifications";
import { Wishlist } from "./screens/Wishlist";
import { Cart } from "./screens/Cart";
import { Wallet } from "./screens/Wallet";

function Router() {
  const { route } = useStore();
  const showTabs = TAB_SCREENS.includes(route.screen);

  // keyed so each screen remounts (re-triggers entry animation) on navigation
  const key = route.screen + JSON.stringify(route.params ?? {});

  let screen: React.ReactNode;
  switch (route.screen) {
    case "splash":
      screen = <Splash />;
      break;
    case "onboard":
      screen = <OnboardWizard />;
      break;
    case "login":
      screen = <Login />;
      break;
    case "home":
      screen = <Home />;
      break;
    case "explore":
      screen = <Explore />;
      break;
    case "fund":
      screen = <FundDetail />;
      break;
    case "payment":
      screen = <Payment />;
      break;
    case "success":
      screen = <OrderSuccess />;
      break;
    case "orders":
      screen = <Orders />;
      break;
    case "orderDetail":
      screen = <OrderDetail />;
      break;
    case "portfolio":
      screen = <Portfolio />;
      break;
    case "redeem":
      screen = <Redeem />;
      break;
    case "sips":
      screen = <Sips />;
      break;
    case "profile":
      screen = <Profile />;
      break;
    case "notifications":
      screen = <Notifications />;
      break;
    case "wishlist":
      screen = <Wishlist />;
      break;
    case "cart":
      screen = <Cart />;
      break;
    case "wallet":
      screen = <Wallet />;
      break;
    default:
      screen = <Home />;
  }

  return (
    <>
      <div key={key} className="grow col" style={{ minHeight: 0 }}>
        {screen}
      </div>
      {showTabs && <BottomTabs />}
    </>
  );
}

function Frame() {
  const { route } = useStore();
  // ink-background screens need light status bar / home indicator
  const dark = route.screen === "splash" || route.screen === "payment";
  return (
    <div className="device">
      <span className="edge left action" />
      <span className="edge left vup" />
      <span className="edge left vdn" />
      <span className="edge right power" />
      <div className={`frame${dark ? " dark" : ""}`}>
        <div className="island" />
        <StatusBar dark={dark} />
        <Router />
        <Toasts />
        <HomeIndicator dark={dark} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <div className="stage">
        <Frame />
      </div>
    </StoreProvider>
  );
}
