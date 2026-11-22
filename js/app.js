document.addEventListener('DOMContentLoaded', () => {
            // 1. Інтерактивна 3D-перспектива картки та світловий блік при наведенні на фото
            const cards = document.querySelectorAll('.animal-card');

            cards.forEach((card) => {
                const photoWrapper = card.querySelector('.photo-wrapper');
                const photoImg = photoWrapper ? photoWrapper.querySelector('img') : null;
                const descBox = card.querySelector('.desc-box');

                if (photoWrapper && photoImg) {
                    photoWrapper.addEventListener('mouseenter', () => {
                        photoWrapper.classList.add('is-hovered');
                        photoImg.style.transform = 'scale(1.07)';
                    });

                    photoWrapper.addEventListener('mousemove', (e) => {
                        const rect = photoWrapper.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;

                        // Позиція світлового бліку
                        const glareX = (x / rect.width) * 100;
                        const glareY = (y / rect.height) * 100;
                        photoWrapper.style.setProperty('--glare-x', `${glareX}%`);
                        photoWrapper.style.setProperty('--glare-y', `${glareY}%`);

                        // Легкий 3D-нахил усієї картки відносно курсора
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const rotateX = ((y - centerY) / centerY) * -2.8;
                        const rotateY = ((x - centerX) / centerX) * 2.8;

                        card.style.transform = `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
                    });

                    photoWrapper.addEventListener('mouseleave', () => {
                        photoWrapper.classList.remove('is-hovered');
                        photoImg.style.transform = 'scale(1)';
                        card.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg) translateY(0)';
                    });
                }

                // 2. Анімація при наведенні на текстовий опис тварини
                if (descBox) {
                    descBox.addEventListener('mouseenter', () => {
                        descBox.classList.add('is-text-hovered');
                        descBox.style.transform = 'translateY(-3px)';
                    });

                    descBox.addEventListener('mouseleave', () => {
                        descBox.classList.remove('is-text-hovered');
                        descBox.style.transform = 'translateY(0)';
                    });
                }
            });

            // 3. Плавна поява карток під час прокручування сторінки
            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.12,
                rootMargin: '0px 0px -40px 0px'
            });

            document.querySelectorAll('.reveal-item').forEach((item) => {
                revealObserver.observe(item);
            });

            // 4. Надійна плавна навігація по секціях континентів у <header> та <footer>
            const topNav = document.getElementById('top-nav');
            const headerNavList = document.getElementById('header-nav-list');
            const navLinks = document.querySelectorAll('.nav-link[data-target]');
            const sections = Array.from(document.querySelectorAll('.continent-section'));
            let isManualScrolling = false;
            let scrollLockTimer = null;

            function setActiveContinent(id) {
                navLinks.forEach((link) => {
                    const isMatch = link.dataset.target === id;
                    link.classList.toggle('active', isMatch);

                    // Горизонтальне центрування активного пункту в мобільній шапці без впливу на вертикальний скрол
                    if (isMatch && headerNavList && headerNavList.contains(link)) {
                        const targetScrollLeft = link.offsetLeft - (headerNavList.clientWidth / 2) + (link.offsetWidth / 2);
                        headerNavList.scrollTo({
                            left: Math.max(0, targetScrollLeft),
                            behavior: 'smooth'
                        });
                    }
                });
            }

            // Обробник кліків по всіх посиланнях континентів (header + footer)
            navLinks.forEach((link) => {
                link.addEventListener('click', (e) => {
                    const targetId = link.dataset.target;
                    const targetSection = document.getElementById(targetId);
                    if (!targetSection) return;

                    e.preventDefault();
                    isManualScrolling = true;
                    clearTimeout(scrollLockTimer);

                    setActiveContinent(targetId);

                    const navHeight = topNav ? topNav.offsetHeight : 64;
                    const targetTop = targetSection.getBoundingClientRect().top + window.scrollY - navHeight - 20;

                    window.scrollTo({
                        top: Math.max(0, targetTop),
                        behavior: 'smooth'
                    });

                    // Оновлюємо URL-якір без стрибка
                    if (history.replaceState) {
                        history.replaceState(null, '', `#${targetId}`);
                    }

                    // Розблоковуємо скрол-шпигун після завершення плавної анімації прокручування
                    scrollLockTimer = setTimeout(() => {
                        isManualScrolling = false;
                    }, 950);
                });
            });

            // Плавний скрол на початок при кліку на логотип або заголовок у футері
            document.querySelectorAll('a[href="#top"]').forEach((topAnchor) => {
                topAnchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    isManualScrolling = true;
                    clearTimeout(scrollLockTimer);
                    setActiveContinent('eurasia');

                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (history.replaceState) {
                        history.replaceState(null, '', '#top');
                    }

                    scrollLockTimer = setTimeout(() => {
                        isManualScrolling = false;
                    }, 950);
                });
            });

            // Відстеження активної секції під час звичайного скролу користувача
            function updateActiveOnScroll() {
                if (isManualScrolling || sections.length === 0) return;

                const navHeight = topNav ? topNav.offsetHeight : 64;
                const scrollPosition = window.scrollY + navHeight + 140;

                // Якщо користувач дійшов до самого низу сторінки — активуємо останній континент (Антарктиду)
                if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24) {
                    setActiveContinent(sections[sections.length - 1].id);
                    return;
                }

                let currentId = sections[0].id;
                for (const section of sections) {
                    if (scrollPosition >= section.offsetTop) {
                        currentId = section.id;
                    }
                }
                setActiveContinent(currentId);
            }

            window.addEventListener('scroll', updateActiveOnScroll, { passive: true });
        });