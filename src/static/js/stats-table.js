/**
 * Stats table functionality.
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
 * Sort the Stats table by the given column.
 *
 * @param {HTMLElement} statsTable - The Stats table to sort.
 * @param {string} columnClass - The class of the column to sort by.
 * @param {boolean} isAscending - Whether to scort ascending or descending.
 */
const sortTable = function sortStatsTable(statsTable, columnClass, isAscending) {
  const tbody = statsTable.getElementsByTagName('tbody')[0];
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
 * Remove the sorting classes from all column headers.
 *
 * @param {HTMLCollection} headerCells All of the column headers.
 */
const clearSortClasses = function clearClassesFromAllHeaders(headerCells) {
  for (let i = 0; i < headerCells.length; i += 1) {
    const headerCell = headerCells[i];
    headerCell.classList.remove('asc');
    headerCell.classList.remove('desc');
  }
};

/**
 * Add a click listener to a column header to trigger a sort.
 *
 * @param {HTMLElement} headerCell A column header to sort by.
 * @param {HTMLCollection} headerCells All of the column headers.
 * @param {HTMLElement} statsTable - The Stats table.
 */
const sortListener = function statsTableSingleColSortListener(headerCell, headerCells, statsTable) {
  const columnClass = headerCell.classList[0];

  headerCell.addEventListener('click', () => {
    if (headerCell.classList.contains('desc')) {
      headerCell.classList.remove('desc');
      headerCell.classList.add('asc');
      sortTable(statsTable, columnClass, true);
    } else if (headerCell.classList.contains('asc')) {
      headerCell.classList.remove('asc');
      headerCell.classList.add('desc');
      sortTable(statsTable, columnClass, false);
    } else {
      clearSortClasses(headerCells);
      headerCell.classList.add('asc');
      sortTable(statsTable, columnClass, true);
    }
  });
};

/**
 * Add listeners to all column headers.
 */
const sortListeners = function statsTableSortListener(statsTable) {
  const statsHeaderCells = statsTable.getElementsByTagName('th');

  for (let i = 0; i < statsHeaderCells.length; i += 1) {
    const statsHeaderCell = statsHeaderCells[i];
    sortListener(statsHeaderCell, statsHeaderCells, statsTable);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const statsTable = document.getElementsByClassName('stats-table')[0];

  // Listen for sort clicks
  sortListeners(statsTable);

  // Sort by name by default
  document.querySelector('th.team-name').classList.add('desc');
  sortTable(statsTable, 'team-name', false);
});
