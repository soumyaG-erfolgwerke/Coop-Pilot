import Link from "next/link";
import React from "react";

const NavSection = ({ data }) => {
  return (
    <div className="h-full overflow-y-auto">
      {/* create a grid layout */}
      <div className="flex items-center gap-4">
        {data.map(
          (item) =>
            item.enable && (
              <div
                className="flex flex-row items-center w-full gap-2 rounded-xl"
                key={item.id}
              >
                <div className="flex flex-col w-full gap-1">
                  <p className="px-6 mb-3 text-[22px] font-semibold tracking-widest uppercase text-primary">
                    {item.title}
                  </p>
                  <div className="px-6">
                    <div className="w-full h-[2px] bg-slate-200 mb-1" />
                  </div>
                  <div className="flex flex-col justify-start flex-1">
                    {item.info?.map(
                      (info, index) =>
                        info.enable && (
                          <Link
                            href={info?.link}
                            className="flex flex-row items-center gap-2 px-6 py-4 group hover:bg-[#cfc9cb]"
                            key={index}
                          >
                            {info?.icon}
                            <div className="items-center flex-1 gap-3">
                              <h3 className="text-[18px] transition-all duration-150 ease-in-out text-slate-600 group-hover:text-primary-dark">
                                {info?.heading}
                              </h3>
                              <p className="text-xs transition-all duration-150 ease-in-out text-slate-400 group-hover:text-primary-dark line-clamp-1">
                                {info?.description}
                              </p>
                            </div>
                          </Link>
                        ),
                    )}
                  </div>
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  );
};

export default NavSection;
