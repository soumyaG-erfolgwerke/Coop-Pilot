import { Shapes, ArrowRight, FileSearch } from "lucide-react";

export const data = [
  {
    id: 1,
    enable: true,
    title: "platform",
    info: [
      {
        id: "C1_01",
        enable: true,
        icon: (
          <Shapes className="w-10 h-10 p-2 m-2 text-primary bg-[#ffeff5] rounded-xl" />
        ),
        link: "/for-cooperatives",
        heading: "features",
        description:
          "Discover how CoopPilot’s powerful features can help you better serve your members.",
      },
      {
        id: "C1_02",
        enable: true,
        icon: (
          <FileSearch className="w-10 h-10 p-2 m-2 text-primary bg-[#ffeff5] rounded-xl" />
        ),
        link: "/compliance",
        heading: "Compliance & Legal",
        description:
          "Seamless transition to CoopPilot with expert guidance and support.",
      },
      {
        id: "C1_03",
        enable: false,
        icon: (
          <ArrowRight className="w-10 h-10 p-2 m-2 text-primary bg-[#ffeff5] rounded-xl" />
        ),
        link: "/cooperative?tab=migration-guide",
        heading: "Migration Guide",
        description:
          "Seamless transition to CoopPilot with expert guidance and support.",
      },
    ],
  },
  {
    id: 2,
    enable: false,
    title: "COOPERATIVE TYPES",
    info: [
      {
        id: "C2_01",
        enable: true,
        icon: "/", //TODO: ADD ICON
        link: "", //TODO: ADD LINK
        heading: "Financial Cooperatives",
        description: "Transparent plans for cooperatives of any size",
      },
      {
        id: "C2_02",
        enable: true,
        icon: "/", //TODO: ADD ICON
        link: "", //TODO: ADD LINK
        heading: "Credit Unions",
        description: "Transparent plans for cooperatives of any size",
      },
      {
        id: "C2_03",
        enable: true,
        icon: "/", //TODO: ADD ICON
        link: "", //TODO: ADD LINK
        heading: "Consumer Cooperatives",
        description: "Transparent plans for cooperatives of any size",
      },
      {
        id: "C2_04",
        enable: true,
        icon: "/", //TODO: ADD ICON
        link: "", //TODO: ADD LINK
        heading: "Producer Cooperatives",
        description: "Transparent plans for cooperatives of any size",
      },
      {
        id: "C2_05",
        enable: true,
        icon: "/", //TODO: ADD ICON
        link: "", //TODO: ADD LINK
        heading: "Housing Cooperatives",
        description: "Transparent plans for cooperatives of any size",
      },
      {
        id: "C2_06",
        enable: true,
        icon: "/", //TODO: ADD ICON
        link: "", //TODO: ADD LINK
        heading: "Worker Cooperatives",
        description: "Transparent plans for cooperatives of any size",
      },
    ],
  },
];

export const membersData = [
  {
    id: 1,
    enable: true,
    title: "GET STARTED",
    info: [
      {
        id: "M1_01",
        enable: true,
        icon: (
          <Shapes className="w-10 h-10 p-2 m-2 text-primary bg-[#ffeff5] rounded-xl" />
        ),
        link: "#",
        heading: "What is cooperative?",
        description: "Learn basic steps what is cooperative.",
      },
      {
        id: "M1_02",
        enable: true,
        icon: (
          <ArrowRight className="w-10 h-10 p-2 m-2 text-primary bg-[#ffeff5] rounded-xl" />
        ),
        link: "/member-signup",
        heading: "Become a member",
        description: "Discover cooperatives & become co-owner.",
      },
      {
        id: "M1_03",
        enable: true,
        icon: (
          <FileSearch className="w-10 h-10 p-2 m-2 text-primary bg-[#ffeff5] rounded-xl" />
        ),
        link: "/explore",
        heading: "Member dashboard",
        description: "Access share status & documents.",
      },
    ],
  },
];
