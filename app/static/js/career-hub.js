/**
 * Career Hub — search, category filtering, and article modal.
 *
 * Self-contained on purpose: everything here lives inside a single IIFE so
 * nothing it declares can collide with app.js (or resources.js) on the same
 * page, it only ever touches elements inside .career-hub and #career-modal,
 * and it never reads or writes any of the existing screening app's state.
 *
 * To connect this to a real backend later, replace `careerArticles` with a
 * fetch() call that resolves to the same shape (id, category, title,
 * description, readingTime, icon, content[]) and call renderCareerArticles
 * once the data arrives — search, filtering, and the modal keep working
 * unchanged.
 */
(function () {
  'use strict';

  var careerArticles = [
    {
      id: 1,
      category: `Resume & ATS`,
      title: `How ATS Resume Screening Works`,
      description: `Understand how applicant tracking systems process resumes and how to make your resume easier to parse.`,
      readingTime: `5 min read`,
      icon: `file-search`,
      content: [
        `Most companies now route job applications through an applicant tracking system (ATS) before a recruiter ever opens them. The software collects your submission, extracts the text, and sorts it into structured fields — contact details, work history, education, skills — so it can be searched and filtered later.`,
        `Many systems also score or rank candidates by comparing the resume's language against the job description, which is why using the same terminology as the posting (job titles, tools, certifications) tends to help your resume surface higher in a recruiter's queue.`,
        `The most reliable way to stay parser-friendly is to keep the structure simple: a single column, standard section headings like "Experience" and "Education," and plain text rather than information locked inside images, text boxes, or tables that some parsers skip entirely.`
      ]
    },
    {
      id: 2,
      category: `Resume & ATS`,
      title: `10 Common Resume Mistakes`,
      description: `Learn about common resume problems that can reduce your chances of getting shortlisted.`,
      readingTime: `6 min read`,
      icon: `alert-triangle`,
      content: [
        `Small formatting and content issues are often what separates a resume that gets read from one that gets skipped — and most of them are easy to fix once you know what to look for.`,
        `On the formatting side: inconsistent date formats, resumes longer than the role's seniority warrants, dense unbroken paragraphs instead of bullet points, and layouts that rely on columns or graphics an ATS can't parse are the most frequent offenders.`,
        `On the content side: leading bullet points with responsibilities instead of outcomes, omitting numbers that show scale or impact, listing outdated or irrelevant skills, and reusing one generic resume for every application all quietly work against you.`,
        `A quick pass focused on consistency, specificity, and relevance to the role you're applying for addresses most of these at once.`
      ]
    },
    {
      id: 3,
      category: `Interview Preparation`,
      title: `How to Prepare for a Technical Interview`,
      description: `A practical walkthrough of what to review before a coding interview, from data structures to communicating your thought process.`,
      readingTime: `7 min read`,
      icon: `terminal`,
      content: [
        `Technical interviews usually test more than whether you can produce a correct answer — they're also evaluating how you think, how you handle being stuck, and how clearly you communicate along the way.`,
        `Before the interview, revisit core data structures and algorithms, practice explaining your reasoning out loud rather than solving silently, and review the fundamentals of the specific stack the role uses.`,
        `During the interview, narrate your thought process, ask clarifying questions before diving in, get to a working solution before optimizing, and talk through trade-offs rather than jumping straight to code.`,
        `If you get stuck, saying what you've ruled out and why is usually more useful to the interviewer than sitting in silence — it shows how you approach a problem, which is often the real thing being assessed.`
      ]
    },
    {
      id: 4,
      category: `Interview Preparation`,
      title: `Common HR Interview Questions`,
      description: `The behavioral and culture-fit questions recruiters ask most often, with guidance on how to structure strong answers.`,
      readingTime: `4 min read`,
      icon: `message-square`,
      content: [
        `HR or recruiter screens tend to focus less on technical depth and more on motivation, communication, and fit — questions like "Tell me about yourself," "Why this role?" and "Tell me about a challenge you faced at work" show up in some form in almost every process.`,
        `A useful structure for behavioral questions is to briefly set the situation, describe the specific action you took, and close with the measurable or observable result — keeping each answer to two or three minutes rather than a long narrative.`,
        `It also helps to prepare two or three go-to stories in advance that can flex across several common questions, rather than trying to have a unique story ready for every possible variation.`
      ]
    },
    {
      id: 5,
      category: `Career Advice`,
      title: `How to Tailor Your Resume to a Job Description`,
      description: `A step-by-step approach to adjusting your resume's language and emphasis for each role you apply to.`,
      readingTime: `5 min read`,
      icon: `target`,
      content: [
        `A resume tailored to the specific posting — rather than one generic version sent everywhere — consistently performs better with both automated screening and human reviewers.`,
        `Start by reading the job description closely and noting the recurring skills, tools, and responsibilities. Then adjust your summary and bullet points to foreground the experience that most directly matches what's listed, using similar terminology where it genuinely applies.`,
        `This doesn't mean rewriting your history to fit every job — it means choosing which real accomplishments to lead with and how to phrase them so the overlap with the role is obvious at a glance.`
      ]
    },
    {
      id: 6,
      category: `Job Search Tips`,
      title: `How to Build a Better Job Search Strategy`,
      description: `A structured approach to planning your search — from targeting the right roles to tracking applications.`,
      readingTime: `6 min read`,
      icon: `compass`,
      content: [
        `An unfocused job search — applying broadly to anything remotely relevant — usually produces a lower response rate than a narrower, more deliberate one.`,
        `Start by defining a short list of target roles and companies based on your actual strengths and interests, then prioritize applications where you meet most of the core requirements rather than spreading effort evenly across everything.`,
        `Track every application with its status and a follow-up date, and set aside time each week for outreach and networking alongside direct applications — referrals and warm introductions consistently outperform cold applications alone.`
      ]
    },
    {
      id: 7,
      category: `Industry Guides`,
      title: `Skills Employers Look for in Software Developers`,
      description: `The technical and collaborative skills that consistently show up in developer job postings and interviews.`,
      readingTime: `6 min read`,
      icon: `code`,
      content: [
        `Beyond specific languages and frameworks, employers consistently look for a core set of skills that transfer across most software roles.`,
        `On the technical side: solid fundamentals in data structures and algorithms, comfort with version control and collaborative workflows, an understanding of testing practices, and familiarity with the type of system you'd be working on (web, mobile, data, infrastructure).`,
        `On the collaborative side: clear written communication for documentation and code review, the ability to explain technical trade-offs to non-technical stakeholders, and comfort working through ambiguity rather than needing every requirement fully specified upfront.`,
        `Specific language or framework experience matters less than most candidates assume — most teams expect a capable developer to pick up their particular stack quickly.`
      ]
    },
    {
      id: 8,
      category: `Featured`,
      title: `Build a Resume That Gets Noticed`,
      description: `A concise checklist for making your resume stand out to both automated systems and human reviewers.`,
      readingTime: `5 min read`,
      icon: `sparkles`,
      content: [
        `A resume that performs well has to work for two different readers: the software that screens it first, and the person who reads it after.`,
        `For the software: keep the structure simple and text-based, use standard section headings, and mirror the key terms from the job description where they authentically apply.`,
        `For the human reader: lead every bullet with what you did and the outcome it produced, favor specific numbers over vague claims, and keep the document focused on what's relevant to the role rather than a complete career history.`,
        `Treat it as a living document — the version that gets you an interview for one role is rarely the exact version that should go to the next.`
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
    var root = document.querySelector('.career-hub');
    var grid = document.getElementById('career-articles-grid');
    if (!root || !grid) return; // section isn't on this page — bail out quietly

    var searchInput = document.getElementById('career-search-input');
    var filterButtons = toArray(root.querySelectorAll('.career-filter-btn'));
    var modal = document.getElementById('career-modal');

    renderCareerArticles(getVisibleArticles());

    if (searchInput) {
      searchInput.addEventListener('input', function (event) {
        state.query = event.target.value || '';
        renderCareerArticles(getVisibleArticles());
      });
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.category = btn.getAttribute('data-category') || 'all';
        setActiveFilter(filterButtons, btn);
        renderCareerArticles(getVisibleArticles());
      });
    });

    grid.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-open-article]');
      if (!trigger) return;
      openCareerModal(Number(trigger.getAttribute('data-open-article')));
    });

    if (modal) {
      modal.addEventListener('click', function (event) {
        if (event.target === modal || event.target.closest('[data-close-career-modal]')) {
          closeCareerModal();
        }
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
          closeCareerModal();
        }
      });
    }
  }

  function getVisibleArticles() {
    return searchCareerArticles(filterCareerArticles(careerArticles, state.category), state.query);
  }

  function filterCareerArticles(articles, category) {
    if (!category || category === 'all') return articles;
    return articles.filter(function (article) { return article.category === category; });
  }

  function searchCareerArticles(articles, query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(function (article) {
      return article.title.toLowerCase().indexOf(q) !== -1 ||
        article.description.toLowerCase().indexOf(q) !== -1 ||
        article.category.toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderCareerArticles(articles) {
    var grid = document.getElementById('career-articles-grid');
    var emptyState = document.getElementById('career-empty-state');
    if (!grid) return;

    grid.innerHTML = articles.map(careerCardTemplate).join('');

    if (emptyState) {
      var isEmpty = articles.length === 0;
      emptyState.classList.toggle('hidden', !isEmpty);
      if (isEmpty) {
        var q = state.query.trim();
        emptyState.textContent = q
          ? 'No articles match "' + q + '".'
          : 'No articles in this category yet.';
      }
    }

    refreshIcons();
  }

  function careerCardTemplate(article) {
    var isFeatured = article.category === 'Featured';
    var dotColor = isFeatured ? 'bg-brass' : 'bg-muted-2';
    var labelColor = isFeatured ? 'text-brass' : 'text-muted-2';
    return (
      '<article class="card career-card' + (isFeatured ? ' is-featured' : '') + ' p-6 flex flex-col h-full">' +
        '<div class="w-11 h-11 rounded-full bg-ink-700 border border-ink-600 flex items-center justify-center text-brass mb-4">' +
          '<i data-lucide="' + escapeHtml(article.icon) + '" class="w-5 h-5"></i>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 mb-3">' +
          '<span class="w-1.5 h-1.5 rounded-full ' + dotColor + '"></span>' +
          '<span class="font-mono text-[10px] tracking-wider uppercase ' + labelColor + '">' + escapeHtml(article.category) + '</span>' +
        '</div>' +
        '<h3 class="font-display text-base font-semibold text-paper mb-2">' + escapeHtml(article.title) + '</h3>' +
        '<p class="text-sm text-muted leading-relaxed line-clamp-3 mb-5">' + escapeHtml(article.description) + '</p>' +
        '<div class="flex items-center justify-between mt-auto pt-4 border-t border-rule">' +
          '<span class="font-mono text-xs text-muted-2">' + escapeHtml(article.readingTime) + '</span>' +
          '<button type="button" class="career-card-cta" data-open-article="' + article.id + '">' +
            '<span>Read article</span>' +
            '<i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>' +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function openCareerModal(id) {
    var article = careerArticles.filter(function (a) { return a.id === id; })[0];
    var modal = document.getElementById('career-modal');
    var modalContent = document.getElementById('career-modal-content');
    if (!article || !modal || !modalContent) return;

    lastFocusedEl = document.activeElement;

    var paragraphs = article.content.map(function (paragraph) {
      return '<p>' + escapeHtml(paragraph) + '</p>';
    }).join('');

    modalContent.innerHTML =
      '<div class="flex items-start justify-between gap-4 mb-1">' +
        '<h3 class="font-display text-2xl font-semibold text-paper pr-6">' + escapeHtml(article.title) + '</h3>' +
        '<button type="button" class="btn-icon flex-shrink-0" data-close-career-modal aria-label="Close article">' +
          '<i data-lucide="x" class="w-4 h-4"></i>' +
        '</button>' +
      '</div>' +
      '<div class="flex items-center gap-1.5 mb-6">' +
        '<span class="w-1.5 h-1.5 rounded-full ' + (article.category === 'Featured' ? 'bg-brass' : 'bg-muted-2') + '"></span>' +
        '<span class="font-mono text-xs tracking-wider uppercase ' + (article.category === 'Featured' ? 'text-brass' : 'text-muted-2') + '">' +
          escapeHtml(article.category) + ' &middot; ' + escapeHtml(article.readingTime) +
        '</span>' +
      '</div>' +
      '<div class="text-sm text-paper-dim leading-relaxed space-y-4">' + paragraphs + '</div>';

    modal.classList.remove('hidden');
    refreshIcons();

    var closeBtn = modalContent.querySelector('[data-close-career-modal]');
    if (closeBtn) closeBtn.focus();
  }

  function closeCareerModal() {
    var modal = document.getElementById('career-modal');
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
