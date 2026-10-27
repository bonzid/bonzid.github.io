const TYPE_ORDER = [
  "conference papers",
  "journal papers",
  "preprints",
  "other contributions",
  "reports",
  "talks"
];

const ME = "Doria Bonzi";

const MONTHS = ["jan.", "feb.", "mar.", "apr.", "may", "jun.",
                "jul.", "aug.", "sep.", "oct.", "nov.", "dec."];

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function year(date) {
  return String(date || "").slice(0, 4);
}

function longDate(date) {
  const [y, m, d] = String(date || "").split("-");
  if (!m) return y || "";
  const month = MONTHS[parseInt(m, 10) - 1] || "";
  return d ? `${month} ${d}, ${y}` : `${month} ${y}`;
}

function linksRow(paper) {
  const kinds = ["pdf", "code", "dataset", "slides", "poster", "video"];
  const links = kinds
    .filter(k => paper[k])
    .map(k => `<a href="${esc(paper[k])}" target="_blank" rel="noopener">${k}</a>`);
  return links.join(" · ");
}

function coauthors(paper) {
  const others = (paper.authors || []).filter(a => a !== ME);
  return others.length ? `With ${others.map(esc).join(", ")}. ` : "";
}

function paperHeader(paper) {
  const title = paper.link
    ? `<a href="${esc(paper.link)}" target="_blank" rel="noopener"><em>${esc(paper.title)}</em></a>`
    : `<em>${esc(paper.title)}</em>`;
  return `<div class="paper-title">${title} <span class="paper-year">(${esc(year(paper.date))})</span></div>`;
}

function paperMeta(paper) {
  let meta = coauthors(paper);
  if (paper.note) meta += `<strong>${esc(paper.note)}</strong>. `;
  if (paper.venue) meta += `At <em>${esc(paper.venue)}</em>`;
  if (paper.pages) meta += `${paper.venue ? ", " : ""}pp. ${esc(paper.pages)}`;
  if (paper.venue || paper.pages) meta += ". ";
  if (paper.doi) {
    meta += `DOI: <a href="https://doi.org/${esc(paper.doi)}" target="_blank" rel="noopener"><code>${esc(paper.doi)}</code></a>.`;
  }
  return meta ? `<div class="paper-meta">${meta}</div>` : "";
}

function talkHeader(talk) {
  const event = talk.link
    ? `<a href="${esc(talk.link)}" target="_blank" rel="noopener">${esc(talk.event || talk.venue || "")}</a>`
    : esc(talk.event || talk.venue || "");
  const place = talk.place ? `, ${esc(talk.place)}` : "";
  const links = linksRow(talk);
  return `
    <div class="paper-title"><em>${esc(talk.title)}</em></div>
    <div class="paper-meta">${esc(longDate(talk.date))} @ ${event}${place}${links ? " · " + links : ""}</div>
  `;
}

function moreBlock(paper, id) {
  const hasAbstract = paper.abstract && paper.abstract.trim();
  const cit = paper.citations || {};
  const formats = ["biblatex", "bibtex"].filter(f => cit[f]);
  if (!hasAbstract && !formats.length) return "";

  const labels = { biblatex: "BibLaTeX", bibtex: "BibTeX" };

  const abstract = hasAbstract
    ? `<p class="details-label">Abstract.</p>
       <blockquote class="abstract">${esc(paper.abstract)}</blockquote>`
    : "";

  const cite = formats.length
    ? `<p class="details-label">Cite.</p>
       <div class="cite-switch">
         ${formats.map((f, i) => `
           <button type="button" class="cite-btn${i === 0 ? " active" : ""}"
                   data-cite="${id}-${f}">${labels[f]}</button>`).join("")}
         <button type="button" class="copy-btn" data-copy="${id}">copy</button>
       </div>
       ${formats.map((f, i) => `
         <pre class="citation-block${i === 0 ? " shown" : ""}" id="${id}-${f}">${esc(cit[f])}</pre>`).join("")}`
    : "";

  return `
    <button type="button" class="dropdown-btn" data-target="${id}">
      <span>more</span><span class="arrow">▸</span>
    </button>
    <div class="details" id="${id}">${abstract}${cite}</div>
  `;
}

function renderPaper(paper, id) {
  const isTalk = paper.type === "Talks";
  const links = isTalk ? "" : linksRow(paper);
  return `
    <article class="paper">
      ${isTalk ? talkHeader(paper) : paperHeader(paper) + paperMeta(paper)}
      ${links ? `<div class="paper-links">${links}</div>` : ""}
      ${moreBlock(paper, id)}
    </article>
  `;
}

function initResearch() {
  const tabsContainer = document.getElementById("tabs");
  const contentContainer = document.getElementById("tab-content");
  if (!tabsContainer || !contentContainer) return;

  fetch("papers.json")
    .then(response => response.json())
    .then(papers => {

      // regroupement par type
      const byType = {};
      papers.forEach(p => {
        const t = p.type || "Other";
        (byType[t] = byType[t] || []).push(p);
      });

      // tri du plus récent au plus ancien
      Object.values(byType).forEach(list =>
        list.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      );

      const types = [
        ...TYPE_ORDER.filter(t => byType[t]),
        ...Object.keys(byType).filter(t => !TYPE_ORDER.includes(t))
      ];

      function renderTab(type) {
        const slug = type.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        contentContainer.innerHTML = byType[type]
          .map((p, i) => renderPaper(p, `${slug}-${i}`))
          .join("");
      }

      types.forEach((type, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tab-button";
        button.innerHTML = `${esc(type)} <span class="tab-count">${byType[type].length}</span>`;

        button.addEventListener("click", () => {
          tabsContainer.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
          button.classList.add("active");
          renderTab(type);
        });

        if (index === 0) {
          button.classList.add("active");
          renderTab(type);
        }
        tabsContainer.appendChild(button);
      });

      contentContainer.addEventListener("click", e => {
        const toggle = e.target.closest(".dropdown-btn");
        if (toggle) {
          document.getElementById(toggle.dataset.target).classList.toggle("open");
          toggle.classList.toggle("open");
          return;
        }

        const citeBtn = e.target.closest(".cite-btn");
        if (citeBtn) {
          const details = citeBtn.closest(".details");
          details.querySelectorAll(".cite-btn").forEach(b => b.classList.remove("active"));
          details.querySelectorAll(".citation-block").forEach(b => b.classList.remove("shown"));
          citeBtn.classList.add("active");
          document.getElementById(citeBtn.dataset.cite).classList.add("shown");
          return;
        }

        const copyBtn = e.target.closest(".copy-btn");
        if (copyBtn) {
          const block = copyBtn.closest(".details").querySelector(".citation-block.shown");
          if (!block || !navigator.clipboard) return;
          navigator.clipboard.writeText(block.textContent).then(() => {
            copyBtn.textContent = "copied!";
            setTimeout(() => (copyBtn.textContent = "copy"), 1500);
          });
        }
      });
    })
    .catch(err => {
      console.error("failed to load papers.json", err);
      contentContainer.innerHTML = `<p class="paper-meta">Could not load publications.${hint}</p>`;
    });
}


function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const status = document.getElementById("form-status");
  const submit = form.querySelector("button[type=submit]");
  const fallbackEmail = form.dataset.email;

  function describeError(data, httpStatus) {
    const err = data.error ?? data.message ?? data.errors;
    if (!err) return `error ${httpStatus}`;
    if (typeof err === "string") return err;
    if (Array.isArray(err)) return err.map(x => (typeof x === "string" ? x : x.message || JSON.stringify(x))).join("; ");
    return err.message || err.code || JSON.stringify(err);
  }

  function showError(reason) {
    status.className = "form-status error";
    status.innerHTML = `oops, the message could not be sent (${reason}). `
      + `you can write to me directly at <a href="mailto:${fallbackEmail}">${fallbackEmail}</a>.`;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();

    submit.disabled = true;
    status.className = "form-status";
    status.textContent = "sending…";

    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok !== false) {
        status.className = "form-status ok";
        status.textContent = "thanks, your message has been sent!";
        form.reset();
      } else {
        console.error("formsubmit.app response:", res.status, data);
        showError(describeError(data, res.status));
      }
    } catch (err) {
      console.error(err);
      showError(err.message);
    } finally {
      submit.disabled = false;
    }
  });
}


document.addEventListener("DOMContentLoaded", () => {
  initResearch();
  initContactForm();
});