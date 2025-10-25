document.addEventListener('DOMContentLoaded', function () {
    console.log('Foundation Freedom ready');

    if (document.body.classList.contains('page-404')) {
        console.log('404 page loaded');
    }

    const year = new Date().getFullYear();
    document.querySelectorAll('.js-current-year').forEach(function (node) {
        node.textContent = year;
    });

    const blogLinkHref = '/foundation-freedom/pages/blog.html';

    const ensureBlogLink = function (container) {
        if (!container) {
            return null;
        }

        const links = Array.from(container.querySelectorAll('a'));
        const existing = links.find(function (link) {
            return link.getAttribute('href') === blogLinkHref;
        });

        if (existing) {
            return existing;
        }

        const blogLink = document.createElement('a');
        blogLink.href = blogLinkHref;
        blogLink.textContent = 'Blog';

        const contactLink = links.find(function (link) {
            return link.getAttribute('href') === '/foundation-freedom/pages/contact.html';
        });

        if (contactLink && contactLink.parentNode === container) {
            container.insertBefore(blogLink, contactLink);
        } else {
            container.appendChild(blogLink);
        }

        return blogLink;
    };

    const navBlogLinks = Array.from(document.querySelectorAll('.site-nav')).map(ensureBlogLink).filter(Boolean);
    const footerBlogLinks = Array.from(document.querySelectorAll('.footer-links')).map(ensureBlogLink).filter(Boolean);

    const isBlogContext = Boolean(document.querySelector('[data-page="blog"]'));
    const isPostContext = Boolean(document.querySelector('[data-page="post"]'));

    if (isBlogContext || isPostContext) {
        const markCurrent = function (link) {
            if (link && !link.hasAttribute('aria-current')) {
                link.setAttribute('aria-current', 'page');
            }
        };

        markCurrent(navBlogLinks[0]);
        markCurrent(footerBlogLinks[0]);
    }

    const contactForm = document.getElementById('contact-form');
    const sendLink = document.getElementById('contact-send');

    if (!contactForm || !sendLink) {
        return;
    }

    const nameField = document.getElementById('contact-name');
    const emailField = document.getElementById('contact-email');
    const messageField = document.getElementById('contact-message');
    const feedback = document.getElementById('contact-feedback');

    sendLink.addEventListener('click', function (event) {
        const name = nameField ? nameField.value.trim() : '';
        const email = emailField ? emailField.value.trim() : '';
        const message = messageField ? messageField.value.trim() : '';

        if (!name || !email || !message) {
            event.preventDefault();
            if (feedback) {
                feedback.textContent = 'Please provide your name, email, and message before sending.';
                feedback.hidden = false;
            }
            return;
        }

        if (feedback) {
            feedback.textContent = '';
            feedback.hidden = true;
        }

        const subject = 'Contact from Foundation Freedom site';
        const bodyLines = [`Name: ${name}`, `Email: ${email}`, '', message];
        const mailtoUrl = `mailto:foundationfreedom@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

        sendLink.href = mailtoUrl;
    });
});
