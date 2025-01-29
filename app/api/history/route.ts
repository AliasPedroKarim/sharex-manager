import { NextRequest, NextResponse } from "next/server";
import { getAllHistory, searchHistory } from "@/lib/history";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");

    const filters = {
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
      userId: searchParams.get("userId") || undefined,
      uploadMethod: searchParams.get("uploadMethod") as
        | "api"
        | "web"
        | "sharex"
        | undefined,
      searchQuery: searchParams.get("q") || undefined,
    };

    const allItems =
      filters.startDate ||
      filters.endDate ||
      filters.userId ||
      filters.uploadMethod ||
      filters.searchQuery
        ? await searchHistory(filters)
        : await getAllHistory();

    // Calculer l'index de début et de fin pour la pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Extraire les éléments de la page courante
    const items = allItems.slice(startIndex, endIndex);

    return NextResponse.json({
      items,
      total: allItems.length,
      page,
      pageSize,
      totalPages: Math.ceil(allItems.length / pageSize),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}
