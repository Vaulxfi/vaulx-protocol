import { NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getServerUser();
  return NextResponse.json({ user });
}
