import GetInTouch from "@/components/about_v2/GetInTouch";
import HowWeStart from "@/components/about_v2/HowWeStart";
import CoopRoot from "@/components/about_v2/CoopRoot";
import Legacy from "@/components/about_v2/Legacy";
import OurPartners from "@/components/about_v2/OurPartners";
import OurVision from "@/components/about_v2/OurVision";
import WeAreHere from "@/components/about_v2/WeAreHere";
import AboutHero from "@/components/about_v2/AboutHero";
import Quote from "@/components/about_v2/Quote";

const AboutPage = () => {
  return (
    <div className="">
      <AboutHero />
      <WeAreHere />
      <OurVision />
      <CoopRoot />
      <HowWeStart />
      <Legacy />
      <OurPartners />
      <GetInTouch />
      <Quote />
    </div>
  );
};

export default AboutPage;
