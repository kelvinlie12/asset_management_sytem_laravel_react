import React from "react";
import {
  AlertIcon,
  ArrowRightIcon,
  BoxCubeIcon,
  BoxIconLine,
  DollarLineIcon,
  GridIcon,
  GroupIcon,
  ListIcon,
  PieChartIcon,
  UserCircleIcon,
} from "../icons";

// Which routes each menu item is allowed for (role-based).
export const ROLE_ALL = ["super_admin", "admin", "staff"];
export const ROLE_ADMIN = ["super_admin", "admin"];
export const ROLE_SUPER = ["super_admin"];

export interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles: string[];
  subItems?: { name: string; path: string; roles: string[] }[];
}

export const NAV_ITEMS: MenuItem[] = [
  {
    name: "Dashboard",
    icon: <GridIcon />,
    path: "/",
    roles: ROLE_ALL,
  },
  {
    name: "Asset",
    icon: <BoxIconLine />,
    path: "/assets",
    roles: ROLE_ALL,
  },
  {
    name: "Pembelian",
    icon: <DollarLineIcon />,
    path: "/purchases",
    roles: ROLE_ALL,
  },
  {
    name: "Mutasi Asset",
    icon: <ArrowRightIcon />,
    path: "/transfers",
    roles: ROLE_ALL,
  },
  {
    name: "Barang Rusak",
    icon: <AlertIcon />,
    path: "/damages",
    roles: ROLE_ALL,
  },
  {
    name: "Kendaraan",
    icon: <BoxCubeIcon />,
    path: "/vehicles",
    roles: ROLE_ALL,
  },
  {
    name: "Team",
    icon: <GroupIcon />,
    path: "/teams",
    roles: ROLE_ALL,
  },
  {
    name: "Ruangan",
    icon: <BoxIconLine />,
    path: "/rooms",
    roles: ROLE_ALL,
  },
  {
    name: "User",
    icon: <UserCircleIcon />,
    path: "/users",
    roles: ROLE_ADMIN,
  },
  {
    name: "Role & Permission",
    icon: <PieChartIcon />,
    roles: ROLE_SUPER,
    subItems: [
      { name: "Roles", path: "/roles", roles: ROLE_SUPER },
      { name: "Permissions", path: "/permissions", roles: ROLE_SUPER },
    ],
  },
  {
    name: "Laporan",
    icon: <ListIcon />,
    path: "/reports",
    roles: ROLE_ALL,
  },
];

// Map route path -> human readable title for breadcrumbs.
export const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/assets": "Asset",
  "/purchases": "Pembelian",
  "/transfers": "Mutasi Asset",
  "/damages": "Barang Rusak",
  "/vehicles": "Kendaraan",
  "/teams": "Team",
  "/rooms": "Ruangan",
  "/users": "User",
  "/roles": "Roles",
  "/permissions": "Permissions",
  "/reports": "Laporan",
  "/profile": "User Profile",
};

export function canAccess(role: string | undefined, roles: string[]): boolean {
  if (!role) return false;
  return roles.includes(role);
}
