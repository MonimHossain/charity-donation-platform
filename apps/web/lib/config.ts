/** When true, public/admin UIs use lib/mock and local stores instead of the API. */
export const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ||
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === "1";
