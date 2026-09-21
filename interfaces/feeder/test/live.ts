export const LIVE_URL = process.env.PRESETS_URL ?? "http://127.0.0.1:8787/graphql";

export async function servicePresent(): Promise<boolean> {
  try {
    const answer = await fetch(LIVE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
      signal: AbortSignal.timeout(2000),
    });
    return answer.ok;
  } catch {
    return false;
  }
}
