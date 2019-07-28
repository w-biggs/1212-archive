/**
 * Handle image lazyloading.
 */

document.addEventListener('DOMContentLoaded', () => {
  const imageObserver = new IntersectionObserver((entries) => {
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      if (entry.isIntersecting) { // If image visible
        const image = entry.target; // Get the element
        image.style.backgroundImage = `url('${image.dataset.bg}')`;
      }
    }
  });
  
  const images = document.getElementsByClassName('elo-team-logo');

  for (let i = 0; i < images.length; i += 1) {
    const image = images[i];
    imageObserver.observe(image);
  }
});
