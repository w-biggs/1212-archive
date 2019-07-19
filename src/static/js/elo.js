const eloExpand = document.getElementsByClassName('elo-expand')[0];
const eloExpandButton = eloExpand.getElementsByTagName('button')[0];

const expandText = eloExpandButton.innerText;
const { collapseText } = eloExpandButton.dataset;

const eloTable = document.getElementsByClassName('elo-table')[0];

eloExpandButton.addEventListener('click', () => {
  if (eloExpandButton.getAttribute('aria-expanded') === 'true') {
    eloTable.classList.remove('is-collapsed');
    eloExpandButton.innerText = collapseText;
    eloExpandButton.setAttribute('aria-expanded', 'false');
  } else {
    eloTable.classList.add('is-collapsed');
    eloExpandButton.innerText = expandText;
    eloExpandButton.setAttribute('aria-expanded', 'true');
  }
});

const emptyNode = function removeAllChildrenFromANode(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.deleteContents();
};

const sortColumns = function sortEloTableColumns(columnClass, isAscending) {
  const tbody = eloTable.getElementsByTagName('tbody')[0];
  const rows = Array.from(tbody.getElementsByTagName('tr'));
  rows.sort((a, b) => {
    const aCell = a.getElementsByClassName(columnClass)[0];
    const bCell = b.getElementsByClassName(columnClass)[0];

    const aVal = aCell.dataset.value;
    const bVal = bCell.dataset.value;

    if (aVal > bVal) {
      return isAscending ? -1 : 1;
    }
    if (bVal > aVal) {
      return isAscending ? 1 : -1;
    }
    return 0;
  });

  emptyNode(tbody);

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    tbody.appendChild(row);
  }
};

const eloHeaderCells = eloTable.getElementsByTagName('th');

for (let i = 0; i < eloHeaderCells.length; i += 1) {
  const eloHeaderCell = eloHeaderCells[i];
  const columnClass = eloHeaderCell.classList[0];

  const sorter = eloHeaderCell.getElementsByClassName('sorter')[0];

  eloHeaderCell.addEventListener('click', () => {
    if (sorter.classList.contains('desc')) {
      sorter.classList.remove('desc');
      sorter.classList.add('asc');
      sortColumns(columnClass, true);
    } else if (sorter.classList.contains('asc')) {
      sorter.classList.remove('asc');
      sorter.classList.add('desc');
      sortColumns(columnClass, false);
    } else {
      for (let j = 0; j < eloHeaderCells.length; j += 1) {
        const otherHeaderCell = eloHeaderCells[j];
        const otherSorter = otherHeaderCell.getElementsByClassName('sorter')[0];
        if (otherSorter) {
          otherSorter.classList.remove('asc');
          otherSorter.classList.remove('desc');
        }
      }

      sorter.classList.add('desc');
      sortColumns(columnClass, false);
    }
  });
}
