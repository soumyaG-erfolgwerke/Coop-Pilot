"use client";

import Logo from "@/assets/images-V2/cooppilot-logo-white.png";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const navData = [
  {
    id: 1,
    title: "Product",
    items: ["Compliance", "Pricing"],
    links: ["/compliance", "/pricing"],
  },
  {
    id: 2,
    title: "Use Cases",
    items: ["For Cooperatives", "For Members"],
    links: ["/for-cooperatives", "/for-member"],
  },
  {
    id: 3,
    title: "Company",
    items: ["About", "Contact"],
    links: ["/about", "/contact"],
  },
  {
    id: 4,
    title: "Legal",
    items: ["Imprint", "Privacy Policy"],
    links: ["/imprint", "/privacy"],
  },
];
const socialsData = [
  {
    id: 1,
    platform: "Twitter",
    imagePath: "/icons/Twitter_v2.svg",
    url: "https://twitter.com/cooppilot",
  },
  {
    id: 2,
    platform: "Facebook",
    imagePath: "/icons/Facebook_v2.svg",
    url: "https://facebook.com/cooppilot",
  },
  {
    id: 3,
    platform: "Instagram",
    imagePath: "/icons/Instagram_v2.svg",
    url: "https://instagram.com/cooppilot",
  },
];

const NavColumn = ({ title, items, links, t }) => {
  return (
    <div className="flex flex-col space-y-4 min-w-[140px]">
      {/* Column Heading */}
      <h4 className="font-serif text-xl md:text-2xl lg:text-3xl text-[#F2D6B3] font-normal tracking-wide">
        {t(title)}
      </h4>

      {/* Links List */}
      <ul className="flex flex-col space-y-1 md:space-y-2.5">
        {items.map((item, index) => (
          <li key={index}>
            <Link
              href={links[index]}
              className="text-white font-sans text-base md:text-lg lg:text-xl hover:text-white/80 transition-colors duration-150 block font-light"
            >
              {t(item)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SocialsBar = () => {
  return (
    <div className="flex items-center gap-10">
      {socialsData.map((social) => (
        <a
          key={social.id}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit our ${social.platform} page`}
          className="transition-all duration-150 hover:scale-110 active:scale-95 block"
        >
          <Image
            src={social.imagePath}
            alt={`${social.platform} icon`}
            width={20}
            height={20}
            className="w-6 h-6 object-contain"
          />
        </a>
      ))}
    </div>
  );
};

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative p-10 bg-[#7D0534] w-full flex flex-col gap-10 text-slate-900 font-sans mx-auto lg:max-w-[1920px]">
      {/* Logo and Email */}
      <div className="flex flex-col gap-4 items-start justify-center min-h-[100px] w-fit">
        <Image
          src={Logo}
          alt="CoopPilot Logo"
          width={200}
          height={50}
          className="object-contain"
        />

        <p className="w-full text-center font-serif text-base font-normal tracking-wide text-white p-1">
          Email:{" "}
          <a href="mailto:info@hystandards.de" className="hover:underline">
            info@hystandards.de
          </a>
        </p>
      </div>

      {/* Directory Links */}
      <div className="flex flex-col md:mx-10">
        <div className="ml-auto flex flex-col gap-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-16 w-full">
            {navData.map((column) => (
              <NavColumn
                key={column.id}
                title={column.title}
                items={column.items}
                links={column.links}
                t={t}
              />
            ))}
          </div>

          <div className="w-full flex flex-wrap gap-3 sm:gap-8 justify-between font-serif text-base lg:text-lg text-[#F2D6B3] font-normal tracking-wide ">
            <p>{t("GDPR Compliant")}</p>
            <p>{t("Secure and Encrypted")}</p>
            <p>{t("Built for Cooperatives")}</p>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
        <div className="font-medium lg:text-lg text-base text-white">
          © 2026 CoopPilot. All rights reserved.
        </div>

        {/* <SocialsBar /> */}
      </div>
    </footer>
  );
}
