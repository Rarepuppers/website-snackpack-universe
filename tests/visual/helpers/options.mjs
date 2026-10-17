// Open the responsive controls through the same button players use.
export async function openOptions(page) {
  const toggle = page.locator(".sp-options-toggle");
  if (await toggle.isVisible() && await toggle.getAttribute("aria-expanded") === "false") {
    await toggle.click();
  }
}
