(function () {
  var STORAGE_KEY = "portfolio-view";
  var THEME_KEY = "portfolio-theme";
  var body = document.body;
  var humanBtn = document.getElementById("view-human");
  var agentBtn = document.getElementById("view-agent");
  var jsonPre = document.getElementById("agent-json");
  var jsonError = document.getElementById("agent-json-error");
  var profileCards = document.getElementById("agent-profile-cards");
  var cardsLoading = document.getElementById("agent-cards-loading");
  var schemaVersion = document.getElementById("agent-schema-version");
  var schemaUpdated = document.getElementById("agent-schema-updated");
  var cachedProfile = null;

  function setView(view) {
    if (view !== "human" && view !== "agent") view = "human";
    body.setAttribute("data-view", view);
    if (humanBtn) {
      humanBtn.setAttribute("aria-selected", view === "human");
      humanBtn.setAttribute("tabindex", view === "human" ? "0" : "-1");
    }
    if (agentBtn) {
      agentBtn.setAttribute("aria-selected", view === "agent");
      agentBtn.setAttribute("tabindex", view === "agent" ? "0" : "-1");
    }
    try {
      localStorage.setItem(STORAGE_KEY, view);
    } catch (_) {}

    if (view === "agent") {
      loadAgentData();
    }
  }

  function loadAgentData() {
    if (cachedProfile) {
      renderRawJson(cachedProfile);
      renderProfileCards(cachedProfile);
      renderSchemaMeta(cachedProfile);
      return;
    }

    if (jsonPre) jsonPre.textContent = "Loading…";
    if (cardsLoading) cardsLoading.textContent = "Loading profile data…";
    if (jsonError) jsonError.textContent = "";

    fetch("profile.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(function (data) {
        cachedProfile = data;
        renderRawJson(data);
        renderProfileCards(data);
        renderSchemaMeta(data);
      })
      .catch(function (err) {
        if (jsonPre) jsonPre.textContent = "";
        if (cardsLoading) cardsLoading.textContent = "Could not load profile data.";
        if (jsonError) {
          jsonError.textContent =
            "Could not load profile.json: " + (err.message || String(err));
        }
      });
  }

  function renderRawJson(data) {
    if (jsonPre) jsonPre.textContent = JSON.stringify(data, null, 2);
  }

  function renderSchemaMeta(data) {
    if (schemaVersion && data.version) {
      schemaVersion.textContent = "v" + data.version;
    }
    if (schemaUpdated && data.lastUpdated) {
      schemaUpdated.textContent = "Updated " + data.lastUpdated;
    }
  }

  // --- Profile card renderer ---

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "className") node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        if (typeof children[i] === "string") {
          node.appendChild(document.createTextNode(children[i]));
        } else if (children[i]) {
          node.appendChild(children[i]);
        }
      }
    }
    return node;
  }

  function makeCard(title, content) {
    var card = el("div", { className: "agent-card" });
    card.appendChild(el("h3", { className: "agent-card__title", text: title }));
    if (typeof content === "string") {
      card.innerHTML += content;
    } else if (content) {
      card.appendChild(content);
    }
    return card;
  }

  function makeDl(pairs) {
    var dl = el("dl", { className: "agent-card__dl" });
    for (var i = 0; i < pairs.length; i++) {
      if (pairs[i][1] == null || pairs[i][1] === "") continue;
      dl.appendChild(el("dt", { text: pairs[i][0] }));
      var dd = el("dd");
      if (pairs[i][2] === "link") {
        var a = el("a", { href: pairs[i][1], target: "_blank", rel: "noopener", text: pairs[i][1] });
        dd.appendChild(a);
      } else if (pairs[i][2] === "email") {
        dd.appendChild(el("a", { href: "mailto:" + pairs[i][1], text: pairs[i][1] }));
      } else {
        dd.textContent = pairs[i][1];
      }
      dl.appendChild(dd);
    }
    return dl;
  }

  function makeList(items) {
    var ul = el("ul");
    for (var i = 0; i < items.length; i++) {
      ul.appendChild(el("li", { text: items[i] }));
    }
    return ul;
  }

  function makeLabel(text) {
    return el("p", { className: "agent-card__label", text: text });
  }

  function renderProfileCards(data) {
    if (!profileCards) return;
    profileCards.innerHTML = "";

    renderIdentityCard(data);
    renderCurrentRolesCard(data);
    renderWorkHistoryCard(data);
    renderEducationCard(data);
    renderSkillsCard(data);
    renderImpactCard(data);
    renderOpenToCard(data);
    renderAgentHintsCard(data);
  }

  function renderIdentityCard(d) {
    var linkedin = "";
    if (d.sameAs) {
      for (var i = 0; i < d.sameAs.length; i++) {
        if (d.sameAs[i].indexOf("linkedin") !== -1) { linkedin = d.sameAs[i]; break; }
      }
    }
    var pairs = [
      ["Name", d.name],
      ["Title", d.jobTitle],
      ["Location", d.location],
      ["Email", d.email, "email"],
      ["Phone", d.telephone],
      ["Site", d.url, "link"],
      ["LinkedIn", linkedin, "link"]
    ];
    profileCards.appendChild(makeCard("Identity", makeDl(pairs)));
  }

  function renderCurrentRolesCard(d) {
    var frag = document.createDocumentFragment();

    if (d.worksFor) {
      var block = el("div", { className: "agent-card__block" });
      block.appendChild(el("p", { className: "agent-card__subtitle", text: d.worksFor.name }));
      var roleRows = [["Role", d.worksFor.role]];
      if (d.worksFor.division) {
        roleRows.push(["Division", d.worksFor.division]);
      }
      block.appendChild(makeDl(roleRows));
      frag.appendChild(block);
    }

    if (d.currentVenture) {
      var v = d.currentVenture;
      var block2 = el("div", { className: "agent-card__block" });
      block2.appendChild(el("p", { className: "agent-card__subtitle", text: v.name }));
      block2.appendChild(makeDl([
        ["Role", v.role],
        ["Since", v.startDate],
        ["Tagline", v.tagline]
      ]));
      if (v.keyInnovation) {
        block2.appendChild(makeLabel("Key Innovation"));
        block2.appendChild(el("p", { text: v.keyInnovation, className: "agent-card__entry-summary" }));
      }
      if (v.valueProposition && v.valueProposition.length) {
        block2.appendChild(makeLabel("Value Proposition"));
        block2.appendChild(makeList(v.valueProposition));
      }
      if (v.achievements && v.achievements.length) {
        block2.appendChild(makeLabel("Achievements"));
        block2.appendChild(makeList(v.achievements));
      }
      frag.appendChild(block2);
    }

    profileCards.appendChild(makeCard("Current Roles", frag));
  }

  function renderWorkHistoryCard(d) {
    if (!d.workHistory || !d.workHistory.length) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < d.workHistory.length; i++) {
      var w = d.workHistory[i];
      var entry = el("div", { className: "agent-card__entry" });
      var org = w.organization || "";
      var div = w.division ? " (" + w.division + ")" : (w.team ? " — " + w.team : "");
      entry.appendChild(el("p", { className: "agent-card__entry-title", text: w.role + " — " + org + div }));
      var end = w.endDate || "Present";
      entry.appendChild(el("p", { className: "agent-card__entry-dates", text: (w.startDate || "") + " → " + end }));
      if (w.summary) {
        entry.appendChild(el("p", { className: "agent-card__entry-summary", text: w.summary }));
      }
      frag.appendChild(entry);
    }
    profileCards.appendChild(makeCard("Work History (" + d.workHistory.length + " roles)", frag));
  }

  function renderEducationCard(d) {
    if (!d.education || !d.education.length) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < d.education.length; i++) {
      var e = d.education[i];
      var entry = el("div", { className: "agent-card__entry" });
      entry.appendChild(el("p", { className: "agent-card__entry-title", text: e.degree + " — " + e.institution }));
      var meta = [];
      if (e.endDate) meta.push(e.status ? e.status + " " + e.endDate : e.endDate);
      if (e.location) meta.push(e.location);
      if (meta.length) entry.appendChild(el("p", { className: "agent-card__entry-dates", text: meta.join(" · ") }));
      if (e.crossRegisteredAt) {
        entry.appendChild(el("p", { className: "agent-card__entry-summary", text: "Cross-registered: " + e.crossRegisteredAt }));
      }
      if (e.specializations && e.specializations.length) {
        entry.appendChild(el("p", { className: "agent-card__entry-summary", text: "Focus: " + e.specializations.join(", ") }));
      }
      if (e.focusAreas && e.focusAreas.length) {
        entry.appendChild(el("p", { className: "agent-card__entry-summary", text: "Focus: " + e.focusAreas.join(", ") }));
      }
      if (e.honors && e.honors.length) {
        entry.appendChild(el("p", { className: "agent-card__entry-summary", text: e.honors.join("; ") }));
      }
      frag.appendChild(entry);
    }
    profileCards.appendChild(makeCard("Education", frag));
  }

  function renderSkillsCard(d) {
    if (!d.skills) return;
    var frag = document.createDocumentFragment();
    var labels = {
      aiAndML: "AI & ML",
      cloudAndInfrastructure: "Cloud & Infrastructure",
      programming: "Programming & Development",
      business: "Business & Strategy"
    };
    for (var key in d.skills) {
      if (!d.skills[key] || !d.skills[key].length) continue;
      frag.appendChild(makeLabel(labels[key] || key));
      frag.appendChild(makeList(d.skills[key]));
    }
    profileCards.appendChild(makeCard("Skills Taxonomy", frag));
  }

  function renderImpactCard(d) {
    if (!d.selectedImpact || !d.selectedImpact.length) return;
    profileCards.appendChild(makeCard("Selected Impact", makeList(d.selectedImpact)));
  }

  function renderOpenToCard(d) {
    if (!d.openTo || !d.openTo.length) return;
    profileCards.appendChild(makeCard("Open To", makeList(d.openTo)));
  }

  function renderAgentHintsCard(d) {
    if (!d.agentHints) return;
    var h = d.agentHints;
    var pairs = [
      ["Preferred contact", h.preferredContact],
      ["Human site", h.humanReadableSite],
      ["llms.txt", h.llmsTxtPath],
      ["profile.json", h.profileJsonPath],
      ["Agent page", h.agentPagePath, "link"],
      ["Human page", h.humanPagePath, "link"],
      ["Time travel", h.timeTravelPath, "link"],
      ["Note", h.note]
    ];
    profileCards.appendChild(makeCard("Agent Hints", makeDl(pairs)));
  }

  // --- Copy buttons ---

  function initCopyButtons() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".agent-copy-btn");
      if (!btn) return;

      var copyTarget = btn.getAttribute("data-copy-target");
      var text = "";

      if (copyTarget) {
        text = window.location.origin + "/" + copyTarget;
      } else if (btn.id === "agent-copy-json" && jsonPre) {
        text = jsonPre.textContent;
      }

      if (!text) return;

      navigator.clipboard.writeText(text).then(function () {
        var orig = btn.textContent;
        btn.textContent = "Copied";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = orig;
          btn.classList.remove("copied");
        }, 1500);
      });
    });
  }

  // --- Init ---

  var saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (_) {}

  if (saved === "agent" || saved === "human") {
    setView(saved);
  } else {
    setView("human");
  }

  if (humanBtn) {
    humanBtn.addEventListener("click", function () {
      setView("human");
    });
  }
  if (agentBtn) {
    agentBtn.addEventListener("click", function () {
      setView("agent");
    });
  }

  initCopyButtons();

  // --- Theme toggle ---

  var themeBtn = document.getElementById("theme-toggle");
  function cycleTheme() {
    var el = document.documentElement;
    var s = null;
    try {
      s = localStorage.getItem(THEME_KEY);
    } catch (_) {}
    try {
      if (s === null) {
        localStorage.setItem(THEME_KEY, "light");
        el.setAttribute("data-theme", "light");
      } else if (s === "light") {
        localStorage.setItem(THEME_KEY, "dark");
        el.setAttribute("data-theme", "dark");
      } else {
        localStorage.removeItem(THEME_KEY);
        el.removeAttribute("data-theme");
      }
    } catch (_) {}
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", cycleTheme);
  }

  // --- Active nav section tracking ---

  var navSectionIds = [
    "venture",
    "highlights",
    "stories",
    "experience",
    "education",
    "more",
  ];
  var navLinks = document.querySelectorAll(
    '.site-header__links a[href^="#"]'
  );
  var sectionElements = navSectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  if (
    sectionElements.length &&
    navLinks.length &&
    "IntersectionObserver" in window
  ) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            var href = link.getAttribute("href") || "";
            if (href.charAt(0) !== "#") return;
            var slug = href.slice(1);
            if (navSectionIds.indexOf(slug) === -1) return;
            if (slug === id) link.classList.add("is-active");
            else link.classList.remove("is-active");
          });
        });
      },
      {
        rootMargin: "-38% 0px -42% 0px",
        threshold: 0,
      }
    );
    sectionElements.forEach(function (el) {
      observer.observe(el);
    });
  }
})();
