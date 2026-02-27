import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

export const Icons = {
    // layout / nav
    Dashboard: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="11" rx="1.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="18" width="7" height="3" rx="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    ),
    Data: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="4" y="3" width="16" height="5" rx="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="10" width="16" height="5" rx="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="17" width="16" height="5" rx="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="5.5" r="1.25" fill="currentColor" />
            <circle cx="8" cy="12.5" r="1.25" fill="currentColor" />
            <circle cx="8" cy="19.5" r="1.25" fill="currentColor" />
        </svg>
    ),
    Simulate: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <polygon points="6,4 20,12 6,20" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M6 12L15 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="15" cy="12" r="1.5" fill="currentColor" />
            <circle cx="6" cy="4" r="1.5" fill="currentColor" />
            <circle cx="6" cy="20" r="1.5" fill="currentColor" />
        </svg>
    ),
    Report: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="4" y="3" width="16" height="18" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="8" y="8" width="8" height="2" rx="1" fill="currentColor" />
            <rect x="8" y="14" width="5" height="2" rx="1" fill="currentColor" />
            <path d="M16 14L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    Settings: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="3" y="6" width="18" height="2" rx="1" fill="currentColor" />
            <rect x="8" y="4" width="4" height="6" rx="1.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="16" width="18" height="2" rx="1" fill="currentColor" />
            <rect x="14" y="14" width="4" height="6" rx="1.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    ),
    ChevronLeftDouble: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 5V19" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 15L11 12L14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    ChevronRightDouble: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 5V19" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13 9L16 12L13 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    ArrowRight: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="4" y="11.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
            <path d="M14 6L20 12L14 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Plus: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="5" y="11.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="11.25" y="5" width="1.5" height="14" rx="0.75" fill="currentColor" />
        </svg>
    ),
    Clock: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11.25" y="8" width="1.5" height="4.5" rx="0.75" fill="currentColor" />
            <rect x="11.25" y="11.25" width="4" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
    ),
    Check: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12L10.5 14.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    TrendingUp: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <path d="M3 17L9 11L13 15L21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 6H21V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="21" cy="6" r="1.5" fill="currentColor" />
            <circle cx="9" cy="11" r="1.5" fill="currentColor" />
        </svg>
    ),
    TrendingDown: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <path d="M3 7L9 13L13 9L21 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 18H21V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="21" cy="18" r="1.5" fill="currentColor" />
            <circle cx="9" cy="13" r="1.5" fill="currentColor" />
        </svg>
    ),
    AlertTriangle: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <polygon points="12,3 21,20 3,20" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="11.25" y="9" width="1.5" height="5" rx="0.75" fill="currentColor" />
            <circle cx="12" cy="17" r="1.25" fill="currentColor" />
        </svg>
    ),
    BarChart: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="4" y="14" width="4" height="6" rx="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="10" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
            <rect x="16" y="10" width="4" height="10" rx="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    ),
    Spreadsheet: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 10H20M10 4V20" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    ),
    Globe: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 3C14.5 3 16 7.5 16 12C16 16.5 14.5 21 12 21C9.5 21 8 16.5 8 12C8 7.5 9.5 3 12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="3" y="11.25" width="18" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
    ),
    Image: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15L16 10L5 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    MapPin: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <path d="M12 21C16 16 19 12 19 9C19 5.2 15.8 2 12 2C8.2 2 5 5.2 5 9C5 12 8 16 12 21Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="12" cy="9" r="2.5" fill="currentColor" />
        </svg>
    ),
    Crosshair: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <rect x="11.25" y="2" width="1.5" height="4" rx="0.75" fill="currentColor" />
            <rect x="11.25" y="18" width="1.5" height="4" rx="0.75" fill="currentColor" />
            <rect x="2" y="11.25" width="4" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="18" y="11.25" width="4" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
    ),
    Truck: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="3" y="6" width="11" height="10" rx="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 6H18L21 10V16H14V6Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="7" cy="18" r="2" fill="currentColor" />
            <circle cx="17" cy="18" r="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    ),
    Users: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <circle cx="9" cy="8" r="3" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 18C2 15 5 13 9 13C11 13 13 13.8 14.5 15.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="16" cy="10" r="2.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14.5 15.5C15.8 15.5 17 16.5 17 18V19H21C21 16 19 14 16 14C15.5 14 15 14.1 14.5 14.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    Megaphone: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <path d="M4 8L15 5V15L4 12V8Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="2" y="8" width="2" height="4" rx="1" fill="currentColor" />
            <path d="M9 13L10 19C10 20 8 20 8 19L7 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 6C19.5 7.5 19.5 12.5 18 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M21 4C23.5 6.5 23.5 13.5 21 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    CreditCard: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="9" width="18" height="3" fill="currentColor" />
            <rect x="7" y="15" width="4" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
    ),
    Sparkles: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <path d="M10 3L11.5 8.5L17 10L11.5 11.5L10 17L8.5 11.5L3 10L8.5 8.5L10 3Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M18 14L18.7 16.3L21 17L18.7 17.7L18 20L17.3 17.7L15 17L17.3 16.3L18 14Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    ),
    ChevronDown: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    ChevronUp: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Upload: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="4" y="16" width="16" height="5" rx="1.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 14V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7 8L12 3L17 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    MessageSquare: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <path d="M3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11C19 15.4183 15.4183 19 11 19C9.75677 19 8.58025 18.7161 7.54575 18.2163L3 19L3.78374 14.4542C3.28393 13.4198 3 12.2432 3 11Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="7" y="10" width="8" height="2" rx="1" fill="currentColor" />
        </svg>
    ),
    ShoppingCart: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="6" y="6" width="14" height="9" rx="1.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 3H4.5L6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="19" r="2" fill="currentColor" />
            <circle cx="17" cy="19" r="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="10" y="9" width="6" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
    ),
    Building2: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <rect x="4" y="6" width="7" height="15" rx="1" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
            <rect x="13" y="3" width="7" height="18" rx="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="6" y="9" width="3" height="1.5" rx="0.75" fill="currentColor" fillOpacity="0.2" />
            <rect x="6" y="14" width="3" height="1.5" rx="0.75" fill="currentColor" fillOpacity="0.2" />
            <rect x="15" y="7" width="3" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="15" y="12" width="3" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="15" y="17" width="3" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
    ),
    Pin: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <path d="M16 8V12L18 16H6L8 12V8" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="8" y="4" width="8" height="4" rx="1" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 16V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    Info: (props: IconProps) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} aria-hidden>
            <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11.25" y="11" width="1.5" height="5" rx="0.75" fill="currentColor" />
            <circle cx="12" cy="8" r="1.25" fill="currentColor" />
        </svg>
    ),
};
