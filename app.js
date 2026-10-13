const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const results = document.getElementById("results");
const status = document.getElementById("status");
const chips = document.getElementById("chips");

const API = "https://commons.wikimedia.org/w/api.php";
const LIMIT = 12;

// Wikimedia returns the artist as an HTML snippet; keep only the text.
function plainText(html) {
  return new DOMParser().parseFromString(html || "", "text/html").body.textContent.trim();
}

function cleanTitle(title) {
  return title.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ");
}

function buildCard(page, number) {
  const info = page.imageinfo[0];
  const meta = info.extmetadata || {};
  const author = plainText(meta.Artist && meta.Artist.value) || "Unknown";
  const title = cleanTitle(page.title);

  const card = document.createElement("figure");
  card.className = "card";

  // Enhancement: the whole card links to the full image in a new tab.
  const link = document.createElement("a");
  link.href = info.descriptionurl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const frame = document.createElement("span");
  frame.className = "frame";
  frame.textContent = "FRAME " + String(number).padStart(2, "0");

  const img = document.createElement("img");
  img.src = info.thumburl || info.url;
  img.alt = title;
  img.loading = "lazy";

  const caption = document.createElement("figcaption");
  const titleEl = document.createElement("span");
  titleEl.className = "title";
  titleEl.textContent = title;
  titleEl.title = title;
  const authorEl = document.createElement("span");
  authorEl.className = "author";
  authorEl.textContent = "by " + author;
  caption.append(titleEl, authorEl);

  link.append(frame, img, caption);
  card.appendChild(link);
  return card;
}

async function search(query) {
  const url =
    API +
    "?action=query&format=json&origin=*&generator=search&gsrnamespace=6" +
    "&gsrlimit=" + LIMIT +
    "&gsrsearch=" + encodeURIComponent("filetype:bitmap " + query) +
    "&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=480";

  const response = await fetch(url);
  if (!response.ok) {
    status.textContent = "Request failed (" + response.status + ").";
    return;
  }
  const data = await response.json();
  const pages = data.query ? Object.values(data.query.pages) : [];
  pages.sort((a, b) => a.index - b.index);

  results.innerHTML = "";
  const withImages = pages.filter((p) => p.imageinfo && p.imageinfo.length);
  withImages.forEach((page, i) => results.appendChild(buildCard(page, i + 1)));

  status.textContent = "";
  const count = document.createElement("strong");
  count.textContent = withImages.length;
  status.append("Showing ", count, " results for “" + query + "”");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  await search(query);
});

// Quick-pick chips fill the input and run the same submit path.
chips.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  input.value = chip.dataset.query;
  form.requestSubmit();
});
