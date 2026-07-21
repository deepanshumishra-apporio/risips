// Minimal stroke icons — consistent 1.6 line weight, never green (brand rule).

type P = { size?: number };
const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const HomeIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </svg>
);

export const ExploreIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const OrdersIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M6 3h12a1 1 0 0 1 1 1v16l-3-2-2 2-2-2-2 2-3-2V4a1 1 0 0 1 1-1Z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

export const PortfolioIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 19V9m5 10V5m5 14v-7m5 7V8" />
  </svg>
);

export const ChevronRight = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const ChevronLeft = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);

export const SearchIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const StarIcon = ({
  size = 14,
  filled,
}: P & { filled?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinejoin="round"
  >
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  </svg>
);

export const BellIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

export const CheckIcon = ({ size = 20 }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m5 12.5 4.2 4.5L19 7" />
  </svg>
);

export const ShieldCheck = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M12 3l7 2.5v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5L12 3Z" />
    <path d="m9 11.5 2 2 3.5-3.5" />
  </svg>
);

export const UserIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" />
  </svg>
);

export const LockIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export const PlusIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const HeartIcon = ({
  size = 22,
  filled,
}: P & { filled?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20.5C6 16.5 3.5 13 3.5 9.4A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8.5 2.1c0 3.6-2.5 7.1-8.5 11.1Z" />
  </svg>
);

export const CalcIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 7h8M8 11h2M8 15h2M14 11h2M14 15h2M12 11v4" />
  </svg>
);

export const LogOutIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
    <path d="M10 8l-4 4 4 4M6 12h11" />
  </svg>
);

export const SettingsIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </svg>
);

export const CartIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}>
    <path d="M4 5h2l1.4 10.5a1 1 0 0 0 1 .9h7.8a1 1 0 0 0 1-.8L19 8H7" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="16.5" cy="19.5" r="1.3" />
  </svg>
);

export const TrashIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
);

export const FaceIdIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M9 10v1M15 10v1M12 10v3l-1 1M9.5 15c.9.7 4.1.7 5 0" />
  </svg>
);

export const FingerprintIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}>
    <path d="M12 5a7 7 0 0 0-7 7v3" />
    <path d="M12 9a3 3 0 0 0-3 3v4" />
    <path d="M12 13v3M15 12a3 3 0 0 0-1.2-2.4M19 12a7 7 0 0 0-2-4.9M8 19a6 6 0 0 0 .8-1.6" />
  </svg>
);

export const PenIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M16.5 4.5l3 3L8 19l-4 1 1-4 11.5-11.5Z" />
  </svg>
);

export const CameraIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}>
    <path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h5L15 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
    <circle cx="12" cy="12.5" r="3.2" />
  </svg>
);

export const WalletIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}>
    <path d="M4 8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1H6a1 1 0 0 0 0 2h13a1 1 0 0 1 1 1v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
    <circle cx="16.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const ArrowDownIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

export const ArrowUpIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);
