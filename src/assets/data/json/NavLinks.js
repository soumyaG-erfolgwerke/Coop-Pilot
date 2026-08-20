import { data, membersData } from "./NavData";

export const NavLinks = [
  {
    title: "home",
    href: "/",
    toggle: false,
    // data: data,
  },
  {
    title: "for cooperatives",
    href: "/for-cooperatives",
    tag: "cooperatives",
    toggle: true,
    data: data,
  },
  {
    title: "for members",
    href: "/for-member",
    tag: "members",
    toggle: true,
    data: membersData,
  },
  {
    title: "pricing",
    href: "#",
    tag: "pricing",
    toggle: false,
  },
  {
    title: "blogs",
    href: "#",
    tag: "blogs",
    toggle: false,
  },
  {
    title: "about",
    tag: "about",
    href: "/about",
    toggle: false,
  },
];
