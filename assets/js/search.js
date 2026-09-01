// ===============================
// CONFIG: PAGES A INDEXAR
// ===============================
const PAGES_TO_INDEX = [
    { url: "../index.html", title: "Home" },
    { url: "./aboutus.html", title: "About Us" },
    { url: "./solution.html", title: "Solution" },
    { url: "./impact.html", title: "Impact" },
    { url: "./contact.html", title: "Contact" },
    // { url: "./HF_Home.html", title: "HF Home" }, // si aplica
];


// Elementos que NO queremos indexar (script/style/etc.)
const SKIP_SELECTORS = [
    "script","style","noscript","svg","canvas","iframe","img","video","audio"
    ];

const resultsEl = document.getElementById("results");
const statusEl = document.getElementById("status");
const qInput = document.getElementById("q");
const form = document.getElementById("searchForm");

function escapeHTML(s){
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function getQuery(){
    const params = new URLSearchParams(location.search);
    return (params.get("q") || "").trim();
}

function setQueryInURL(q){
    const params = new URLSearchParams(location.search);
    if(q) params.set("q", q); else params.delete("q");
    history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
}

function normalize(text){
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}

function highlightSnippet(snippet, terms){
    let safe = escapeHTML(snippet);
    for(const t of terms){
        if(!t) continue;
        const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
        safe = safe.replace(re, "<mark>$1</mark>");
    }
    return safe;
}

function extractTextAndAnchors(doc){
    // Remove skip elements
    SKIP_SELECTORS.forEach(sel => doc.querySelectorAll(sel).forEach(n => n.remove()));

    // Build a map of anchorId -> nodeText
    // We'll create synthetic anchors for headings/sections so we can deep-link
    const items = [];

    const candidates = doc.querySelectorAll("h1,h2,h3,h4,h5,h6, p, li, a, section");
    candidates.forEach((node, idx) => {
        const text = (node.innerText || "").trim();
        if(!text || text.length < 12) return;

        // Prefer linking to headings/sections with IDs
        let anchor = "";
        if(node.id) anchor = `#${node.id}`;

        // If it's a heading and has no id, create one on-the-fly (only in search results link)
        if(!anchor && /^H[1-6]$/.test(node.tagName)){
        const slug = "s-" + normalize(text).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g,"").slice(0,50);
        anchor = `#${slug}`;
        }

        items.push({ text, anchor, tag: node.tagName });
    });

    // Also include nav menu text if it exists
    const navText = (doc.querySelector("nav")?.innerText || "").trim();
    if(navText) items.push({ text: navText, anchor: "", tag: "NAV" });

    return items;
}

function scoreMatch(textNorm, terms){
    // Simple scoring: count occurrences
    let score = 0;
    for(const t of terms){
        if(!t) continue;
        const idx = textNorm.indexOf(t);
        if(idx !== -1) score += 3;
        // bonus for multiple occurrences
        const count = (textNorm.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"), "g")) || []).length;
        score += Math.min(count, 5);
    }
    return score;
}

async function fetchAndSearchPage(page, terms){
    const res = await fetch(page.url, { cache: "no-store" });
    if(!res.ok) return [];

    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const items = extractTextAndAnchors(doc);
    const hits = [];

    for(const item of items){
        const norm = normalize(item.text);
        const s = scoreMatch(norm, terms);
        if(s > 0){
        // snippet: take around first term occurrence
        let firstPos = Infinity;
        let firstTerm = "";
        for(const t of terms){
            const p = norm.indexOf(t);
            if(p !== -1 && p < firstPos){ firstPos = p; firstTerm = t; }
        }
        const start = Math.max(0, firstPos - 60);
        const end = Math.min(item.text.length, firstPos + 140);
        const snippet = item.text.slice(start, end);

        hits.push({
            pageTitle: page.title,
            url: page.url + (item.anchor || ""),
            snippet,
            score: s
        });
        }
    }
    return hits;
}

    async function runSearch(q){
    resultsEl.innerHTML = "";
    statusEl.innerHTML = "";

const query = q.trim();
    if(!query){
        statusEl.innerHTML = `<p class="hint">Type something to search.</p>`;
        return;
    }

const terms = normalize(query).split(/\s+/).filter(Boolean);

statusEl.innerHTML = `<p class="hint">Searching…</p>`;

const allHits = [];
    for(const page of PAGES_TO_INDEX){
        try{
        const hits = await fetchAndSearchPage(page, terms);
        allHits.push(...hits);
        }catch(e){
        // ignore
        }
    }

allHits.sort((a,b) => b.score - a.score);

if(allHits.length === 0){
        statusEl.innerHTML = `
        <div class="empty">
            <strong>No matches found.</strong><br>
            Try using fewer keywords, or search related topics on other recycling websites
            (e.g., tire recycling, circular economy, upcycling).
        </div>
        `;
        return;
}

    statusEl.innerHTML = `<p class="hint">${allHits.length} result(s) for "<strong>${escapeHTML(query)}</strong>"</p>`;

    // Render results (limit 20)
    const top = allHits.slice(0, 20);
    resultsEl.innerHTML = top.map(r => `
        <div class="result">
        <a href="${r.url}">${escapeHTML(r.pageTitle)}</a>
        <div class="meta">${escapeHTML(r.url)}</div>
        <div class="snippet">${highlightSnippet(r.snippet, terms)}</div>
        </div>
    `).join("");
}

    // Hook form
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = qInput.value.trim();
    setQueryInURL(q);
    runSearch(q);
});

// Initial run from URL
const initialQ = getQuery();
qInput.value = initialQ;
runSearch(initialQ);