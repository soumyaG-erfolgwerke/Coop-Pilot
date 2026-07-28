import ProtectedCreateCoop from "@/pages/ProtectedCreateCoop";

export const metadata = {
  title: "Create Cooperative - EasyCoop",
  description: "Create a new cooperative",
};

export default function AddCoop() {
  return <ProtectedCreateCoop />;
}
