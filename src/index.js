import ImageSearch from './image-api';
import refs from './refs';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import throttle from 'lodash.throttle';
import debounce from 'lodash.debounce';

let isLoading = false;
const request = new ImageSearch();
request.countImgToPage = 40;

refs.form.addEventListener('submit', onSubmitForm);

async function fetchGaleryImg() {
  if (isLoading) {
    return;
  }
  try {
    isLoading = true;
    console.log('isLoading befor request', isLoading);
    const data = await request.getRequestImg();
    isLoading = false;
    console.log('isLoading after request', isLoading);

    if (request.page - 1 > Math.ceil(data.totalHits / request.countImgToPage)) {
      Notify.warning('Hooray! We found totalHits images.');
      window.removeEventListener('scroll', debounceOnScroll);
      return;
    }
    if (data.hits.length === 0) {
      Notify.warning('Sorry, nothing was found for your request!');
      window.removeEventListener('scroll', debounceOnScroll);
      return;
    }

    return data;
  } catch (error) {
    console.error(error.message);
    Notify.failure(error.message);
    window.removeEventListener('scroll', debounceOnScroll);
  }
}

function createGaleryMarkup(data) {
  if (!data) {
    console.log('Data is empty!');
    return (mark = '');
  }
  const markUp = data.hits
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<li class="photo-card">
    <a class="link-img" href="${largeImageURL}">
      <img src="${webformatURL}" alt="${tags}" loading="lazy" width="320" height="210" />
    </a>
    <div class="info">
      <p class="info-item">
      Likes:
        <b>${likes}</b>
      </p>
      <p class="info-item">
      Views:
        <b>${views}</b>
      </p>
      <p class="info-item">
      Comments:
        <b>${comments}</b>
      </p>
      <p class="info-item">
      Downloads:
        <b>${downloads}</b>
      </p>
    </div>
</li>`;
      }
    )
    .join('');
  return markUp;
}

function onSubmitForm(e) {
  e.preventDefault();
  request.param = e.currentTarget.elements.query.value;
  request.resetPage();
  clearGalery(refs.galeryUl);
  showLoader();
  fetchGaleryImg()
    .then(data => {
      hideLoader();
      appendGaleryMarkup(refs.galeryUl, createGaleryMarkup(data));
    })
    .catch(error => {
      hideLoader();
      console.error(error.message);
    });
  window.addEventListener('scroll', debounceOnScroll);
}

function clearGalery(el) {
  el.innerHTML = '';
}

function appendGaleryMarkup(el, markUp) {
  el.insertAdjacentHTML('beforeend', markUp);
}

function showLoader() {
  if (refs.loader.classList.contains('is-hidden')) {
    refs.loader.classList.remove('is-hidden');
  }
}

function hideLoader() {
  if (!refs.loader.classList.contains('is-hidden')) {
    refs.loader.classList.add('is-hidden');
  }
}

//

function onScroll() {
  const documentRect = refs.galeryUl.getBoundingClientRect();
  if (documentRect.bottom < document.documentElement.clientHeight) {
    showLoader();
    fetchGaleryImg()
      .then(data => {
        hideLoader();
        appendGaleryMarkup(refs.galeryUl, createGaleryMarkup(data));
      })
      .catch(error => {
        hideLoader();
        console.error(error.message);
      });
  }
}

function debounceOnScroll() {
  const fn = debounce(onScroll, 1000);
  fn();
}
