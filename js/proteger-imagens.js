// Dificulta o salvamento casual de fotos na vitrine; os arquivos ainda são enviados ao navegador.
const protectedPhotoSelector = '.thumb, .slide .bg, .gmain, .gth button, .gallery-lightbox-stage img';

document.addEventListener('contextmenu', event => {
  if (event.target instanceof Element && event.target.closest(protectedPhotoSelector)) event.preventDefault();
}, true);

document.addEventListener('dragstart', event => {
  if (event.target instanceof Element && (event.target.closest(protectedPhotoSelector) || event.target.matches('img'))) event.preventDefault();
}, true);
