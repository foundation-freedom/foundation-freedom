const POSTS_URL = '/foundation-freedom/data/posts.json';

const auth = (() => {
    function readStoredUser() {
        try {
            const raw = window.localStorage.getItem('user');
            if (!raw) {
                return null;
            }
            return JSON.parse(raw);
        } catch (error) {
            console.warn('Unable to parse stored user, treating as guest.', error);
            return null;
        }
    }

    const user = readStoredUser();
    const isMember = Boolean(user && (user.isMember || user.membership === 'active'));

    function canView(post) {
        if (!post || post.visibility !== 'members') {
            return true;
        }
        return isMember;
    }

    function badge(post) {
        if (!post || post.visibility !== 'members') {
            return '';
        }
        return isMember ? 'Members' : 'Members-only';
    }

    return {
        user,
        isMember,
        canView,
        badge,
    };
})();

async function fetchPosts() {
    const response = await fetch(POSTS_URL, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error(`Failed to load posts index: ${response.status}`);
    }

    const posts = await response.json();
    return Array.isArray(posts) ? posts : [];
}

function formatDate(dateString) {
    if (!dateString) {
        return '';
    }

    try {
        const date = new Date(`${dateString}T00:00:00Z`);
        return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date);
    } catch (error) {
        console.warn('Unable to format date', dateString, error);
        return dateString;
    }
}

function createTagList(tags = []) {
    const container = document.createElement('span');
    container.className = 'post-tags';

    tags.forEach((tag) => {
        const tagNode = document.createElement('span');
        tagNode.className = 'tag';
        tagNode.textContent = tag;
        container.append(tagNode);
    });

    return container;
}

function renderPostList(posts, options = {}) {
    const listContainer = document.getElementById('posts-list');
    const emptyState = document.getElementById('posts-empty');
    const filterIndicator = document.getElementById('filter-indicator');

    if (!listContainer) {
        return;
    }

    listContainer.innerHTML = '';

    if (filterIndicator) {
        if (options.activeTag) {
            filterIndicator.textContent = `Filtering by tag: ${options.activeTag}`;
            filterIndicator.hidden = false;
        } else {
            filterIndicator.hidden = true;
            filterIndicator.textContent = '';
        }
    }

    if (!posts.length) {
        if (emptyState) {
            emptyState.hidden = false;
        }
        return;
    }

    if (emptyState) {
        emptyState.hidden = true;
    }

    posts
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .forEach((post) => {
            const card = document.createElement('article');
            card.className = 'post-card';

            const title = document.createElement('h3');
            title.className = 'post-title';
            title.textContent = post.title;

            const meta = document.createElement('div');
            meta.className = 'post-meta';
            const dateNode = document.createElement('time');
            dateNode.dateTime = post.date || '';
            dateNode.textContent = formatDate(post.date);
            meta.append(dateNode);

            const tagList = createTagList(post.tags);
            if (tagList.childElementCount) {
                meta.append(tagList);
            }

            const badgeLabel = auth.badge(post);
            if (badgeLabel) {
                const badge = document.createElement('span');
                badge.className = `post-badge ${post.visibility === 'members' ? 'post-badge--members' : ''}`;
                badge.textContent = badgeLabel;
                meta.append(badge);
            }

            const summary = document.createElement('p');
            summary.className = 'post-summary';
            summary.textContent = post.summary || '';

            const readLink = document.createElement('a');
            readLink.className = 'post-read-link';
            readLink.href = `/foundation-freedom/pages/post.html?slug=${encodeURIComponent(post.slug)}`;
            readLink.textContent = auth.canView(post) ? 'Read' : 'Members only';
            readLink.setAttribute('aria-label', `Read ${post.title}`);

            if (!auth.canView(post)) {
                readLink.classList.add('post-read-link--locked');
                readLink.href = '#';
                readLink.addEventListener('click', (event) => {
                    event.preventDefault();
                });
            }

            card.append(title, meta, summary, readLink);
            listContainer.append(card);
        });
}

function escapeHtml(text = '') {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function transformInline(text = '') {
    let html = text;
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    return html;
}

function markdownToHtml(markdown = '') {
    const lines = markdown.split(/\r?\n/);
    let html = '';
    let inList = false;

    const closeList = () => {
        if (inList) {
            html += '</ul>';
            inList = false;
        }
    };

    lines.forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed) {
            closeList();
            html += '';
            return;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            closeList();
            const level = headingMatch[1].length;
            const content = transformInline(escapeHtml(headingMatch[2]));
            html += `<h${level}>${content}</h${level}>`;
            return;
        }

        const listMatch = trimmed.match(/^[-*+]\s+(.*)$/);
        if (listMatch) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            const content = transformInline(escapeHtml(listMatch[1]));
            html += `<li>${content}</li>`;
            return;
        }

        closeList();
        const content = transformInline(escapeHtml(trimmed));
        html += `<p>${content}</p>`;
    });

    closeList();
    return html;
}

async function renderPostPage(slug) {
    const titleNode = document.getElementById('post-title');
    const metaNode = document.getElementById('post-meta');
    const summaryNode = document.getElementById('post-summary');
    const bodyNode = document.getElementById('post-body');
    const errorNode = document.getElementById('post-error');

    try {
        const posts = await fetchPosts();
        const post = posts.find((item) => item.slug === slug);

        if (!post) {
            throw new Error('Post not found');
        }

        if (!auth.canView(post)) {
            throw new Error('This post is available to members only.');
        }

        if (titleNode) {
            titleNode.textContent = post.title;
            document.title = `${post.title} | Foundation Freedom`;
        }

        if (summaryNode && post.summary) {
            summaryNode.hidden = false;
            summaryNode.textContent = post.summary;
        }

        if (metaNode) {
            metaNode.innerHTML = '';
            const dateNode = document.createElement('time');
            dateNode.dateTime = post.date || '';
            dateNode.textContent = formatDate(post.date);
            metaNode.append(dateNode);

            const tags = createTagList(post.tags);
            if (tags.childElementCount) {
                metaNode.append(tags);
            }

            const badgeLabel = auth.badge(post);
            if (badgeLabel) {
                const badge = document.createElement('span');
                badge.className = `post-badge ${post.visibility === 'members' ? 'post-badge--members' : ''}`;
                badge.textContent = badgeLabel;
                metaNode.append(badge);
            }
        }

        const response = await fetch(`/foundation-freedom/posts/${slug}.md`, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Failed to load post content (${response.status})`);
        }

        const markdown = await response.text();
        if (bodyNode) {
            bodyNode.innerHTML = markdownToHtml(markdown);
        }
    } catch (error) {
        console.error(error);
        if (errorNode) {
            errorNode.textContent = error.message || 'Unable to load this post right now.';
            errorNode.hidden = false;
        }
    }
}

async function renderBlogPage() {
    try {
        const params = new URLSearchParams(window.location.search);
        const activeTag = params.get('tag');
        const posts = await fetchPosts();

        const visiblePosts = posts.filter((post) => {
            const matchesTag = activeTag ? post.tags?.includes(activeTag) : true;
            return matchesTag;
        });

        renderPostList(visiblePosts, { activeTag });
    } catch (error) {
        console.error(error);
        const emptyState = document.getElementById('posts-empty');
        if (emptyState) {
            emptyState.hidden = false;
            emptyState.textContent = 'We could not load the posts right now. Please try again later.';
        }
    }
}

function init() {
    const blogList = document.querySelector('[data-page="blog"]');
    const postView = document.querySelector('[data-page="post"]');

    if (blogList) {
        renderBlogPage();
    }

    if (postView) {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('slug');
        if (slug) {
            renderPostPage(slug);
        } else {
            const errorNode = document.getElementById('post-error');
            if (errorNode) {
                errorNode.hidden = false;
                errorNode.textContent = 'No post specified. Please return to the blog.';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', init);

export { markdownToHtml, auth };
