// "use client";
// import React, { useState } from "react";
// const german = "/icons/german.webp";
// const uk = "/icons/uk.webp";
// const LanguageSelect = () => {
//   const [language, setLanguage] = useState("en");
//   const [open, setOpen] = useState(false);

//   const languages = {
//     en: { label: "English", img: german }, // UK flag
//     de: { label: "Deutsch", img: uk }, // Germany flag
//   };

"use client";
import React, { useState, useMemo } from "react";
const german = "/icons/german.webp";
const uk = "/icons/uk.webp";

const LanguageSelect = () => {
  const languages = {
    en: { label: "English", img: uk, url: "https://en.easy-coop.de" },
    de: { label: "Deutsch", img: german, url: "https://de.easy-coop.de" },
  };

  // Detect current language from hostname subdomain
  const currentLang = useMemo(() => {
    if (typeof window === "undefined") return "de";
    const host = window.location.hostname;
    if (host.startsWith("en.")) return "en";
    return "de";
  }, []);

  const [open, setOpen] = useState(false);

  const handleLanguageSwitch = (key) => {
    if (key !== currentLang) {
      window.location.href = languages[key].url;
    }
  };
  
  //   return (
  //   <div className="border rounded-md border-black/15">
  //     {/* Desktop: flag-only */}
  //     <div className="hidden [@media(min-width:940px)]:flex items-center gap-1">
  //       {Object.entries(languages).map(([key, { label, img }]) => (
  //         <button
  //           key={key}
  //           onClick={() => setLanguage(key)}
  //           className={`p-1 rounded-md transition flex items-center justify-center ${
  //             language === key ? "bg-dark-tint" : ""
  //           }`}
  //           title={label}
  //         >
  //           <img
  //             src={img}
  //             alt={label}
  //             style={{
  //               width: "1.5rem",
  //               height: "1.5rem",
  //               display: "inline-block",
  //             }}
  //           />
  //         </button>
  //       ))}
  //     </div>

  //     {/* Mobile: custom dropdown with flags + labels */}
  //     <div className="relative flex [@media(min-width:940px)]:hidden w-full text-black">
  //       <button
  //         onClick={() => setOpen(!open)}
  //         className="flex items-center justify-between w-full p-2 bg-white border rounded-md border-black/15"
  //       >
  //         <span className="flex items-center gap-2">
  //           <img
  //             src={languages[language].img}
  //             alt={languages[language].label}
  //             style={{ width: "1.5rem", height: "1.5rem" }}
  //           />
  //           {languages[language].label}
  //         </span>
  //         <span className="text-gray-500">▼</span>
  //       </button>

  //       {open && (
  //         <ul className="absolute left-0 z-10 w-full bg-white border rounded-md shadow-md top-full border-black/15">
  //           {Object.entries(languages).map(([key, { label, img }]) => (
  //             <li key={key}>
  //               <button
  //                 onClick={() => {
  //                   setLanguage(key);
  //                   setOpen(false);
  //                 }}
  //                 className="flex items-center w-full gap-2 p-2 hover:bg-gray-100"
  //               >
  //                 <img
  //                   src={img}
  //                   alt={label}
  //                   style={{ width: "1.5rem", height: "1.5rem" }}
  //                 />
  //                 {label}
  //               </button>
  //             </li>
  //           ))}
  //         </ul>
  //       )}
  //     </div>
  //   </div>
  // );
  return (
    <div className="border rounded-md border-black/15">
      {/* Desktop: flag-only */}
      <div className="hidden [@media(min-width:940px)]:flex items-center gap-1">
        {Object.entries(languages).map(([key, { label, img }]) => (
          <button
            key={key}
            onClick={() => handleLanguageSwitch(key)}
            className={`p-1 rounded-md transition flex items-center justify-center ${
              currentLang === key ? "bg-dark-tint" : ""
            }`}
            title={label}
          >
            <img
              src={img}
              alt={label}
              style={{
                width: "1.5rem",
                height: "1.5rem",
                display: "inline-block",
              }}
            />
          </button>
        ))}
      </div>

      {/* Mobile: custom dropdown with flags + labels */}
      <div className="relative flex [@media(min-width:940px)]:hidden w-full text-black">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full p-2 bg-white border rounded-md border-black/15"
        >
          <span className="flex items-center gap-2">
            <img
              src={languages[currentLang].img}
              alt={languages[currentLang].label}
              style={{ width: "1.5rem", height: "1.5rem" }}
            />
            {languages[currentLang].label}
          </span>
          <span className="text-gray-500">▼</span>
        </button>

        {open && (
          <ul className="absolute left-0 z-10 w-full bg-white border rounded-md shadow-md top-full border-black/15">
            {Object.entries(languages).map(([key, { label, img }]) => (
              <li key={key}>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLanguageSwitch(key);
                  }}
                  className="flex items-center w-full gap-2 p-2 hover:bg-gray-100"
                >
                  <img
                    src={img}
                    alt={label}
                    style={{ width: "1.5rem", height: "1.5rem" }}
                  />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LanguageSelect;
