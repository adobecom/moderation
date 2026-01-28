import { LIBS } from '../../scripts/scripts.js';

const { createTag } = await import(`${LIBS}/utils/utils.js`);
const { decorateButtons, applyAccessibilityEvents } = await import(`${LIBS}/utils/decorate.js`);

function processColoredText(input) {
  if ((typeof input !== 'string' && !input?.innerHTML) ||
      !/\[(red|blue|yellow|green)\]/.test(typeof input === 'string' ? input : input.innerHTML)) return input;

  const bbCode = (text) => text.replace(/\[(red|blue|yellow|green)\](.*?)\[\/\1\]/g, (_match, color, content) => `<span class="text-${color}">${content}</span>`);

  if (typeof input === 'string') return bbCode(input);

  input.innerHTML = bbCode(input.innerHTML);
  return input;
}

export function createMediaContainers(el) {
  el.querySelectorAll('.descr-details > div').forEach((container) => {
    processColoredText(container);
    let wrapper = null;
    Array.from(container.childNodes).forEach((node) => {
      const isPic = node.nodeType === 1 && node.matches('picture');
      const isVideoHolder = node.nodeType === 1 && node.matches('.video-holder');
      const isVideo = node.nodeType === 1 && node.matches('video');
      const hasPic = node.nodeType === 1 && node.querySelector(':scope > picture');
      const hasVideoHolder = node.nodeType === 1 && node.querySelector(':scope > .video-holder');
      const hasVideo = node.nodeType === 1 && node.querySelector(':scope > video') && !node.matches('.video-holder');
      const isMedia = isPic || isVideoHolder || isVideo;
      const hasMedia = hasPic || hasVideoHolder || hasVideo;
      if (isMedia || hasMedia) {
        if (!wrapper) {
          wrapper = createTag('div', { class: 'descr-details-media-container' });
          container.insertBefore(wrapper, node);
        }
        if (isMedia) {
          wrapper.appendChild(node);
        } else {
          if (hasPic) node.querySelectorAll(':scope > picture').forEach((pic) => wrapper.appendChild(pic));
          if (hasVideoHolder) node.querySelectorAll(':scope > .video-holder').forEach((vh) => wrapper.appendChild(vh));
          if (hasVideo) node.querySelectorAll(':scope > video').forEach((v) => wrapper.appendChild(v));
        }
      } else {
        wrapper = null;
      }
    });

    container.querySelectorAll('table').forEach((table) => {
      const rowsArr = Array.from(table.querySelectorAll('tr'));
      const headers = Array.from(rowsArr[0].querySelectorAll('td,th'));
      const bodyRows = rowsArr.slice(1);
      const output = [];
      bodyRows.forEach((row) => {
        if (row.querySelector('picture, .video-holder, video')) {
          const rowC = createTag('div', { class: 'descr-details-gray-row' });
          row.querySelectorAll('td').forEach((td, i) => {
            const txt = headers[i]?.textContent || '';
            const isTall = /\(?tall\)?/i.test(txt);
            let cls = '';
            if (txt.includes('Y')) {
              cls = 'checkmark';
            } else if (txt.includes('X')) {
              cls = 'crossmark';
            } else if (txt.includes('?')) {
              cls = 'questionmark';
            } else if (txt.includes('!')) {
              cls = 'exclammark';
            } else if (txt.includes('i')) {
              cls = 'infomark';
            }
            if (isTall) cls += ' tall-example';
            const hasMedia = td.querySelector('picture, .video-holder, video');
            if (hasMedia) {
              const cell = createTag('div', {
                class: `descr-details-gray-container${cls ? ` ${cls}` : ''}`,
              });
              
              const processMedia = (media, row) => {
                if (media.tagName === 'VIDEO') {
                  const existingVideoHolder = media.closest('.video-holder');
                  if (media.getAttribute('data-video-source') && !media.querySelector('source')) {
                    media.appendChild(createTag('source', {
                      src: media.getAttribute('data-video-source'),
                      type: 'video/mp4',
                    }));
                  }
                  if (!existingVideoHolder) {
                    const videoHolder = createTag('div', { class: 'video-holder' });
                    videoHolder.appendChild(media);
                    const videoDiv = createTag('div', { class: 'descr-details-video' });
                    videoDiv.appendChild(videoHolder);
                    row.appendChild(videoDiv);
                  } else {
                    const videoDiv = createTag('div', { class: 'descr-details-video' });
                    videoDiv.appendChild(existingVideoHolder);
                    row.appendChild(videoDiv);
                  }
                } else if (media.classList.contains('video-holder')) {
                  media.querySelectorAll('video').forEach((video) => {
                    const videoSource = video.getAttribute('data-video-source');
                    if (videoSource && !video.querySelector('source')) {
                      video.appendChild(createTag('source', {
                        src: videoSource,
                        type: 'video/mp4',
                      }));
                    }
                  });
                  const videoDiv = createTag('div', { class: 'descr-details-video' });
                  videoDiv.appendChild(media);
                  row.appendChild(videoDiv);
                } else if (media.matches('picture')) {
                  row.appendChild(media);
                }
              };

              const allChildren = Array.from(td.children);
              let currentRow = null;
              let lastWasParagraph = false;

              allChildren.forEach((child) => {
                if (child.tagName === 'P') {
                  const mediaInParagraph = Array.from(child.querySelectorAll('picture, .video-holder, video:not(.video-holder video)'));
                  if (mediaInParagraph.length) {
                    currentRow = createTag('div', { class: 'example-media-row' });
                    mediaInParagraph.forEach((media) => processMedia(media, currentRow));
                    cell.appendChild(currentRow);
                    lastWasParagraph = true;
                  }
                } else if (child.matches('picture, .video-holder, video')) {
                  if (!currentRow || lastWasParagraph) {
                    currentRow = createTag('div', { class: 'example-media-row' });
                    cell.appendChild(currentRow);
                    lastWasParagraph = false;
                  }
                  processMedia(child, currentRow);
                }
              });
              const textNodes = Array.from(td.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
              const textParagraphs = Array.from(td.querySelectorAll('p')).filter((p) => p.textContent.trim() && !p.querySelector('picture, .video-holder, video'));
              textNodes.forEach((textNode) => {
                if (textNode.textContent.trim()) cell.appendChild(createTag('p', {}, textNode.textContent));
              });
              textParagraphs.forEach((p) => cell.appendChild(p.cloneNode(true)));
              rowC.appendChild(cell);
            } else {
              const cell = createTag('div', { class: `descr-details-text-only${cls ? ` ${cls}` : ''}` });
              while (td.firstChild) cell.appendChild(td.firstChild);
              rowC.appendChild(cell);
            }
          });
          processColoredText(rowC);
          output.push(rowC);
        } else {
          const capC = createTag('div', { class: 'descr-details-gray-caption' });
          row.querySelectorAll('td').forEach((td) => {
            const c = createTag('div', { class: 'descr-details-gray-caption-cell' });
            while (td.firstChild) c.appendChild(td.firstChild);
            capC.appendChild(c);
          });
          processColoredText(capC);
          output.push(capC);
        }
      });
      const wrapperDiv = createTag('div', { class: 'example-box' });
      output.forEach((node) => wrapperDiv.appendChild(node));
      table.replaceWith(wrapperDiv);
    });
  });
  el.querySelectorAll('video[data-video-source]').forEach(applyAccessibilityEvents);
}

function createItem(container, id, content, num) {
  const panelId = `example-${id}-content-${num}`;
  const panel = content?.firstElementChild;

  const dd = createTag('div', { id: panelId, class: 'descr-details' }, panel);

  container.append(dd);

  return { dd };
}

function getUniqueId(el) {
  const examples = document.querySelectorAll('.example');
  return [...examples].indexOf(el) + 1;
}

export default async function init(el) {
  const id = getUniqueId(el);
  const exampleContainer = createTag('div', { 
    class: 'example-list', 
    id: `example-${id}`, 
    role: 'presentation' 
  });
  decorateButtons(el);

  el.querySelectorAll(':scope > div').forEach((content, idx) => 
    createItem(exampleContainer, id, content, idx + 1)
  );

  el.innerHTML = '';
  el.className = `example-container ${el.className}`;
  el.classList.remove('example');
  const maxWidthClass = Array.from(el.classList).find((style) => style.startsWith('max-width-'));
  el.classList.add('con-block', maxWidthClass || 'max-width-10-desktop');
  exampleContainer.classList.add('foreground');
  el.append(exampleContainer);
  createMediaContainers(el);
}
