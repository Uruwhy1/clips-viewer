document.addEventListener("DOMContentLoaded", async () => {
  const statusDisplay = document.getElementById("obs-status");

  try {
    const result = await window.electron.connectOBS();
    if (result.connected) {
      const status = await window.electron.checkOBSStatus();
      console.log(status);
      statusDisplay.textContent = `OBS Connected (${status.version})`;
    } else {
      statusDisplay.textContent = `Connection Failed: ${result.message}`;
    }
  } catch (error) {
    statusDisplay.textContent = "Connection Error";
    console.error(error);
  }
});
