import { data } from "./NavData";

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
    toggle: false,
    // data: data,
  },
  /*{
    title: "pricing",
    href: "/pricing",
    tag: "pricing",
    toggle: false,
    // data: data,
  },*/
  {
    title: "about",
    tag: "about",
    href: "/about",
    toggle: false,
    // data: data,
  },
];
