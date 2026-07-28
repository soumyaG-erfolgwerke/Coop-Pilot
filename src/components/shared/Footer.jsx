import SectionWrapper from "@/layouts/SectionWrapper";

// For Next.js, use direct paths from public folder or import .src
const Instagram = "/icons/Instagram.svg";
const Facebook = "/icons/Facebook.svg";
const Mail = "/icons/Mail.svg";
const MapPin = "/icons/MapPin.svg";
const Phone = "/icons/Phone.svg";
const coopPilotLogo = "/images/CoopPilot.png";

export default function Footer() {
  return (
    <SectionWrapper className="bg-tint">
    <footer className="text-primary-dark max-w-[1460px] mx-auto">
      <div className="flex flex-col items-center gap-6 mx-auto md:items-start md:gap-10">
        {/* Top Section (Logo + Socials) */}
        <div className="flex flex-col items-center md:items-start">
          {/* <h2 className="text-6xl font-bold md:text-8xl">DigiCoop</h2> */}
         
          <img src={coopPilotLogo} alt="CoopPilot Logo" className="max-w-[300px] md:max-w-[400px] h-auto mt-2" />
          <div className="flex justify-start gap-[14.25px] mt-3">
            <a 
              href="#" 
              aria-label="Instagram" 
              className="w-[34.2px] h-[34.2px] border-[0.71px] border-white rounded-[5.7px] p-[2.85px] flex items-center justify-center opacity-100"
            >
              <img src={Instagram} className="object-contain w-full h-full " alt="Instagram" />
            </a>
            <a 
              href="#" 
              aria-label="Facebook" 
              className="w-[34.2px] h-[34.2px] border-[0.71px] border-white rounded-[5.7px] p-[2.85px] flex items-center justify-center opacity-100"
            >
              <img src={Facebook} className="object-contain w-full h-full" alt="Facebook" />
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col w-full gap-8 text-sm text-center md:flex-row md:justify-between md:text-left">
          {/* Contact Info */}
          <div className="space-y-2 md:w-1/3">
            <p className="flex items-center justify-center gap-2 md:justify-start">
              <img src={MapPin} className="w-4 h-4" alt="Location" /> Halbergstraße,4,66121,Saarbrücken
            </p>
            <p className="flex items-center justify-center gap-2 md:justify-start">
              <img src={Mail} className="w-4 h-4" alt="Email" /> post@u-d-g.de
            </p>
            <p className="flex items-center justify-center gap-2 md:justify-start">
              <img src={Phone} className="w-4 h-4" alt="Phone" /> +49 (0) 6542 96 361 83
            </p>
          </div>


          {/* Links Section */}
          <div className="flex flex-col justify-center text-base sm:flex-row sm:gap-16 md:w-2/3 md:justify-end text-custom-neutral-700">
            <div className="mb-6 md:mb-0">
              <h3 className="mb-2 font-semibold">Product</h3>
              <ul className="space-y-1 text-custom-neutral-500">
                <li><a href="#" className="transition-colors hover:text-dark-tint">DigiV</a></li>
                <li><a href="#" className="transition-colors hover:text-dark-tint">Digi Audit</a></li>
              </ul>
            </div>
            <div className="mb-6 md:mb-0">
              <h3 className="mb-2 font-semibold">Who We Serve</h3>
              <ul className="space-y-1 text-custom-neutral-500">
                <li><a href="#" className="transition-colors hover:text-dark-tint">Industry 1</a></li>
                <li><a href="#" className="transition-colors hover:text-dark-tint">Industry 2</a></li>
              </ul>
            </div>
            <div className="mb-6 md:mb-0">
              <h3 className="mb-2 font-semibold">Company</h3>
              <ul className="space-y-1 text-custom-neutral-500">
                <li><a href="#" className="transition-colors hover:text-dark-tint">About</a></li>
                <li><a href="#" className="transition-colors hover:text-dark-tint">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        {/* <div className="flex flex-col justify-between w-full gap-2 pt-4 text-xs text-center border-t border-primary-dark/20 md:flex-row text-shadow-custom-neutral-400 md:text-left">         */}
        <div className="w-full pt-4 flex flex-col md:flex-row justify-between text-xs text-[#7f91af] gap-2 text-center md:text-left">
          <div className="flex flex-wrap justify-center gap-4 md:justify-start">
            <a href="#" className="transition-colors hover:text-dark-tint">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-dark-tint">Terms of Service</a>
            <a href="/cookie-policy" className="transition-colors hover:text-dark-tint">Cookie Policy</a>
          </div>
          <p>© 2025 DigiCoop. All rights reserved.</p>
        </div>
      </div>
    </footer>
    </SectionWrapper>
  );
}
