import {Navbar} from "@/components/Navbar";

export default function FunctionalLayout({ children }) {
  return (
    <div>
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  );
}
