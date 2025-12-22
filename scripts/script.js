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

          <button class="details-btn" data-target="${detailsId}">
            More information
          </button>

          <div class="details" id="${detailsId}">
            <p>${paper.abstract}</p>

            <button class="sub-btn" data-target="${citationsId}">
              Citations
            </button>

            <div class="details" id="${citationsId}">
              <div class="citation-block">${paper.citations.bibtex}</div>
              <div class="citation-block">${paper.citations.biblatex}</div>
            </div>
          </div>
        `;

        contentContainer.appendChild(div);
      });

      // gestion des toggles après injection HTML
      contentContainer.querySelectorAll("button[data-target]").forEach(btn => {
        btn.addEventListener("click", () => {
          document
            .getElementById(btn.dataset.target)
            .classList.toggle("open");
        });
      });
    }

    // Création des onglets
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
    console.error("Failed to load papers.json", err);
  });
