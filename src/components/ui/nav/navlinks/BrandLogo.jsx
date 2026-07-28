import Link from "next/link";
import React from "react";
import Brand from "@/assets/images-V2/Gemini_Generated_Image_jb79tijb79tijb79-removebg-preview 1-1.png";
import Image from "next/image";

const BrandLogo = () => {
  return (
    <Link href="/" className="cursor-pointer">
      <Image src={Brand} alt="logo" className="w-auto h-10" />
    </Link>
  );
};

export default BrandLogo;
