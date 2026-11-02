import { expect, test, type Page } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 7);

async function createTrack(page: Page, name: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "New track" }).last().click();
  const dialog = page.getByRole("dialog", { name: "New learning track" });
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByLabel("Description").fill("Created by the e2e suite");
  await dialog.getByRole("button", { name: "Create track" }).click();
  await expect(page).toHaveURL(/\/tracks\//);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

async function deleteCurrentTrack(page: Page) {
  await page.getByRole("button", { name: "Track options" }).click();
  await page.getByRole("menuitem", { name: "Delete track" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe.configure({ mode: "serial" });

test("seeded curriculum is present on the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const track of ["Frontend Engineering", "Full Stack Engineering", "AI Engineering"]) {
    await expect(page.getByRole("main").getByText(track).first()).toBeVisible();
  }
  await expect(page.getByText("Overall progress")).toBeVisible();
});

test("full topic CRUD flow persists across reloads", async ({ page }) => {
  const trackName = `E2E Track ${uid()}`;
  await createTrack(page, trackName);

  // Create a topic
  await page.getByRole("button", { name: "New topic" }).click();
  const dialog = page.getByRole("dialog", { name: "New topic" });
  await dialog.getByLabel("Title").fill("Service Workers");
  await dialog.getByLabel("Tags").fill("pwa, offline");
  await dialog.getByRole("button", { name: "Create topic" }).click();
  await expect(page).toHaveURL(/\/topics\//);
  await expect(page.getByLabel("Topic title")).toHaveValue("Service Workers");

  // Status
  await page.getByRole("button", { name: /^Status:/ }).click();
  await page.getByRole("menuitem", { name: "In progress" }).click();
  await expect(page.getByRole("button", { name: "Status: In progress" })).toBeVisible();

  // Rename title
  const title = page.getByLabel("Topic title");
  await title.fill("Service Workers & PWAs");
  await title.press("Enter");

  // Edit a study-guide section (autosave)
  await page.getByText(/Explain the idea in your own words/).click();
  const editor = page.locator("textarea").last();
  await editor.fill("A **service worker** is a network proxy that runs in the background.");
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 8000 });
  await editor.press("Escape");
  await expect(page.locator(".prose-notion strong", { hasText: "service worker" })).toBeVisible();

  // Interview question
  await page.getByRole("tab", { name: /Interview Q&A/ }).click();
  await page.getByRole("button", { name: "Add the first question" }).click();
  await page.getByLabel("Question", { exact: true }).fill("How do service workers enable offline support?");
  await page.getByLabel("Model answer").fill("They intercept fetch events and serve responses from the Cache API.");
  await page.getByRole("button", { name: "Add question" }).last().click();
  await expect(page.getByText("How do service workers enable offline support?")).toBeVisible();

  // Checklist
  await page.getByRole("tab", { name: /Checklist/ }).click();
  const add = page.getByPlaceholder("Add a checklist item and press Enter");
  await add.fill("Register a service worker");
  await add.press("Enter");
  await expect(page.getByRole("checkbox", { name: /Register a service worker/ })).toBeVisible();
  await page.getByRole("checkbox", { name: /Register a service worker/ }).check();
  await expect(page.getByText("1/1 done")).toBeVisible();

  // Note
  await page.getByRole("tab", { name: /My notes/ }).click();
  await page.getByRole("button", { name: "Write the first note" }).click();
  await page.getByLabel("Note title").fill("Caching strategies");
  await page.getByLabel("Note title").press("Enter");
  await page.locator("textarea").last().fill("- cache first\n- network first\n- stale while revalidate");
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 8000 });
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "All notes" }).click();
  await expect(page.getByText("Caching strategies")).toBeVisible();

  // Resource with validation
  await page.getByRole("tab", { name: /Resources/ }).click();
  await page.getByRole("button", { name: "Add link" }).click();
  await page.getByLabel("Link title").fill("MDN Service Worker API");
  await page.getByLabel("URL").fill("developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("link", { name: /MDN Service Worker API/ })).toBeVisible();

  // Persistence
  await page.reload();
  await expect(page.getByLabel("Topic title")).toHaveValue("Service Workers & PWAs");
  await expect(page.getByRole("button", { name: "Status: In progress" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Interview Q&A/ })).toContainText("1");
  await expect(page.getByRole("tab", { name: /Checklist/ })).toContainText("1/1");
  await expect(page.getByRole("tab", { name: /My notes/ })).toContainText("1");

  // Revision logging schedules a review
  await page.getByRole("button", { name: /Log revision/ }).click();
  await page.getByRole("menu").getByRole("button", { name: /Unsure/ }).click();
  await expect(page.getByText("Tomorrow").or(page.getByText(/In \d days/))).toBeVisible();

  // Subtopic
  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Add subtopic" }).click();
  await page.getByRole("dialog").getByLabel("Title").fill("Background Sync");
  await page.getByRole("dialog").getByRole("button", { name: "Create topic" }).click();
  await expect(page.getByLabel("Topic title")).toHaveValue("Background Sync");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Service Workers & PWAs");

  // Search finds the note content
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByPlaceholder("Search topics, notes and questions…").fill("stale while revalidate");
  await expect(page.getByRole("option", { name: /Caching strategies/ }).first()).toBeVisible();
  await page.keyboard.press("Escape");

  // Delete the subtopic
  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Delete topic" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByLabel("Topic title")).toHaveValue("Service Workers & PWAs");

  // Track view shows the topic and progress; then delete the track
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link").first().click();
  await expect(page.getByText("0 of 1 topics")).toBeVisible();
  await deleteCurrentTrack(page);
  await expect(page.getByRole("complementary").getByText(trackName)).toHaveCount(0);
});

test("validation errors are shown for empty input", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New topic" }).click();
  const dialog = page.getByRole("dialog", { name: "New topic" });
  await dialog.getByRole("button", { name: "Create topic" }).click();
  await expect(dialog.getByText("Give the topic a title")).toBeVisible();
  const res = await page.request.post("/api/topics", { data: { title: "" } });
  expect(res.status()).toBe(400);
  const res2 = await page.request.get("/api/topics/does-not-exist");
  expect(res2.status()).toBe(404);
});

test("library filters and practice session work", async ({ page }) => {
  await page.goto("/topics?difficulty=advanced");
  await expect(page.getByText(/\d+ topics?/).first()).toBeVisible();
  const rows = page.locator("a[href^='/topics/']");
  await expect(rows.first()).toBeVisible();

  await page.goto("/practice");
  await page.getByRole("button", { name: "Start session" }).click();
  await page.getByRole("button", { name: /Reveal answer/ }).click();
  await page.getByRole("button", { name: /Good/ }).click();
  await expect(page.getByText(/^2\/\d+$/)).toBeVisible();
});

test("theme toggle switches to dark mode", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("radio", { name: "Light" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("mobile layout uses a drawer for navigation @mobile", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "Frontend Engineering" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Frontend Engineering" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("topics can be reordered with drag handles and the order persists", async ({ page, request }) => {
  const track = await (await request.post("/api/tracks", { data: { name: `Reorder ${uid()}` } })).json();
  for (const title of ["Alpha", "Bravo", "Charlie"]) {
    await request.post("/api/topics", { data: { trackId: track.id, title } });
  }
  await page.goto(`/tracks/${track.id}`);
  const titles = () => page.locator("main a[href^='/topics/'] span.font-medium").allInnerTexts();
  await expect.poll(titles).toEqual(["Alpha", "Bravo", "Charlie"]);

  // Keyboard drag: pick up Alpha, move it down twice, drop.
  const handle = page.getByRole("button", { name: "Reorder Alpha" });
  await handle.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect.poll(titles).toEqual(["Bravo", "Charlie", "Alpha"]);

  await page.waitForTimeout(500);
  await page.reload();
  await expect.poll(titles).toEqual(["Bravo", "Charlie", "Alpha"]);
  await request.delete(`/api/tracks/${track.id}`);
});
