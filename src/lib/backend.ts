export function getBackendBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const baseUrl = configured && configured.length > 0 ? configured : "http://localhost:8000";
  return (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")
    ? baseUrl
    : `https://${baseUrl}`).replace(/\/+$/, "");
}

export function getBackendUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
}
