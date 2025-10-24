document.addEventListener('DOMContentLoaded', function () {
    console.log('Foundation Freedom ready');

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
