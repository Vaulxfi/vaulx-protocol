"use client";

/**
 * Best-effort CCB PDF upload to Supabase storage. When Supabase env vars are
 * missing, throws synchronously — callers must wrap in try/catch and treat
 * failure as non-fatal (task 2.8 demo flow).
 */
export async function uploadCcbPdf(
  loanId: string,
  pdfBytes: Uint8Array,
): Promise<{ path: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase not configured; skipping CCB upload.");
  }
  const { createBrowserClient } = await import("@vaulx/supabase/browser");
  const client = createBrowserClient();
  const path = `${loanId}.pdf`;
  const { error } = await client.storage
    .from("ccb-pdfs")
    .upload(path, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return { path };
}
