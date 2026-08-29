/**
 * Interview Prep — search, two independent filters (topic + difficulty),
 * and a question/answer modal. Same self-contained IIFE pattern as
 * career-hub.js and resources.js: its own state, only touches elements
 * inside .interview-prep and #interview-modal, never touches app.js.
 */
(function () {
  'use strict';

  var interviewQuestions = [
    // DSA
    { id: 1, category: `DSA`, difficulty: `Medium`, icon: `git-branch`,
      question: `Reverse a Singly Linked List`,
      answer: `Walk the list with three pointers: "prev" (starts as null), "curr" (starts at head), and a temporary "next". At each node, save curr.next, point curr.next back to prev, then advance prev and curr forward. When curr becomes null, prev is the new head. This runs in O(n) time and O(1) extra space — no recursion or auxiliary list needed.` },
    { id: 2, category: `DSA`, difficulty: `Medium`, icon: `git-branch`,
      question: `Detect a Cycle in a Linked List`,
      answer: `Use Floyd's cycle detection (the "tortoise and hare"): one pointer moves one node at a time, another moves two. If there's a cycle, the faster pointer eventually laps the slower one and they meet; if the list is acyclic, the fast pointer reaches null first. This runs in O(n) time and O(1) space, versus O(n) space for a hash-set approach.` },
    { id: 3, category: `DSA`, difficulty: `Easy`, icon: `git-branch`,
      question: `Find Two Numbers in an Array That Sum to a Target`,
      answer: `Walk the array once, and for each number check whether target minus that number has already been seen, using a hash map of value to index. If it has, you've found the pair; if not, add the current number and its index to the map and continue. This is O(n) time and O(n) space, versus O(n squared) for the brute-force nested-loop approach.` },

    // Java
    { id: 4, category: `Java`, difficulty: `Easy`, icon: `coffee`,
      question: `What's the difference between == and .equals() in Java?`,
      answer: `"==" compares references for objects — whether two variables point to the same object in memory — and compares values directly for primitives. ".equals()" is a method that compares logical equality, and its behavior depends on whether the class overrides it: String and the wrapper classes override it to compare contents, while a custom class without an override falls back to Object.equals(), which behaves like "==".` },
    { id: 5, category: `Java`, difficulty: `Medium`, icon: `coffee`,
      question: `What's the difference between an abstract class and an interface?`,
      answer: `An abstract class can hold state, constructors, and a mix of abstract and concrete methods, and a class can extend only one abstract class. An interface traditionally declared only method signatures, though modern Java allows default and static methods with bodies; a class can implement many interfaces. Use an abstract class when subclasses share common state, and an interface to define a capability unrelated classes can implement.` },
    { id: 6, category: `Java`, difficulty: `Hard`, icon: `coffee`,
      question: `How does HashMap work internally in Java?`,
      answer: `A HashMap stores entries in an array of buckets, and a key's hashCode() (spread through a supplemental hash function) determines which bucket it lands in. Collisions within a bucket are handled with a linked list, which Java converts to a red-black tree once a bucket gets large enough, keeping worst-case lookup at O(log n) instead of O(n). Resizing into a larger array happens automatically once the map's load factor threshold is crossed.` },

    // C/C++
    { id: 7, category: `C/C++`, difficulty: `Easy`, icon: `cpu`,
      question: `What's the difference between malloc() and new?`,
      answer: `malloc() is a C library function that allocates raw, uninitialized memory and returns a void pointer; it doesn't call constructors. "new" is a C++ operator that allocates memory and then calls the appropriate constructor, returning a properly typed pointer. Memory from malloc() must be released with free(), while memory from "new" must be released with "delete" (or delete[] for arrays), since only delete calls destructors.` },
    { id: 8, category: `C/C++`, difficulty: `Medium`, icon: `cpu`,
      question: `What's the difference between a pointer and a reference in C++?`,
      answer: `A pointer is a variable that stores an address, can be reassigned to point elsewhere, can be null, and needs explicit dereferencing. A reference is an alias for an existing variable, must be initialized when declared, can never be reassigned to refer to something else, and is used with normal variable syntax. References are generally preferred for function parameters when null isn't a valid state.` },
    { id: 9, category: `C/C++`, difficulty: `Hard`, icon: `cpu`,
      question: `What happens if a class with dynamically allocated memory doesn't define a destructor?`,
      answer: `If a class allocates memory with "new" in its constructor but never frees it, that memory leaks every time an object of that class is destroyed. It's the classic motivation for the "Rule of Three/Five": if a class manages a resource, it generally needs a custom destructor, copy constructor, and copy assignment operator, or should just hold the resource in something like std::unique_ptr that manages it automatically.` },

    // Python
    { id: 10, category: `Python`, difficulty: `Easy`, icon: `terminal`,
      question: `What's the difference between a list and a tuple?`,
      answer: `Both are ordered sequences, but a list is mutable — you can add, remove, or change elements after creation — while a tuple is immutable. Because tuples are immutable, they're hashable and can be used as dictionary keys or set members, and they're generally a bit faster to iterate over. Lists are the right choice when the collection needs to change over time.` },
    { id: 11, category: `Python`, difficulty: `Hard`, icon: `terminal`,
      question: `What is Python's GIL and why does it matter?`,
      answer: `The Global Interpreter Lock is a mutex in CPython that allows only one thread to execute Python bytecode at a time, even on a multi-core machine. It simplifies memory management, but it means CPU-bound multithreaded Python code doesn't get a speedup from extra threads — for that, use multiprocessing instead. I/O-bound threads still benefit from threading, since the GIL is released during I/O waits.` },
    { id: 12, category: `Python`, difficulty: `Medium`, icon: `terminal`,
      question: `What is a Python decorator and when would you use one?`,
      answer: `A decorator is a function that takes another function and returns a modified version of it, usually applied with @decorator_name syntax above a function definition. They add cross-cutting behavior without changing the function's own code — logging, timing, caching, access control, registration — keeping that logic in one reusable place instead of repeated inside every function that needs it.` },

    // DBMS
    { id: 13, category: `DBMS`, difficulty: `Easy`, icon: `database`,
      question: `What's the difference between INNER JOIN and LEFT JOIN?`,
      answer: `An INNER JOIN returns only the rows where the join condition matches in both tables — no match, no row. A LEFT JOIN returns every row from the left table regardless of whether a match exists in the right table, filling in NULLs for the right table's columns when there's no match. Use LEFT JOIN when you need to preserve rows from one table even if related data is missing.` },
    { id: 14, category: `DBMS`, difficulty: `Medium`, icon: `database`,
      question: `What is normalization and why is it used?`,
      answer: `Normalization structures a database's tables to reduce redundancy and avoid update, insert, and delete anomalies, typically by splitting data into related tables (following normal forms like 1NF, 2NF, 3NF). The trade-off is that highly normalized schemas often require more joins to reconstruct a full picture, which is why some read-heavy systems deliberately denormalize part of the schema for performance.` },
    { id: 15, category: `DBMS`, difficulty: `Medium`, icon: `database`,
      question: `What is a database index and how does it help query performance?`,
      answer: `An index is a separate data structure, commonly a B-tree, built on one or more columns that lets the database find matching rows without scanning the entire table. It speeds up lookups, range queries, and joins on the indexed columns dramatically, at the cost of extra storage and slightly slower writes, since every insert or update also has to update the index.` },

    // OOP
    { id: 16, category: `OOP`, difficulty: `Easy`, icon: `boxes`,
      question: `What are the four pillars of OOP?`,
      answer: `Encapsulation — bundling data with the methods that operate on it, and hiding internal state. Abstraction — exposing only what's necessary and hiding implementation detail. Inheritance — a class acquiring the properties and behavior of a parent class. Polymorphism — objects of different types being usable through a common interface, each responding to the same call in its own way.` },
    { id: 17, category: `OOP`, difficulty: `Easy`, icon: `boxes`,
      question: `What's the difference between method overloading and overriding?`,
      answer: `Overloading is defining multiple methods with the same name but different parameter lists within the same class, resolved at compile time based on the arguments passed. Overriding is a subclass providing its own implementation of a method already defined in its parent class, with the same signature, resolved at runtime based on the object's actual type.` },
    { id: 18, category: `OOP`, difficulty: `Medium`, icon: `boxes`,
      question: `What is polymorphism and how is it typically implemented?`,
      answer: `Polymorphism lets code work with objects of different classes through a shared interface, without knowing the exact type at compile time. It's typically implemented through inheritance and method overriding: a base class defines a method, each subclass overrides it, and calling code invokes the method on a base-class reference while the correct subclass version runs at runtime.` },

    // Operating Systems
    { id: 19, category: `Operating Systems`, difficulty: `Easy`, icon: `server`,
      question: `What's the difference between a process and a thread?`,
      answer: `A process is an independent program in execution with its own memory space, and processes don't share memory directly. A thread is a unit of execution within a process, and all threads in the same process share that process's memory and resources, which makes communication cheaper but introduces the need for synchronization to avoid race conditions.` },
    { id: 20, category: `Operating Systems`, difficulty: `Medium`, icon: `server`,
      question: `What is deadlock, and what conditions are required for it?`,
      answer: `Deadlock is a state where two or more processes are each waiting on a resource held by another, so none can proceed. Four conditions are generally required together: mutual exclusion, hold and wait, no preemption, and circular wait — a cycle of processes each waiting on the next. Breaking any one of these conditions prevents deadlock.` },
    { id: 21, category: `Operating Systems`, difficulty: `Medium`, icon: `server`,
      question: `What is virtual memory and why is it used?`,
      answer: `Virtual memory gives each process its own private address space, which the OS maps to physical memory (and sometimes disk) behind the scenes. It lets programs use more memory than is physically installed by paging less-used data to disk, isolates processes from each other for safety, and lets each process assume it has a large, contiguous address space starting from zero.` },

    // Computer Networks
    { id: 22, category: `Computer Networks`, difficulty: `Easy`, icon: `network`,
      question: `What's the difference between TCP and UDP?`,
      answer: `TCP is connection-oriented and guarantees reliable, ordered delivery, handling retransmission, flow control, and congestion control at the cost of some overhead. UDP is connectionless and sends packets with no delivery guarantee or ordering, which makes it lighter and faster — a common choice for video streaming or gaming, where a dropped packet is preferable to added latency.` },
    { id: 23, category: `Computer Networks`, difficulty: `Medium`, icon: `network`,
      question: `What happens when you type a URL and press Enter?`,
      answer: `The browser resolves the domain to an IP address via DNS, opens a TCP connection to that server (with a TLS handshake if it's HTTPS), sends an HTTP request, and the server responds with the requested resource. The browser then parses the HTML, requests any referenced resources like CSS, JS, and images, and renders the page, caching results along the way to speed up future requests.` },
    { id: 24, category: `Computer Networks`, difficulty: `Easy`, icon: `network`,
      question: `What's the difference between HTTP and HTTPS?`,
      answer: `HTTPS is HTTP layered on top of TLS/SSL, which encrypts the data exchanged between client and server, verifies the server's identity via a certificate, and protects against tampering and eavesdropping in transit. The request/response model is otherwise identical to plain HTTP — HTTPS just wraps it in a secure channel, which is now the default expectation for any site handling sensitive data.` },

    // HR Questions
    { id: 25, category: `HR Questions`, difficulty: `Easy`, icon: `users`,
      question: `Tell me about yourself.`,
      answer: `This question isn't really a request for a full biography — listen for a short, relevant narrative: present (what the candidate does now), past (the experience that got them here), and future (why this role is a logical next step). A strong answer stays under two minutes and stays relevant to the role rather than reciting the resume line by line; a rambling or unfocused answer is worth noting.` },
    { id: 26, category: `HR Questions`, difficulty: `Easy`, icon: `users`,
      question: `Why do you want to work here?`,
      answer: `A strong answer connects something specific about your company — its product, mission, or engineering culture — to something specific about the candidate, rather than a generic "it's a great opportunity." It's a reasonable signal of genuine interest and research, versus someone applying broadly to anything that would hire them.` },
    { id: 27, category: `HR Questions`, difficulty: `Easy`, icon: `users`,
      question: `Where do you see yourself in five years?`,
      answer: `You're not looking for a rigid five-year plan here — you're checking whether the candidate's goals are compatible with what this role can realistically offer, and whether they're thinking about growth at all. A good answer names a plausible direction, like going deeper technically or growing into more ownership, that this role would plausibly be a step toward.` },

    // Behavioral
    { id: 28, category: `Behavioral`, difficulty: `Medium`, icon: `message-circle`,
      question: `Tell me about a time you disagreed with a teammate.`,
      answer: `Listen for the STAR structure — Situation, Task, Action, Result. A candidate who briefly sets context, explains what was at stake, describes specifically what they did, and closes with an outcome is giving you something concrete to evaluate. For this question specifically, focus on how they handled the disagreement professionally, not on whether they turned out to be right.` },
    { id: 29, category: `Behavioral`, difficulty: `Easy`, icon: `message-circle`,
      question: `Describe a project you're proud of.`,
      answer: `Listen for a project where the candidate's individual contribution is genuinely clear, not just a group effort they were adjacent to. A strong answer covers the problem it solved, their specific role, one or two decisions or trade-offs they made, and a concrete result — ideally with a number. Depth on one well-chosen project is a better sign than a shallow tour through several.` },
    { id: 30, category: `Behavioral`, difficulty: `Medium`, icon: `message-circle`,
      question: `Tell me about a time you failed and what you learned.`,
      answer: `Watch for a real failure with real stakes, not a humblebrag disguised as a weakness. A strong candidate owns their part in it plainly rather than deflecting blame, then spends most of the answer on what changed afterward — a new habit, a process they introduced, a different approach. The lesson learned matters more than the failure itself.` }
  ];

  var state = {
    category: 'all',
    difficulty: 'all',
    query: ''
  };

  var lastFocusedEl = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var root = document.querySelector('.interview-prep');
    var grid = document.getElementById('interview-cards-grid');
    if (!root || !grid) return;

    var searchInput = document.getElementById('interview-search-input');
    var categoryButtons = toArray(root.querySelectorAll('.interview-filter-btn'));
    var difficultyButtons = toArray(root.querySelectorAll('.interview-difficulty-btn'));
    var modal = document.getElementById('interview-modal');

    renderQuestions(getVisibleQuestions());

    if (searchInput) {
      searchInput.addEventListener('input', function (event) {
        state.query = event.target.value || '';
        renderQuestions(getVisibleQuestions());
      });
    }

    categoryButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.category = btn.getAttribute('data-category') || 'all';
        setActiveFilter(categoryButtons, btn);
        renderQuestions(getVisibleQuestions());
      });
    });

    difficultyButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.difficulty = btn.getAttribute('data-difficulty') || 'all';
        setActiveFilter(difficultyButtons, btn);
        renderQuestions(getVisibleQuestions());
      });
    });

    grid.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-open-question]');
      if (!trigger) return;
      openQuestionModal(Number(trigger.getAttribute('data-open-question')));
    });

    if (modal) {
      modal.addEventListener('click', function (event) {
        if (event.target === modal || event.target.closest('[data-close-interview-modal]')) {
          closeQuestionModal();
        }
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
          closeQuestionModal();
        }
      });
    }
  }

  function getVisibleQuestions() {
    var byCategory = state.category === 'all'
      ? interviewQuestions
      : interviewQuestions.filter(function (q) { return q.category === state.category; });
    var byDifficulty = state.difficulty === 'all'
      ? byCategory
      : byCategory.filter(function (q) { return q.difficulty === state.difficulty; });
    var q = state.query.trim().toLowerCase();
    if (!q) return byDifficulty;
    return byDifficulty.filter(function (item) {
      return item.question.toLowerCase().indexOf(q) !== -1 || item.category.toLowerCase().indexOf(q) !== -1;
    });
  }

  function difficultyColor(difficulty) {
    if (difficulty === 'Easy') return { dot: 'bg-good', text: 'text-good' };
    if (difficulty === 'Hard') return { dot: 'bg-warn', text: 'text-warn' };
    return { dot: 'bg-brass', text: 'text-brass' };
  }

  function renderQuestions(list) {
    var grid = document.getElementById('interview-cards-grid');
    var emptyState = document.getElementById('interview-empty-state');
    if (!grid) return;

    grid.innerHTML = list.map(questionCardTemplate).join('');

    if (emptyState) {
      var isEmpty = list.length === 0;
      emptyState.classList.toggle('hidden', !isEmpty);
      if (isEmpty) {
        var q = state.query.trim();
        emptyState.textContent = q
          ? 'No questions match "' + q + '".'
          : 'No questions match this combination of filters.';
      }
    }

    refreshIcons();
  }

  function questionCardTemplate(item) {
    var diff = difficultyColor(item.difficulty);
    return (
      '<article class="card question-card p-6 flex flex-col h-full">' +
        '<div class="w-11 h-11 rounded-full bg-ink-700 border border-ink-600 flex items-center justify-center text-brass mb-4">' +
          '<i data-lucide="' + escapeHtml(item.icon) + '" class="w-5 h-5"></i>' +
        '</div>' +
        '<div class="flex items-center gap-3 flex-wrap mb-3">' +
          '<span class="inline-flex items-center gap-1.5">' +
            '<span class="w-1.5 h-1.5 rounded-full bg-muted-2"></span>' +
            '<span class="font-mono text-[10px] tracking-wider uppercase text-muted-2">' + escapeHtml(item.category) + '</span>' +
          '</span>' +
          '<span class="inline-flex items-center gap-1.5">' +
            '<span class="w-1.5 h-1.5 rounded-full ' + diff.dot + '"></span>' +
            '<span class="font-mono text-[10px] tracking-wider uppercase ' + diff.text + '">' + escapeHtml(item.difficulty) + '</span>' +
          '</span>' +
        '</div>' +
        '<h3 class="font-display text-base font-semibold text-paper mb-5 flex-1">' + escapeHtml(item.question) + '</h3>' +
        '<div class="flex justify-end mt-auto pt-4 border-t border-rule">' +
          '<button type="button" class="question-card-cta" data-open-question="' + item.id + '">' +
            '<span>View answer</span>' +
            '<i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>' +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function openQuestionModal(id) {
    var item = interviewQuestions.filter(function (q) { return q.id === id; })[0];
    var modal = document.getElementById('interview-modal');
    var modalContent = document.getElementById('interview-modal-content');
    if (!item || !modal || !modalContent) return;

    lastFocusedEl = document.activeElement;
    var diff = difficultyColor(item.difficulty);

    modalContent.innerHTML =
      '<div class="flex items-start justify-between gap-4 mb-1">' +
        '<h3 class="font-display text-2xl font-semibold text-paper pr-6">' + escapeHtml(item.question) + '</h3>' +
        '<button type="button" class="btn-icon flex-shrink-0" data-close-interview-modal aria-label="Close question">' +
          '<i data-lucide="x" class="w-4 h-4"></i>' +
        '</button>' +
      '</div>' +
      '<div class="flex items-center gap-3 flex-wrap mb-6">' +
        '<span class="inline-flex items-center gap-1.5">' +
          '<span class="w-1.5 h-1.5 rounded-full bg-muted-2"></span>' +
          '<span class="font-mono text-xs tracking-wider uppercase text-muted-2">' + escapeHtml(item.category) + '</span>' +
        '</span>' +
        '<span class="inline-flex items-center gap-1.5">' +
          '<span class="w-1.5 h-1.5 rounded-full ' + diff.dot + '"></span>' +
          '<span class="font-mono text-xs tracking-wider uppercase ' + diff.text + '">' + escapeHtml(item.difficulty) + '</span>' +
        '</span>' +
      '</div>' +
      '<p class="text-sm text-paper-dim leading-relaxed">' + escapeHtml(item.answer) + '</p>';

    modal.classList.remove('hidden');
    refreshIcons();

    var closeBtn = modalContent.querySelector('[data-close-interview-modal]');
    if (closeBtn) closeBtn.focus();
  }

  function closeQuestionModal() {
    var modal = document.getElementById('interview-modal');
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
