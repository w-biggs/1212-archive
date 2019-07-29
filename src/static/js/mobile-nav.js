/**
 * Handles the mobile nav functionality.
 */

/**
 * Open the mobile nav menu.
 *
 * @param {HTMLElement} container - The page's container element.
 * @param {HTMLElement} navExpand - The expand button element.
 */
const openNav = function openNavOnMobile(container, navExpand) {
  const { collapseText } = navExpand.dataset;

  container.classList.add('is-open-nav');
  const buttonText = navExpand.firstChild;
  buttonText.nodeValue = collapseText;
  navExpand.setAttribute('aria-expanded', 'true');
};

/**
 * Close the mobile nav menu.
 *
 * @param {HTMLElement} container - The page's container element.
 * @param {HTMLElement} navExpand - The expand button element.
 */
const closeNav = function openNavOnMobile(container, navExpand) {
  const { expandText } = navExpand.dataset;

  container.classList.remove('is-open-nav');
  const buttonText = navExpand.firstChild;
  buttonText.nodeValue = expandText;
  navExpand.setAttribute('aria-expanded', 'false');
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementsByClassName('container')[0];
  const nav = container.getElementsByClassName('nav')[0];
  const navExpand = container.getElementsByClassName('nav-expand')[0];

  navExpand.addEventListener('click', () => {
    if (navExpand.getAttribute('aria-expanded') === 'true') {
      closeNav(container, navExpand);
    } else {
      openNav(container, navExpand);
    }
  });
  
  [nav, navExpand].forEach(element => element.addEventListener('keydown', (event) => {
    if (event.keyCode === 27) {
      closeNav(container, navExpand);
    }
  }));
});
