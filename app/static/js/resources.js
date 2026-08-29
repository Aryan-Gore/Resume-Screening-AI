/**
 * Resume Resources — search, category filtering, and a resource preview modal.
 *
 * Mirrors the structure of career-hub.js and is equally self-contained: one
 * IIFE, its own state, and it only touches elements inside .resource-hub and
 * #resource-modal. None of the eight resources below link to a real file —
 * `available` gates whether a card opens a written preview or renders as
 * "Coming soon," so a real download can be wired in later without changing
 * this file's shape or breaking any markup.
 */
(function () {
  'use strict';

  var resumeResources = [
    {
      id: 1,
      category: `Resume Templates`,
      title: `ATS-Friendly Software Developer Resume`,
      description: `A clean structure designed for ATS compatibility, built around the sections recruiters and parsers both expect.`,
      type: `Template`,
      icon: `file-text`,
      available: true,
      intro: `This template favors a single-column layout with clearly labeled sections — the format most parsers handle most reliably. Use it as a starting structure, then fill in your own experience.`,
      items: [
        `Header — name, phone, email, city, and links (portfolio, GitHub, LinkedIn)`,
        `Summary — two to three lines connecting your background to the target role`,
        `Technical skills — grouped by category (languages, frameworks, tools)`,
        `Experience — reverse-chronological, with outcome-focused bullet points`,
        `Projects — optional, for notable personal or open-source work`,
        `Education and certifications`
      ]
    },
    {
      id: 2,
      category: `Resume Examples`,
      title: `Software Engineer Resume Example`,
      description: `What a strong software engineer resume emphasizes, from bullet structure to length.`,
      type: `Example`,
      icon: `file-code`,
      available: true,
      intro: `Rather than a filled-in sample resume, this preview walks through the patterns that consistently distinguish stronger software engineer resumes from weaker ones.`,
      items: [
        `Leads each bullet with an action verb and the outcome, not just the task`,
        `Quantifies impact where possible — latency reduced, throughput increased, incidents avoided`,
        `Lists a focused, current tech stack rather than every technology ever touched`,
        `Keeps to one page for under about 10 years of experience, two at most beyond that`,
        `Includes one or two project highlights if early-career or changing specialization`
      ]
    },
    {
      id: 3,
      category: `Resume Examples`,
      title: `Frontend Developer Resume Example`,
      description: `Patterns that work well for frontend and UI-focused roles.`,
      type: `Example`,
      icon: `monitor`,
      available: true,
      intro: `Frontend roles benefit from resumes that make craft and impact equally visible — this preview covers what to prioritize.`,
      items: [
        `Links to a live portfolio or deployed projects near the top of the resume`,
        `Calls out performance, accessibility, or UX wins with specific results`,
        `Names the frameworks and tooling used, and how recently`,
        `Mentions collaboration with design or product, not just implementation`,
        `Shows range across at least one substantial project, not only small tasks`
      ]
    },
    {
      id: 4,
      category: `Resume Examples`,
      title: `Data Analyst Resume Example`,
      description: `How strong data analyst resumes present tools, methods, and business impact.`,
      type: `Example`,
      icon: `bar-chart-2`,
      available: true,
      intro: `Data analyst resumes tend to stand out when they connect technical work directly to a business outcome — here's what that looks like in practice.`,
      items: [
        `Names specific tools — SQL, Python, Excel, BI platforms — rather than "data analysis" generically`,
        `Ties each analysis or dashboard to a decision or metric it influenced`,
        `Quantifies scale — size of dataset, frequency of reporting, size of audience`,
        `Shows both the technical work and how it was communicated to stakeholders`,
        `Describes visualizations and dashboards briefly rather than just listing them by name`
      ]
    },
    {
      id: 5,
      category: `ATS-Friendly Formats`,
      title: `ATS Resume Formatting Checklist`,
      description: `A quick set of formatting checks to run before submitting through an online application portal.`,
      type: `Checklist`,
      icon: `list-checks`,
      available: true,
      intro: `Run through this before submitting to any online application portal — most of these take under a minute to check.`,
      items: [
        `Standard section headings ("Experience," "Education," "Skills") rather than creative alternatives`,
        `Single-column layout — avoid multi-column designs and text boxes`,
        `No essential information inside headers, footers, images, or graphics`,
        `Consistent, simple date format throughout (e.g., "Jan 2023 – Present")`,
        `Standard fonts and simple bullet characters, no special symbols`,
        `File saved in the format the posting requests, usually PDF or .docx`,
        `Key terms from the job description reflected naturally in your own words`
      ]
    },
    {
      id: 6,
      category: `Skill Guides`,
      title: `Technical Skills Checklist`,
      description: `A framework for inventorying and presenting your technical skills clearly.`,
      type: `Checklist`,
      icon: `wrench`,
      available: true,
      intro: `Use this to organize your skills section so it's easy to scan and honest about depth.`,
      items: [
        `Group skills by category — languages, frameworks, tools, platforms`,
        `List skills you can discuss confidently in an interview, not just ones you've briefly tried`,
        `Prioritize the skills most relevant to the specific role at the top of each group`,
        `Avoid listing basic tools like email or spreadsheets unless the role specifically calls for them`,
        `Update the list for each application rather than reusing one static version indefinitely`
      ]
    },
    {
      id: 7,
      category: `Interview Question Sets`,
      title: `Software Developer Interview Questions`,
      description: `A representative set of questions across coding, system design, and behavioral rounds.`,
      type: `Question set`,
      icon: `help-circle`,
      available: true,
      intro: `A representative spread of the question types that come up across a typical developer interview loop.`,
      items: [
        `Coding: "Walk me through your approach before you write any code."`,
        `System design, for mid-to-senior roles: "How would you design a URL shortener?"`,
        `Debugging: "Tell me about a bug that took a long time to track down."`,
        `Behavioral: "Tell me about a time you disagreed with a teammate on a technical decision."`,
        `For the interviewer: "What does a strong first six months in this role look like?"`
      ]
    },
    {
      id: 8,
      category: `Cover Letter Examples`,
      title: `Professional Cover Letter Template`,
      description: `A simple, adaptable structure for a one-page cover letter.`,
      type: `Template`,
      icon: `mail`,
      available: true,
      intro: `A short, adaptable structure that works for most roles — fill in the brackets with specifics for each application.`,
      items: [
        `Opening — the role you're applying for and one sentence on why it interests you`,
        `Paragraph 1 — the experience most relevant to the posting's key requirement`,
        `Paragraph 2 — a specific accomplishment that demonstrates a second requirement`,
        `Closing — a brief, confident call to action and thanks for their time`,
        `Keep the whole letter under one page — three to four short paragraphs is enough`
      ]
    }
  ];

  var state = {
    category: 'all',
    query: ''
  };

  var lastFocusedEl = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var root = document.querySelector('.resource-hub');
    var grid = document.getElementById('resource-cards-grid');
    if (!root || !grid) return; // section isn't on this page — bail out quietly

    var searchInput = document.getElementById('resource-search-input');
    var filterButtons = toArray(root.querySelectorAll('.resource-filter-btn'));
    var modal = document.getElementById('resource-modal');

    renderResources(getVisibleResources());

    if (searchInput) {
      searchInput.addEventListener('input', function (event) {
        state.query = event.target.value || '';
        renderResources(getVisibleResources());
      });
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.category = btn.getAttribute('data-category') || 'all';
        setActiveFilter(filterButtons, btn);
        renderResources(getVisibleResources());
      });
    });

    grid.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-open-resource]');
      if (!trigger || trigger.disabled) return;
      openResourceModal(Number(trigger.getAttribute('data-open-resource')));
    });

    if (modal) {
      modal.addEventListener('click', function (event) {
        if (event.target === modal || event.target.closest('[data-close-resource-modal]')) {
          closeResourceModal();
        }
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
          closeResourceModal();
        }
      });
    }
  }

  function getVisibleResources() {
    return searchResources(filterResources(resumeResources, state.category), state.query);
  }

  function filterResources(list, category) {
    if (!category || category === 'all') return list;
    return list.filter(function (resource) { return resource.category === category; });
  }

  function searchResources(list, query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(function (resource) {
      return resource.title.toLowerCase().indexOf(q) !== -1 ||
        resource.description.toLowerCase().indexOf(q) !== -1 ||
        resource.category.toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderResources(list) {
    var grid = document.getElementById('resource-cards-grid');
    var emptyState = document.getElementById('resource-empty-state');
    if (!grid) return;

    grid.innerHTML = list.map(resourceCardTemplate).join('');

    if (emptyState) {
      var isEmpty = list.length === 0;
      emptyState.classList.toggle('hidden', !isEmpty);
      if (isEmpty) {
        var q = state.query.trim();
        emptyState.textContent = q
          ? 'No resources match "' + q + '".'
          : 'No resources in this category yet.';
      }
    }

    refreshIcons();
  }

  function resourceCardTemplate(resource) {
    var isAvailable = resource.available !== false;
    var ctaLabel = isAvailable ? 'Preview resource' : 'Coming soon';
    var disabledAttr = isAvailable ? '' : ' disabled';
    var arrow = isAvailable ? '<i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>' : '';

    return (
      '<article class="card resource-card p-6 flex flex-col h-full">' +
        '<div class="w-11 h-11 rounded-full bg-ink-700 border border-ink-600 flex items-center justify-center text-brass mb-4">' +
          '<i data-lucide="' + escapeHtml(resource.icon) + '" class="w-5 h-5"></i>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 mb-3">' +
          '<span class="w-1.5 h-1.5 rounded-full bg-muted-2"></span>' +
          '<span class="font-mono text-[10px] tracking-wider uppercase text-muted-2">' + escapeHtml(resource.category) + '</span>' +
        '</div>' +
        '<h3 class="font-display text-base font-semibold text-paper mb-2">' + escapeHtml(resource.title) + '</h3>' +
        '<p class="text-sm text-muted leading-relaxed line-clamp-3 mb-5">' + escapeHtml(resource.description) + '</p>' +
        '<div class="flex items-center justify-between mt-auto pt-4 border-t border-rule">' +
          '<span class="font-mono text-xs text-muted-2">' + escapeHtml(resource.type) + '</span>' +
          '<button type="button" class="resource-card-cta" data-open-resource="' + resource.id + '"' + disabledAttr + '>' +
            '<span>' + ctaLabel + '</span>' + arrow +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function openResourceModal(id) {
    var resource = resumeResources.filter(function (r) { return r.id === id; })[0];
    var modal = document.getElementById('resource-modal');
    var modalContent = document.getElementById('resource-modal-content');
    if (!resource || !modal || !modalContent || resource.available === false) return;

    lastFocusedEl = document.activeElement;

    var itemsHtml = (resource.items || []).map(function (item) {
      return '<li>' + escapeHtml(item) + '</li>';
    }).join('');

    modalContent.innerHTML =
      '<div class="flex items-start justify-between gap-4 mb-1">' +
        '<h3 class="font-display text-2xl font-semibold text-paper pr-6">' + escapeHtml(resource.title) + '</h3>' +
        '<button type="button" class="btn-icon flex-shrink-0" data-close-resource-modal aria-label="Close resource">' +
          '<i data-lucide="x" class="w-4 h-4"></i>' +
        '</button>' +
      '</div>' +
      '<div class="flex items-center gap-1.5 mb-6">' +
        '<span class="w-1.5 h-1.5 rounded-full bg-muted-2"></span>' +
        '<span class="font-mono text-xs tracking-wider uppercase text-muted-2">' +
          escapeHtml(resource.category) + ' &middot; ' + escapeHtml(resource.type) +
        '</span>' +
      '</div>' +
      '<p class="text-sm text-paper-dim leading-relaxed mb-5">' + escapeHtml(resource.intro || resource.description) + '</p>' +
      (itemsHtml ? '<ul class="list-disc list-inside space-y-2 text-sm text-paper-dim">' + itemsHtml + '</ul>' : '');

    modal.classList.remove('hidden');
    refreshIcons();

    var closeBtn = modalContent.querySelector('[data-close-resource-modal]');
    if (closeBtn) closeBtn.focus();
  }

  function closeResourceModal() {
    var modal = document.getElementById('resource-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
    lastFocusedEl = null;
  }

  function setActiveFilter(buttons, activeBtn) {
    buttons.forEach(function (btn) {
      var isActive = btn === activeBtn;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function toArray(nodeList) {
    return Array.prototype.slice.call(nodeList);
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value === null || value === undefined ? '' : String(value);
    return div.innerHTML;
  }
})();
