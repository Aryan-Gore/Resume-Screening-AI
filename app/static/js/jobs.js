/**
 * Jobs — search, job-type filtering, and a job detail modal. Same
 * self-contained IIFE pattern as the other new sections. The one place
 * this file reaches outside .jobs-hub / #job-modal is the "Analyze My
 * Resume" button in the job modal, which closes this modal and scrolls to
 * #resume-analyzer using the same anchor-scroll mechanism as the rest of
 * the site (no direct interaction with app.js or any of its state).
 */
(function () {
  'use strict';

  var jobs = [
    {
      id: 1,
      title: `Software Engineer`,
      company: `Northbridge Systems`,
      location: `Bengaluru, IN`,
      type: `Full-time`,
      experience: `2–4 years`,
      skills: [`React`, `Node.js`, `PostgreSQL`],
      icon: `code`,
      intro: `Northbridge Systems builds infrastructure tooling used by mid-size engineering teams. This role sits on the platform team, working across the stack from API design to the internal dashboards teams use daily.`,
      responsibilities: [
        `Design and build REST APIs and internal services in Node.js`,
        `Collaborate with frontend engineers on React-based internal tools`,
        `Own schema design and query performance in PostgreSQL`,
        `Take part in code review and a shared on-call rotation`
      ]
    },
    {
      id: 2,
      title: `Frontend Developer`,
      company: `Lumen Digital`,
      location: `Remote`,
      type: `Remote`,
      experience: `1–3 years`,
      skills: [`React`, `TypeScript`, `Tailwind CSS`],
      icon: `monitor`,
      intro: `Lumen Digital is a small, fully remote product studio building customer-facing web apps for a handful of long-term clients. You'd join a three-person frontend team with real ownership over what ships.`,
      responsibilities: [
        `Build and maintain React + TypeScript interfaces for client products`,
        `Turn design files into accessible, responsive components`,
        `Review pull requests and help keep the component library consistent`,
        `Work directly with designers and the client-facing product lead`
      ]
    },
    {
      id: 3,
      title: `Backend Developer`,
      company: `Ferrous Cloud`,
      location: `Pune, IN`,
      type: `Full-time`,
      experience: `3–5 years`,
      skills: [`Java`, `Spring Boot`, `Kafka`],
      icon: `server`,
      intro: `Ferrous Cloud runs a managed data-pipeline platform used by logistics companies to process shipment events in real time. This role owns a core service in the event-processing pipeline.`,
      responsibilities: [
        `Build and maintain services in Java and Spring Boot`,
        `Design event-driven workflows on Apache Kafka`,
        `Improve throughput and reliability of high-volume data pipelines`,
        `Write and maintain integration tests for critical services`
      ]
    },
    {
      id: 4,
      title: `Data Analyst`,
      company: `Vantage Analytics`,
      location: `Hyderabad, IN`,
      type: `Full-time`,
      experience: `1–3 years`,
      skills: [`SQL`, `Python`, `Power BI`],
      icon: `bar-chart-2`,
      intro: `Vantage Analytics is a boutique analytics consultancy working with retail and e-commerce clients. This role turns raw transaction data into dashboards and recommendations clients act on directly.`,
      responsibilities: [
        `Write SQL queries against large transactional datasets`,
        `Build and maintain dashboards in Power BI`,
        `Use Python for data cleaning and ad hoc analysis`,
        `Present findings directly to client stakeholders`
      ]
    },
    {
      id: 5,
      title: `Full Stack Developer`,
      company: `Ridgeline Labs`,
      location: `Remote`,
      type: `Remote`,
      experience: `2–5 years`,
      skills: [`Node.js`, `React`, `MongoDB`],
      icon: `layers`,
      intro: `Ridgeline Labs is an early-stage startup building a scheduling tool for small service businesses. As an early engineering hire, you'd work across the entire stack and help shape technical decisions early.`,
      responsibilities: [
        `Build features end-to-end across a Node.js/Express API and React frontend`,
        `Design MongoDB schemas as the product's data model evolves`,
        `Help set technical direction as one of the first engineering hires`,
        `Ship frequently and work closely with the founding team`
      ]
    },
    {
      id: 6,
      title: `DevOps Engineer`,
      company: `Anchorpoint Cloud`,
      location: `Bengaluru, IN`,
      type: `Full-time`,
      experience: `3–6 years`,
      skills: [`AWS`, `Docker`, `Kubernetes`],
      icon: `cloud`,
      intro: `Anchorpoint Cloud provides managed cloud infrastructure for mid-market SaaS companies. This role owns the reliability and automation of infrastructure that customer-facing teams depend on.`,
      responsibilities: [
        `Manage and scale Kubernetes clusters across multiple AWS environments`,
        `Build CI/CD pipelines and Docker-based deployment workflows`,
        `Own incident response and on-call for production infrastructure`,
        `Write infrastructure as code and improve deployment automation`
      ]
    },
    {
      id: 7,
      title: `Software Engineering Intern`,
      company: `Northbridge Systems`,
      location: `Bengaluru, IN`,
      type: `Internship`,
      experience: `0–1 years`,
      skills: [`Python`, `Git`, `DSA`],
      icon: `graduation-cap`,
      intro: `A hands-on internship on the platform team at Northbridge Systems, working alongside full-time engineers on real, shipped features rather than a side project.`,
      responsibilities: [
        `Ship small features and bug fixes under a mentor engineer's guidance`,
        `Write tests and participate in code review from day one`,
        `Learn the team's Git workflow and deployment process`,
        `Present a small project to the team at the end of the internship`
      ]
    },
    {
      id: 8,
      title: `Data Scientist`,
      company: `Meridian Insights`,
      location: `Remote`,
      type: `Remote`,
      experience: `2–4 years`,
      skills: [`Python`, `Machine Learning`, `SQL`],
      icon: `brain`,
      intro: `Meridian Insights builds forecasting models for supply chain teams. This role sits on a small applied ML team, taking models from prototype to something a customer's operations team actually relies on.`,
      responsibilities: [
        `Build and evaluate forecasting models in Python`,
        `Query and prepare training data with SQL`,
        `Work with engineers to deploy models into production pipelines`,
        `Communicate model behavior and limitations clearly to non-technical stakeholders`
      ]
    }
  ];

  var state = {
    type: 'all',
    query: ''
  };

  var lastFocusedEl = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var root = document.querySelector('.jobs-hub');
    var grid = document.getElementById('job-cards-grid');
    if (!root || !grid) return;

    var searchInput = document.getElementById('job-search-input');
    var typeButtons = toArray(root.querySelectorAll('.job-filter-btn'));
    var modal = document.getElementById('job-modal');

    renderJobs(getVisibleJobs());

    if (searchInput) {
      searchInput.addEventListener('input', function (event) {
        state.query = event.target.value || '';
        renderJobs(getVisibleJobs());
      });
    }

    typeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.type = btn.getAttribute('data-type') || 'all';
        setActiveFilter(typeButtons, btn);
        renderJobs(getVisibleJobs());
      });
    });

    grid.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-open-job]');
      if (!trigger) return;
      openJobModal(Number(trigger.getAttribute('data-open-job')));
    });

    if (modal) {
      modal.addEventListener('click', function (event) {
        if (event.target.closest('[data-goto-analyzer]')) {
          closeJobModal();
          var target = document.getElementById('resume-analyzer');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        if (event.target === modal || event.target.closest('[data-close-job-modal]')) {
          closeJobModal();
        }
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
          closeJobModal();
        }
      });
    }
  }

  function getVisibleJobs() {
    var byType = state.type === 'all' ? jobs : jobs.filter(function (j) { return j.type === state.type; });
    var q = state.query.trim().toLowerCase();
    if (!q) return byType;
    return byType.filter(function (job) {
      return job.title.toLowerCase().indexOf(q) !== -1 ||
        job.company.toLowerCase().indexOf(q) !== -1 ||
        job.location.toLowerCase().indexOf(q) !== -1 ||
        job.skills.join(' ').toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderJobs(list) {
    var grid = document.getElementById('job-cards-grid');
    var emptyState = document.getElementById('job-empty-state');
    if (!grid) return;

    grid.innerHTML = list.map(jobCardTemplate).join('');

    if (emptyState) {
      var isEmpty = list.length === 0;
      emptyState.classList.toggle('hidden', !isEmpty);
      if (isEmpty) {
        var q = state.query.trim();
        emptyState.textContent = q ? 'No jobs match "' + q + '".' : 'No jobs match this filter yet.';
      }
    }

    refreshIcons();
  }

  function jobCardTemplate(job) {
    var skillChips = job.skills.slice(0, 3).map(function (skill) {
      return '<span class="chip">' + escapeHtml(skill) + '</span>';
    }).join('');

    return (
      '<article class="card job-card p-6 flex flex-col h-full">' +
        '<div class="w-11 h-11 rounded-full bg-ink-700 border border-ink-600 flex items-center justify-center text-brass mb-4">' +
          '<i data-lucide="' + escapeHtml(job.icon) + '" class="w-5 h-5"></i>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 mb-3">' +
          '<span class="w-1.5 h-1.5 rounded-full bg-muted-2"></span>' +
          '<span class="font-mono text-[10px] tracking-wider uppercase text-muted-2">' + escapeHtml(job.type) + '</span>' +
        '</div>' +
        '<h3 class="font-display text-base font-semibold text-paper mb-1">' + escapeHtml(job.title) + '</h3>' +
        '<p class="text-sm text-muted mb-4">' + escapeHtml(job.company) + ' &middot; ' + escapeHtml(job.location) + '</p>' +
        '<div class="flex flex-wrap gap-1.5 mb-5">' + skillChips + '</div>' +
        '<div class="flex items-center justify-between mt-auto pt-4 border-t border-rule">' +
          '<span class="font-mono text-xs text-muted-2">' + escapeHtml(job.experience) + '</span>' +
          '<button type="button" class="job-card-cta" data-open-job="' + job.id + '">' +
            '<span>View job</span>' +
            '<i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>' +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function openJobModal(id) {
    var job = jobs.filter(function (j) { return j.id === id; })[0];
    var modal = document.getElementById('job-modal');
    var modalContent = document.getElementById('job-modal-content');
    if (!job || !modal || !modalContent) return;

    lastFocusedEl = document.activeElement;

    var responsibilitiesHtml = job.responsibilities.map(function (item) {
      return '<li>' + escapeHtml(item) + '</li>';
    }).join('');
    var skillChips = job.skills.map(function (skill) {
      return '<span class="chip">' + escapeHtml(skill) + '</span>';
    }).join('');

    modalContent.innerHTML =
      '<div class="flex items-start justify-between gap-4 mb-1">' +
        '<h3 class="font-display text-2xl font-semibold text-paper pr-6">' + escapeHtml(job.title) + '</h3>' +
        '<button type="button" class="btn-icon flex-shrink-0" data-close-job-modal aria-label="Close job">' +
          '<i data-lucide="x" class="w-4 h-4"></i>' +
        '</button>' +
      '</div>' +
      '<p class="text-sm text-muted mb-1">' + escapeHtml(job.company) + ' &middot; ' + escapeHtml(job.location) + '</p>' +
      '<div class="flex items-center gap-3 flex-wrap mb-6">' +
        '<span class="inline-flex items-center gap-1.5">' +
          '<span class="w-1.5 h-1.5 rounded-full bg-muted-2"></span>' +
          '<span class="font-mono text-xs tracking-wider uppercase text-muted-2">' + escapeHtml(job.type) + '</span>' +
        '</span>' +
        '<span class="font-mono text-xs text-muted-2">' + escapeHtml(job.experience) + ' experience</span>' +
      '</div>' +
      '<p class="text-sm text-paper-dim leading-relaxed mb-5">' + escapeHtml(job.intro) + '</p>' +
      '<p class="font-mono text-[11px] uppercase tracking-widest text-muted-2 mb-2">What you\u2019d do</p>' +
      '<ul class="list-disc list-inside space-y-2 text-sm text-paper-dim mb-6">' + responsibilitiesHtml + '</ul>' +
      '<p class="font-mono text-[11px] uppercase tracking-widest text-muted-2 mb-2">Skills</p>' +
      '<div class="flex flex-wrap gap-1.5 mb-7">' + skillChips + '</div>' +
      '<button type="button" class="btn-primary" data-goto-analyzer>' +
        '<span class="btn-label">Analyze My Resume for This Role</span>' +
        '<i data-lucide="arrow-right" class="w-4 h-4"></i>' +
      '</button>';

    modal.classList.remove('hidden');
    refreshIcons();

    var closeBtn = modalContent.querySelector('[data-close-job-modal]');
    if (closeBtn) closeBtn.focus();
  }

  function closeJobModal() {
    var modal = document.getElementById('job-modal');
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
