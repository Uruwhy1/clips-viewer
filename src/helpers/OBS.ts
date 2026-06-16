export async function connectOBS(
  port: string,
  password: string,
): Promise<{ success: boolean; version?: string; error?: string }> {
  try {
    const result = await window.electron.connectOBS(port, password);
    return { success: result.connected, version: result.message };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
