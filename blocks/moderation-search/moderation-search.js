import { LIBS } from '../../scripts/scripts.js';

const { createTag } = await import(`${LIBS}/utils/utils.js`);
const { buildArticleCard } = await import(`${LIBS}/blocks/article-feed/article-helpers.js`);
const SEARCH_ICON = '<svg class="moderation-search-input-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" focusable="false"><path d="M14 2A8 8 0 0 0 7.4 14.5L2.4 19.4a1.5 1.5 0 0 0 2.1 2.1L9.5 16.6A8 8 0 1 0 14 2Zm0 14.1A6.1 6.1 0 1 1 20.1 10 6.1 6.1 0 0 1 14 16.1Z"></path></svg>';

async function fetchArticles() {
  let articles;
  await fetch('/query-index.json')
    .then((response) => response.json())
    .then((json) => {
      articles = json.data;
    });
  return articles;
}

function resetModerationSearch(block) {
  const header = block.querySelector('h1');
  block.innerHTML = '';
  block.append(header);
}

function buildSearch(block, placeholderText) {
  const searchInputContainer = createTag('div', { class: 'moderation-search-input-container' });
  block.append(searchInputContainer);
  const searchInput = createTag('input', { class: 'moderation-search-input', placeholder: placeholderText });
  searchInputContainer.append(searchInput);
  const searchInputIcon = createTag('svg');
  searchInputContainer.append(searchInputIcon);
  searchInputIcon.outerHTML = SEARCH_ICON;
  const resultsCountElement = createTag('span', { class: 'moderation-search-results-count' });
  block.append(resultsCountElement);
  const resultsContainer = createTag('div', { class: 'moderation-search-results-container' });
  block.append(resultsContainer);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function initiateSearch(block, articles, resultsText, noResultsText) {
  const searchInput = block.querySelector('.moderation-search-input');
  const resultsContainer = block.querySelector('.moderation-search-results-container');
  const resultsCountElement = block.querySelector('.moderation-search-results-count');

  searchInput.addEventListener('input', debounce(() => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    resultsContainer.innerHTML = '';
    if (searchTerm) {
      const results = [];
      articles.forEach((article) => {
        if (
          article.title.toLowerCase().includes(searchTerm)
          || article.category.toLowerCase().includes(searchTerm)
          || article.description.toLowerCase().includes(searchTerm)
          || article.tags.toLowerCase().includes(searchTerm)
        ) {
          results.push(article);
          const articleElement = buildArticleCard(article);
          resultsContainer.append(articleElement);
        }
      });

      if (results.length) {
        resultsCountElement.textContent = resultsText.replace('[count]', results.length);
        resultsCountElement.classList.add('active');
        resultsContainer.classList.add('active');
      } else {
        resultsCountElement.textContent = noResultsText;
        resultsCountElement.classList.add('active');
        resultsContainer.classList.remove('active');
      }
    } else {
      resultsCountElement.textContent = '';
      resultsCountElement.classList.remove('active');
      resultsContainer.classList.remove('active');
    }
  }, 300));
}

export default async function init(block) {
  const parameters = block.querySelectorAll('p');
  const placeholderText = parameters[0].textContent;
  const resultsText = parameters[1].textContent;
  const noResultsText = parameters[2].textContent;
  const articles = await fetchArticles();
  resetModerationSearch(block);
  buildSearch(block, placeholderText);
  initiateSearch(block, articles, resultsText, noResultsText);
}
