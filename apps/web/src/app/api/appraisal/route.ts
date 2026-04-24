import { NextResponse } from "next/server";
import { z } from "zod";
import { aggregate } from "@/lib/appraisal/aggregate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const InputSchema = z.object({
  make: z.string().min(1).max(64),
  model: z.string().min(1).max(128),
  ref: z.string().min(1).max(64),
  year: z.number().int().min(1900).max(2100),
  condition: z.enum(["mint", "excellent", "very_good", "good"]),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const resp = await aggregate(parsed.data);

  if (resp.okCount === 0) {
    return NextResponse.json(
      { error: "no sources responded" },
      { status: 502 },
    );
  }

  return NextResponse.json(resp, {
    status: 200,
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
