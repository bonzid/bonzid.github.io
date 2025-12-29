fetch("papers.json")
  .then(response => response.json())
  .then(papers => {
    const tabsContainer = document.getElementById("tabs");
    const contentContainer = document.getElementById("tab-content");

    const papersByType = {};

    papers.forEach(paper => {
      if (!papersByType[paper.type]) {
        papersByType[paper.type] = [];
      }
      papersByType[paper.type].push(paper);
    });

    const types = Object.keys(papersByType);

    function renderTab(type) {
      contentContainer.innerHTML = "";

      papersByType[type].forEach((paper, index) => {
        const div = document.createElement("div");
        div.className = "paper";

        const detailsId = `details-${type}-${index}`;
        const citationsId = `citations-${type}-${index}`;

        div.innerHTML = `
          <div class="paper-title">
            <a href="${paper.link}" target="_blank">${paper.title}</a>
          </div>

          <div class="paper-meta">
            ${paper.authors.join(", ")} · ${paper.date}
          </div>

          <!-- More information dropdown -->
          <button class="dropdown-btn" data-target="${detailsId}">
            <span>More information</span>
            <span class="arrow">▸</span>
          </button>

          <div class="details" id="${detailsId}">
            <p>${paper.abstract}</p>

            <!-- To cite dropdown -->
            <button class="dropdown-btn sub" data-target="${citationsId}">
              <span>To cite</span>
              <span class="arrow">▸</span>
            </button>

            <div class="details" id="${citationsId}">
              
              <!-- BibTeX -->
              <button class="dropdown-btn subsub" data-target="${citationsId}-bibtex">
                <span>BibTeX</span>
                <span class="arrow">▸</span>
              </button>
              <div class="details" id="${citationsId}-bibtex">
                <div class="citation-block">${paper.citations.bibtex}</div>
              </div>

              <!-- BibLaTeX -->
              <button class="dropdown-btn subsub" data-target="${citationsId}-biblatex">
                <span>BibLaTeX</span>
                <span class="arrow">▸</span>
              </button>
              <div class="details" id="${citationsId}-biblatex">
                <div class="citation-block">${paper.citations.biblatex}</div>
              </div>

            </div>
          </div>
        `;

        contentContainer.appendChild(div);
      });

      // gestion des toggles après injection HTML
    contentContainer.querySelectorAll("button[data-target]").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        target.classList.toggle("open");
        btn.classList.toggle("open");
      });
    });

  }

  // création des onglets
  types.forEach((type, index) => {
    const button = document.createElement("button");
    button.className = "tab-button";
    button.textContent = type;

    if (index === 0) {
      button.classList.add("active");
      renderTab(type);
    }

    button.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-button")
        .forEach(b => b.classList.remove("active"));

      button.classList.add("active");
      renderTab(type);
    });

    tabsContainer.appendChild(button);
  });
  })
  .catch(err => {
    console.error("failed to load papers.json", err);
  });
