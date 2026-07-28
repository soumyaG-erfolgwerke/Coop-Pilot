import CooperativeDetailPage from "@/pages/CoopDetailsPage";

export const metadata = {
  title: "Cooperative Details - EasyCoop",
  description: "View cooperative details",
};

export default function CooperateDetail({ params }) {
  return <CooperativeDetailPage params={params} />;
}
