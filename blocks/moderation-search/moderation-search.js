import { LIBS } from '../../scripts/scripts.js';

const { createTag } = await import(`${LIBS}/utils/utils.js`);

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
  const searchInput = createTag('input', { class: 'moderation-search-input', placeholder: placeholderText });
  block.append(searchInput);
  const resultsCountElement = createTag('span', { class: 'moderation-search-results-count' });
  block.append(resultsCountElement);
  const resultsContainer = createTag('div', { class: 'moderation-search-results' });
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
  const resultsCountElement = block.querySelector('.moderation-search-results-count');

  searchInput.addEventListener('input', debounce(() => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm) {
      let results = [];
      articles.forEach((article) => {
        if (
          article.title.toLowerCase().includes(searchTerm)
          || article.category.toLowerCase().includes(searchTerm)
          || article.description.toLowerCase().includes(searchTerm)
          || article.tags.toLowerCase().includes(searchTerm)
        ) {
          results.push(article);
        }
      });

      if (results.length) {
        resultsCountElement.textContent = resultsText.replace('[count]', results.length);
        resultsCountElement.classList.add('active');
      } else {
        resultsCountElement.textContent = noResultsText;
        resultsCountElement.classList.add('active');
      }
    } else {
      resultsCountElement.textContent = '';
      resultsCountElement.classList.remove('active');
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
