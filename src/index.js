import ImageSearch from './image-api';
import refs from './refs';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

let isLoading = false;
const request = new ImageSearch();
request.countImgToPage = 40;

refs.form.addEventListener('submit', onSubmitForm);

const simpleLightBoxGallery = new SimpleLightbox(
  '.galery > .photo-card > .link-img ',
  {
    captionsData: 'alt',
    captionDelay: 250,
  }
);

async function fetchGaleryImg() {
  if (isLoading) {
    return;
  }
  window.removeEventListener('scroll', onScroll);
  try {
    isLoading = true;
    const data = await request.getRequestImg();
    isLoading = false;

    if (data.hits.length === 0 && request.page - 1 === 1) {
      Notify.warning(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }

    if (request.page - 1 > Math.ceil(data.totalHits / request.countImgToPage)) {
      Notify.warning(
        'We`re sorry, but you`ve reached the end of search results.'
      );
      return;
    }
    if (data.hits.length > 0) {
      Notify.info(`Hooray! We found ${data.hits.length} images.`, {
        timeout: 1000,
      });
    }
    window.addEventListener('scroll', onScroll);
    return data;
  } catch (error) {
    isLoading = false;
    if (
      request.page * request.countImgToPage > 500 &&
      error.response.data === '[ERROR 400] "page" is out of valid range.'
    ) {
      Notify.warning(
        'We`re sorry, but you`ve reached the end of search results.'
      );
      return;
    }
    console.error(error.message);
    Notify.failure(error.message);
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
        webformatWidth,
        webformatHeight,
      }) => {
        return `<li class="photo-card">
    <a class="link-img" href="${largeImageURL}">
      <img src="${webformatURL}" alt="${tags}" loading="lazy" width="${webformatWidth}" height="${webformatHeight}" />
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

async function onSubmitForm(e) {
  e.preventDefault();
  request.param = e.currentTarget.elements.query.value;
  request.resetPage();
  clearGalery(refs.galeryUl);
  showLoader();
  // ***WITHOUT SYNC/AWAIT***
  // fetchGaleryImg()
  //   .then(data => {
  //     hideLoader();
  //     appendGaleryMarkup(refs.galeryUl, createGaleryMarkup(data));
  //   })
  //   .catch(error => {
  //     hideLoader();
  //     console.error(error.message);
  //   });
  try {
    const response = await fetchGaleryImg();
    hideLoader();
    appendGaleryMarkup(refs.galeryUl, createGaleryMarkup(response));
  } catch (error) {
    hideLoader();
    console.error('Error!', error.message);
  }
}

function clearGalery(el) {
  el.innerHTML = '';
}

function appendGaleryMarkup(el, markUp) {
  el.insertAdjacentHTML('beforeend', markUp);
  simpleLightBoxGallery.refresh();
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

async function onScroll() {
  const documentRect = refs.galeryUl.getBoundingClientRect();
  if (documentRect.bottom < document.documentElement.clientHeight + 50) {
    showLoader();
    // ***WITHOUT SYNC/AWAIT***
    // fetchGaleryImg()
    //   .then(data => {
    //     hideLoader();
    //     appendGaleryMarkup(refs.galeryUl, createGaleryMarkup(data));
    //   })
    //   .catch(error => {
    //     hideLoader();
    //     console.error(error.message);
    //   });
    try {
      const response = await fetchGaleryImg();
      hideLoader();
      appendGaleryMarkup(refs.galeryUl, createGaleryMarkup(response));
    } catch (error) {
      hideLoader();
      console.error('Error!', error.message);
    }
  }
}
