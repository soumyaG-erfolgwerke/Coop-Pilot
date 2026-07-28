import React from "react";
import Link from "next/link";

const MobileNavSection = ({ data, onCloseMenu }) => {
  return (
    <>
      {data.map(
        (section) =>
          section.enable && (
            <div key={section.id} className="flex flex-col gap-2 mt-2">
              <p className="text-xs font-semibold tracking-wider uppercase text-primary">
                {section.title}
              </p>
              <div className="flex flex-col gap-1">
                {section.info?.map(
                  (info, idx) =>
                    info.enable && (
                      <Link
                        key={idx}
                        href={info.link}
                        onClick={onCloseMenu}
                        className="flex flex-col px-1 py-2 transition-colors rounded-lg group hover:bg-slate-50"
                      >
                        <span className="text-base font-medium capitalize transition-colors text-slate-700 group-hover:text-primary">
                          {info.heading}
                        </span>
                        <span className="text-xs transition-colors text-slate-400 group-hover:text-slate-500 line-clamp-1">
                          {info.description}
                        </span>
                      </Link>
                    ),
                )}
              </div>
            </div>
          ),
      )}
    </>
  );
};

export default MobileNavSection;
