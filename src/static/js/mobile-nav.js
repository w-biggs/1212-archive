const container = document.getElementsByClassName('container')[0];
const nav = container.getElementsByClassName('nav')[0];
const navExpand = container.getElementsByClassName('nav-expand')[0];

const expandText = navExpand.innerText;
const { collapseText } = navExpand.dataset;

navExpand.addEventListener('click', () => {
  if (container.classList.contains('is-open-nav')) {
    container.classList.remove('is-open-nav');
    navExpand.innerText = expandText;
    navExpand.setAttribute('aria-expanded', 'false');
  } else {
    container.classList.add('is-open-nav');
    navExpand.innerText = collapseText;
    navExpand.setAttribute('aria-expanded', 'true');
  }
});
