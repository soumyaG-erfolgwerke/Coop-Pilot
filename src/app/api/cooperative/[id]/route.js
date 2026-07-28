import { NextResponse } from "next/server";

export async function GET(req, context) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Company ID required" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://api.openregister.de/v1/company/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENREGISTER_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch company details");
    }

    const data = await response.json();

    const register_number = `${data.register?.register_type || ""} ${data.register?.register_number || ""}`;

    const company = {
      id: data.id,
      name: data.name?.name || "",
      registerNumber: register_number,
      registerCourt: data.register?.register_court || "",
      legalForm: data.legal_form || "",
      address: {
        street: data.address?.street || "",
        postalCode: data.address?.postal_code || "",
        city: data.address?.city || "",
        country: data.address?.country || "Germany",
      },
      incorporatedAt: data.incorporated_at || "",
      boardMembers:
        data.representation?.map((member) => ({
          name: member.natural_person
            ? `${member.natural_person.first_name || ""} ${member.natural_person.last_name || ""}`
            : member.legal_person?.name || "",
          city: member.natural_person?.city || member.legal_person?.city || "",
        })) || [],
    };
    return NextResponse.json(company);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch company details",
      },
      {
        status: 500,
      },
    );
  }
}
