import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query");

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
      });
    }

    const response = await fetch(
      `https://api.openregister.de/v1/autocomplete/company?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENREGISTER_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch OpenRegister");
    }

    const data = await response.json();
    // console.log(data)

    const results = (data?.results || [])
      .filter((item) => item.legal_form?.toLowerCase() === "eg")
      .map((item) => ({
        id: item.company_id,
        name: item.name,
        RegNumber: `${item.register_type} ${item.register_number}`,
        CourtName: item.register_court,
        country: item.country,
        legalForm: item.legal_form,
        active: item.active,
      }));

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch cooperatives" },
      { status: 500 },
    );
  }
}
