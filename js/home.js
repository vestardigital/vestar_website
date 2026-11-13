/* Vestar Digital homepage behaviour: nav, scroll reveals, parallax, the KINO Pilot chat demo and the contact form. */
(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Nav: solid once scrolled, mobile menu, active section ── */
    var nav = document.querySelector('.nav');
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var closeMenu = function () {
        links.classList.remove('open');
        nav.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        nav.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

    var sections = new Map();
    links.querySelectorAll('a[href^="#"]').forEach(function (a) {
        var el = document.querySelector(a.getAttribute('href'));
        if (el) sections.set(el, a);
    });
    if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                var a = sections.get(e.target);
                if (a) a.classList.toggle('active', e.isIntersecting);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(function (_, el) { spy.observe(el); });
    }

    /* ── Scroll reveal: fade up once, staggered by --i ── */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    var reveal = function (el) {
        if (el.classList.contains('in')) return;
        el.classList.add('in');
        var i = parseFloat(getComputedStyle(el).getPropertyValue('--i')) || 0;
        setTimeout(function () { el.classList.add('done'); }, 1000 + i * 100);
    };
    if (reduced || !('IntersectionObserver' in window)) {
        revealEls.forEach(reveal);
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                reveal(e.target);
                io.unobserve(e.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(function (el) { io.observe(el); });
        /* Safety net for tabs that never report an intersection. */
        setTimeout(function () {
            revealEls.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) reveal(el); });
        }, 1800);
    }

    /* ── Gentle parallax on a few large images ── */
    var para = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!reduced && para.length) {
        var ticking = false;
        var update = function () {
            ticking = false;
            if (window.innerWidth < 760) {
                para.forEach(function (el) { el.style.transform = ''; });
                return;
            }
            var vh = window.innerHeight;
            para.forEach(function (el) {
                var r = el.parentElement.getBoundingClientRect();
                if (r.bottom < -100 || r.top > vh + 100) return;
                var k = parseFloat(el.getAttribute('data-parallax')) || 0.06;
                var offset = (r.top + r.height / 2 - vh / 2) * k;
                el.style.transform = 'translate3d(0,' + (-offset).toFixed(1) + 'px,0)';
            });
        };
        var request = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
        window.addEventListener('scroll', request, { passive: true });
        window.addEventListener('resize', request);
        update();
    }

    /* ── KINO Pilot chat demo (same flow as the KINO Pilot landing page) ── */
    var demo = document.getElementById('pilotDemo');
    if (demo) {
        var IMG = 'images/home/';
        var EXAMPLES = [
            {
                idea: 'A romantic comedy series about a florist and the café owner who opens right next door.',
                reply: "Love it. I'll write it, cast it and draw it. Change anything you like along the way.",
                title: 'Second Take',
                kind: 'Episode 1 · 2D animation',
                story: 'Nora runs the flower shop on Harbor Street. When Eli opens a café next door, their rivalry turns into something neither of them planned.',
                cast: [['Nora', 'kd-nora.webp'], ['Eli', 'kd-eli.webp'], ['Mia', 'kd-mia.webp']],
                boards: 'kino-boards.webp',
                still: 'kd-second-take.webp'
            },
            {
                idea: "A 3D kids' show about a young shark who is scared of the deep, and his best friend, a dolphin.",
                reply: "What a fun pair. I'll keep it gentle and bright for young viewers.",
                title: 'Finn and Pip',
                kind: "Kids' series · 3D animation",
                story: 'Finn is the only shark on the reef who is afraid of the dark water. With Pip by his side, he swims a little deeper every episode.',
                cast: [['Finn', 'kd-finn.webp'], ['Pip', 'kd-pip.webp']],
                boards: 'kd-reef-boards.webp',
                still: 'kd-finn-and-pip.webp'
            },
            {
                idea: 'A 30-second e-bike ad: a nurse rides home along the coast at sunrise after a night shift.',
                reply: "Calm and premium, with a live-action look. I'll plan it shot by shot.",
                title: 'Northline: The Long Way Home',
                kind: '30-second spot · Live action',
                story: 'After a long night shift, Ada skips the traffic and rides the coast road home as the sun comes up. The ride is the reward.',
                cast: [['Ada', 'kd-ada.webp']],
                boards: 'kd-ad-boards.webp',
                still: 'kd-northline.webp'
            }
        ];
        var STAGES = 4;
        var $ = function (sel) { return demo.querySelector(sel); };
        var sayText = $('.say-chars');
        var replyText = $('.reply-text');
        var tiles = demo.querySelectorAll('.dtile');
        var stageChips = document.querySelectorAll('.stage');
        var dots = demo.querySelectorAll('.demo-dotbtn');
        var caption = $('.demo-caption');
        var state = { idx: 0, phase: 'listening', chars: 0, built: 0, paused: false, visible: false };
        var timers = [];

        var fill = function () {
            var ex = EXAMPLES[state.idx];
            replyText.textContent = ex.reply;
            $('.story').textContent = ex.story;
            $('.cast').innerHTML = '';
            ex.cast.forEach(function (m) {
                var f = document.createElement('figure');
                var img = document.createElement('img');
                img.src = IMG + m[1];
                img.alt = '';
                img.width = 58;
                img.height = 72;
                var cap = document.createElement('figcaption');
                cap.textContent = m[0];
                f.appendChild(img);
                f.appendChild(cap);
                $('.cast').appendChild(f);
            });
            $('.boards-img').src = IMG + ex.boards;
            $('.still-img').src = IMG + ex.still;
            $('.film-img').src = IMG + ex.still;
            $('.film-kind').textContent = ex.kind;
            $('.film-title').textContent = ex.title;
            caption.textContent = 'You say: ' + ex.idea + ' Pilot writes the story, designs the characters, draws the storyboards and makes the video.';
            dots.forEach(function (d, i) { d.setAttribute('aria-current', String(i === state.idx)); });
        };

        var render = function () {
            var ex = EXAMPLES[state.idx];
            var p = state.phase;
            demo.classList.remove('listening', 'typing', 'thinking', 'building', 'playing', 'leaving');
            demo.classList.add(p);
            sayText.textContent = ex.idea.slice(0, state.chars);
            var answered = p === 'building' || p === 'playing' || p === 'leaving';
            tiles.forEach(function (t, step) {
                var done = answered && state.built > step;
                var working = answered && state.built === step && p === 'building';
                t.classList.toggle('done', done);
                t.classList.toggle('working', working);
                if (stageChips[step]) stageChips[step].classList.toggle('on', working);
            });
            $('.demo-body').classList.toggle('leave', p === 'leaving');
        };

        var set = function (patch) {
            for (var k in patch) state[k] = patch[k];
            render();
        };

        var clear = function () { timers.forEach(clearTimeout); timers = []; };

        var run = function () {
            clear();
            if (state.paused || !state.visible) return;
            var idea = EXAMPLES[state.idx].idea;
            var at = 0;
            var then = function (delay, patch) { at += delay; timers.push(setTimeout(function () { set(patch); }, at)); };
            fill();
            if (reduced) {
                set({ phase: 'playing', chars: idea.length, built: STAGES });
                at = 9000;
            } else {
                set({ phase: 'listening', chars: 0, built: 0 });
                then(900, { phase: 'typing' });
                for (var c = 1; c <= idea.length; c += 1) then(30, { chars: c });
                then(500, { phase: 'thinking' });
                then(1000, { phase: 'building' });
                for (var b = 1; b <= STAGES; b += 1) then(1250, { built: b });
                then(600, { phase: 'playing' });
                then(4600, { phase: 'leaving' });
                at += 550;
            }
            timers.push(setTimeout(function () {
                state.idx = (state.idx + 1) % EXAMPLES.length;
                run();
            }, at));
        };

        $('.demo-pause').addEventListener('click', function () {
            state.paused = !state.paused;
            demo.classList.toggle('paused', state.paused);
            this.setAttribute('aria-label', state.paused ? 'Play the example' : 'Pause the example');
            run();
        });
        dots.forEach(function (d, i) {
            d.addEventListener('click', function () { state.idx = i; run(); });
        });

        fill();
        set({ phase: 'listening', chars: 0, built: 0 });
        /* Only animate while the demo is on screen. */
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                var vis = entries[0].isIntersecting;
                if (vis === state.visible) return;
                state.visible = vis;
                if (vis) run(); else clear();
            }, { threshold: 0.25 }).observe(demo);
        } else {
            state.visible = true;
            run();
        }
    }

    /* ── Contact form: send in place, fall back to a normal post without JS ── */
    var form = document.getElementById('contactForm');
    if (form && window.fetch) {
        var note = document.getElementById('formNote');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            note.className = 'form-note';
            note.textContent = 'Sending...';
            fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
                .then(function (r) {
                    if (!r.ok) throw new Error('send failed');
                    form.reset();
                    note.textContent = 'Thanks, we got it. We will reply soon.';
                })
                .catch(function () {
                    note.className = 'form-note err';
                    note.textContent = 'That did not go through. Please try again, or message us on LinkedIn.';
                })
                .then(function () { btn.disabled = false; });
        });
    }
})();
