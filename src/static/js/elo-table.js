/**
 * Elo table functionality.
 */

/**
 * Remove all children from a node.
 *
 * @param {Node} node - A node to empty.
 */
const emptyNode = function removeAllChildrenFromANode(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.deleteContents();
};

/**
 * Sort rows by the given column.
 *
 * @param {HTMLElement} rowA - A row to compare.
 * @param {HTMLElement} rowB - A row to compare.
 * @param {string} columnClass - The class of the column to sort by.
 * @param {boolean} isAscending - Whether to scort ascending or descending.
 */
const sortRows = function sortRowsByColumn(rowA, rowB, columnClass, isAscending) {
  const cellA = rowA.getElementsByClassName(columnClass)[0];
  const cellB = rowB.getElementsByClassName(columnClass)[0];
  
  // Check if it's a number - if it is, sort it as a number.
  const valA = Number.isNaN(parseFloat(cellA.dataset.value))
    ? cellA.dataset.value : parseFloat(cellA.dataset.value);
  const valB = Number.isNaN(parseFloat(cellB.dataset.value))
    ? cellB.dataset.value : parseFloat(cellB.dataset.value);

  if (valA > valB) {
    return isAscending ? -1 : 1;
  }
  if (valB > valA) {
    return isAscending ? 1 : -1;
  }
  return 0;
};

/**
 * Sort the Elo table by the given column.
 *
 * @param {HTMLElement} eloTable - The Elo table to sort.
 * @param {string} columnClass - The class of the column to sort by.
 * @param {boolean} isAscending - Whether to scort ascending or descending.
 */
const sortTable = function sortEloTable(eloTable, columnClass, isAscending) {
  const tbody = eloTable.getElementsByTagName('tbody')[0];
  const rows = Array.from(tbody.getElementsByTagName('tr'));

  // Sort the rows
  rows.sort((a, b) => sortRows(a, b, columnClass, isAscending));

  // Delete all rows
  emptyNode(tbody);

  // Re-add the rows in the sorted order.
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    tbody.appendChild(row);
  }
};

/**
 * Expands the Elo table.
 *
 * @param {HTMLElement} eloExpandButton - The button that was clicked.
 * @param {HTMLElement} eloTable - The Elo table.
 */
const expandEloTable = function expandEloTable(eloExpandButton, eloTable) {
  const { collapseText } = eloExpandButton.dataset;

  eloTable.classList.remove('is-collapsed');
  const buttonText = eloExpandButton.firstChild;
  buttonText.nodeValue = collapseText;
  eloExpandButton.setAttribute('aria-expanded', 'true');
};

/**
 * Collapses the Elo table.
 *
 * @param {HTMLElement} eloExpandButton - The button that was clicked.
 * @param {HTMLElement} eloTable - The Elo table.
 */
const collapseEloTable = function collapseEloTable(eloExpandButton, eloTable) {
  const { expandText } = eloExpandButton.dataset;

  eloTable.classList.add('is-collapsed');
  const buttonText = eloExpandButton.firstChild;
  buttonText.nodeValue = expandText;
  eloExpandButton.setAttribute('aria-expanded', 'false');
};

/**
 * Create the listener for the elo expand button.
 */
const clickListener = function eloExpandButtonClickListener() {
  const eloExpand = document.getElementsByClassName('elo-expand')[0];
  const eloExpandButton = eloExpand.getElementsByTagName('button')[0];
  const eloTable = document.getElementsByClassName('elo-table')[0];
  
  eloExpandButton.addEventListener('click', () => {
    if (eloExpandButton.getAttribute('aria-expanded') === 'true') {
      collapseEloTable(eloExpandButton, eloTable);
    } else {
      expandEloTable(eloExpandButton, eloTable);
    }
  });
};

/**
 * Remove the sorting classes from all column headers.
 *
 * @param {HTMLCollection} headerCells All of the column headers.
 */
const clearSortClasses = function clearClassesFromAllHeaders(headerCells) {
  for (let i = 0; i < headerCells.length; i += 1) {
    const headerCell = headerCells[i];
    const sorter = headerCell.getElementsByClassName('sorter')[0];
    if (sorter) {
      sorter.classList.remove('asc');
      sorter.classList.remove('desc');
    }
  }
};

/**
 * Add a click listener to a column header to trigger a sort.
 *
 * @param {HTMLElement} headerCell A column header to sort by.
 * @param {HTMLCollection} headerCells All of the column headers.
 * @param {HTMLElement} eloTable - The Elo table.
 */
const sortListener = function eloTableSingleColumnSortListener(headerCell, headerCells, eloTable) {
  const columnClass = headerCell.classList[0];
  
  const sorter = headerCell.getElementsByClassName('sorter')[0];

  headerCell.addEventListener('click', () => {
    if (sorter.classList.contains('desc')) {
      sorter.classList.remove('desc');
      sorter.classList.add('asc');
      sortTable(eloTable, columnClass, true);
    } else if (sorter.classList.contains('asc')) {
      sorter.classList.remove('asc');
      sorter.classList.add('desc');
      sortTable(eloTable, columnClass, false);
    } else {
      clearSortClasses(headerCells);
      sorter.classList.add('desc');
      sortTable(eloTable, columnClass, false);
    }
  });
};

/**
 * Add listeners to all column headers.
 */
const sortListeners = function eloTableSortListener() {
  const eloTable = document.getElementsByClassName('elo-table')[0];
  const eloHeaderCells = eloTable.getElementsByTagName('th');

  for (let i = 0; i < eloHeaderCells.length; i += 1) {
    const eloHeaderCell = eloHeaderCells[i];
    sortListener(eloHeaderCell, eloHeaderCells, eloTable);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Listen for elo expand button clicks
  clickListener();

  // Listen for sort clicks
  sortListeners();
});
