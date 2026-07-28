"use client";
import React from "react";
import { Building2, MapPin, Hash, Globe } from "lucide-react";
import FormBuilder from "./FormBuilder";

const stateOptions = [
  "Berlin",
  "Bavaria (Bayern)",
  "Hamburg",
  "Hesse (Hessen)",
  "North Rhine-Westphalia (Nordrhein-Westfalen)",
  "Baden-Württemberg",
  "Brandenburg",
  "Bremen",
  "Mecklenburg-Vorpommern",
  "Rhineland-Palatinate (Rheinland-Pfalz)",
  "Saarland",
  "Saxony (Sachsen)",
  "Saxony-Anhalt (Sachsen-Anhalt)",
  "Schleswig-Holstein",
  "Thuringia (Thüringen)",
  "Lower Saxony (Niedersachsen)",
];

const Page2 = ({ formData, handleChange, handleBlur, errors }) => {
  const formRows = [
    [
      {
        name: "organisationName",
        type: "text",
        label: "Organisation Name",
        required: true,
        placeholder: "e.g. Sample Organisation GmbH",
        icon: <Building2 size={18} className="text-gray-400" />,
        description: "Provide your organisation's legal name as registered.",
      },
    ],
    [
      {
        name: "abbreviation",
        type: "text",
        label: "Abbreviation",
        optional: true,
        placeholder: "e.g. DIVK",
      },
    ],
    [
      {
        name: "street",
        type: "text",
        label: "Street & House Number",
        required: true,
        icon: <MapPin size={18} className="text-gray-400" />,
        placeholder: "e.g. Peiner Landstr. 217",
      },
    ],
    [
      {
        name: "city",
        type: "text",
        label: "City",
        required: true,
        placeholder: "e.g. Hildesheim",
      },
      {
        name: "postcode",
        type: "text",
        label: "Postcode",
        required: true,
        placeholder: "e.g. 31135",
      },
      {
        name: "state",
        type: "searchable",
        label: "State",
        optional: true,
        options: stateOptions,
        placeholder: "Select your state...",
      },
    ],
    [
      {
        name: "zulassungNumber",
        type: "text",
        label: "Zulassung Number",
        required: true,
        placeholder: "e.g. ZUL-2026-0001",
        icon: <Hash size={18} className="text-gray-400" />,
        description: "Provide your official licence (Zulassung) number.",
      },
    ],
    [
      {
        name: "sectorFocus",
        type: "text",
        label: "Sector Focus",
        optional: true,
        placeholder: "e.g. Agricultural cooperatives",
      },
    ],
    [
      {
        name: "website",
        type: "text",
        label: "Website",
        optional: true,
        icon: <Globe size={18} className="text-gray-400" />,
        placeholder: "https://www.example.org",
      },
    ],
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-tint rounded-full dark:bg-primary-dark-900/30">
          <Building2 size={32} className="text-blue-600 dark:text-primary/80" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Your Organisation Profile
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Please confirm the details of your organisation. Some fields have been
          pre-filled by our team — check them carefully and complete any gaps.
        </p>
      </div>

      <FormBuilder
        fields={formRows}
        formData={formData}
        handleChange={handleChange}
        handleBlur={handleBlur}
        errors={errors}
      />
    </div>
  );
};

export default Page2;
