// Clip creation is not implemented in Electron yet
export default async function createClipHandler() {
  console.warn("Clip creation is not implemented in Electron");
  return { response: false, error: "Not implemented" };
}