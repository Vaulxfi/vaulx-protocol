import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock apify-client BEFORE imports.
// Variables prefixed with `mock` are allowed to be referenced from the
// hoisted `vi.mock` factory by vitest's static analysis.
const mockListItems = vi.fn();
const mockCall = vi.fn();
const mockActor = vi.fn(() => ({ call: mockCall }));
const mockDataset = vi.fn(() => ({ listItems: mockListItems }));

vi.mock("apify-client", () => ({
  ApifyClient: vi.fn().mockImplementation(() => ({
    actor: mockActor,
    dataset: mockDataset,
  })),
}));

describe("chrono24PriceViaApify", () => {
  beforeEach(() => {
    vi.resetModules();
    mockListItems.mockReset();
    mockCall.mockReset();
    mockActor.mockClear();
    mockDataset.mockClear();
  });

  afterEach(() => {
    delete process.env.APIFY_API_TOKEN;
  });

  it("returns null when APIFY_API_TOKEN is unset", async () => {
    delete process.env.APIFY_API_TOKEN;
    const { chrono24PriceViaApify } = await import("../chrono24");
    const result = await chrono24PriceViaApify({
      make: "Rolex",
      model: "Submariner",
      ref: "126610LN",
      year: 2020,
      condition: "excellent",
    });
    expect(result).toBeNull();
  });

  it("returns the median when Apify returns >= 3 listings", async () => {
    process.env.APIFY_API_TOKEN = "test-token";
    mockCall.mockResolvedValue({ defaultDatasetId: "ds-1" });
    mockListItems.mockResolvedValue({
      items: [{ price: 12000 }, { price: 14500 }, { price: 13200 }, { price: 14800 }, { price: 13800 }],
    });
    const { chrono24PriceViaApify } = await import("../chrono24");
    const result = await chrono24PriceViaApify({
      make: "Rolex",
      model: "Submariner",
      ref: "126610LN",
      year: 2020,
      condition: "excellent",
    });
    expect(result).toMatchObject({
      ok: true,
      source: "chrono24",
      fallback: false,
    });
    // Median of [12000,13200,13800,14500,14800] = 13800
    expect(result?.value).toBe(13800);
    expect(result?.detail).toContain("Apify");
  });

  it("returns null when Apify returns < 3 listings", async () => {
    process.env.APIFY_API_TOKEN = "test-token";
    mockCall.mockResolvedValue({ defaultDatasetId: "ds-1" });
    mockListItems.mockResolvedValue({ items: [{ price: 12000 }, { price: 13000 }] });
    const { chrono24PriceViaApify } = await import("../chrono24");
    const result = await chrono24PriceViaApify({
      make: "Rolex",
      model: "Submariner",
      ref: "126610LN",
      year: 2020,
      condition: "excellent",
    });
    expect(result).toBeNull();
  });

  it("returns null when Apify throws (graceful failure)", async () => {
    process.env.APIFY_API_TOKEN = "test-token";
    mockCall.mockRejectedValue(new Error("network down"));
    const { chrono24PriceViaApify } = await import("../chrono24");
    const result = await chrono24PriceViaApify({
      make: "Rolex",
      model: "Submariner",
      ref: "126610LN",
      year: 2020,
      condition: "excellent",
    });
    expect(result).toBeNull();
  });

  it("calls the actor with the correct search query", async () => {
    process.env.APIFY_API_TOKEN = "test-token";
    mockCall.mockResolvedValue({ defaultDatasetId: "ds-1" });
    mockListItems.mockResolvedValue({
      items: [{ price: 12000 }, { price: 13000 }, { price: 14000 }],
    });
    const { chrono24PriceViaApify } = await import("../chrono24");
    await chrono24PriceViaApify({
      make: "Rolex",
      model: "Submariner",
      ref: "126610LN",
      year: 2020,
      condition: "excellent",
    });
    expect(mockCall).toHaveBeenCalledWith(
      expect.objectContaining({ searchQuery: "Rolex 126610LN" }),
      expect.any(Object)
    );
  });
});
