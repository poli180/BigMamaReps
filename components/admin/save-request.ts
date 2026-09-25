export async function saveRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (response.ok && options?.method && options.method !== "GET") {
    try {
      localStorage.setItem("bmr-catalog-saved", Date.now().toString());
    } catch {}
  }
  return response;
}
