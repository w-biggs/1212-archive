const container = document.getElementsByClassName('container')[0];
const nav = container.getElementsByClassName('nav')[0];
const navExpand = container.getElementsByClassName('nav-expand')[0];

const expandText = navExpand.innerText;
const { collapseText } = navExpand.dataset;

const openNav = function openNavOnMobile() {
  container.classList.add('is-open-nav');
  navExpand.innerText = collapseText.trim();
  navExpand.setAttribute('aria-expanded', 'true');
};

const closeNav = function openNavOnMobile() {
  container.classList.remove('is-open-nav');
  navExpand.innerText = expandText.trim();
  navExpand.setAttribute('aria-expanded', 'false');
};

navExpand.addEventListener('click', () => {
  if (navExpand.getAttribute('aria-expanded') === 'true') {
    closeNav();
  } else {
    openNav();
  }
});

[nav, navExpand].forEach(element => element.addEventListener('keydown', (event) => {
  if (event.keyCode === 27) {
    closeNav();
  }
}));
