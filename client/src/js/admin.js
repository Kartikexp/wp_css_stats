/* global css_stats */
import Parker from 'parker/lib/Parker';
import metrics from 'parker/metrics/All';
import fetch from 'isomorphic-fetch';
import '../scss/admin.scss';

// setup parker
const parker = new Parker(metrics);
// get elements
const dataTable = document.querySelector('.css-stats-output');
const tableRows = Array.from(document.getElementsByClassName('css-stats-output__row'));
const refreshBtn = document.querySelector('.css-stats-header__refresh');
const refreshClass = 'css-stats-header__refresh--loading';
const input = document.querySelector('.css-stats-header__filepath');
// set input as default path from wp_options
input.value = css_stats.defaultFilepath;
// check to see if row is already created for stat
const hasData = (rows, stat) => rows.some(row => row.dataset.stat === stat);
// create row for stats generated by parker
const createRow = (metric, data) => {
  const row = document.createElement('div');
  const metricEl = document.createElement('div');
  const dataEl = document.createElement('div');
  metricEl.innerHTML = metric;
  dataEl.innerHTML = data;
  row.classList.add('css-stats-output__row');
  row.setAttribute('data-stat', metric);
  row.appendChild(metricEl);
  row.appendChild(dataEl);
  return row;
};
// Build out stats table. Checks if table exists first.
// If it exists then we can just update the stat number.
const buildTable = (table, data) => {
  Object.keys(data).forEach((stat) => {
    if (hasData(tableRows, stat)) {
      const updateRow = tableRows.find(row => row.dataset.stat === stat);
      updateRow.lastElementChild.innerHTML = data[stat];
    } else {
      const row = createRow(stat, data[stat]);
      table.appendChild(row);
    }
  });
  return data;
};
// async call to fetch contents of css files return from php glob function
// runs the result through parker and build table with that data
async function fetchCss(options) {
  const data = await Promise.all(
    options.files.map(async (file) => {
      const fileUrl = file.substr(options.path.length);
      const response = await fetch(options.url + fileUrl);
      const cssData = await response.text();
      return cssData;
    }),
  );
  const stats = parker.run(data.join(' '));
  buildTable(dataTable, stats);
  return data;
}
// run fetch on page load
fetchCss(css_stats);
// update stats on buttom press
refreshBtn.addEventListener('click', () => {
  refreshBtn.classList.add(refreshClass);
  const filepath = input.value;
  const xhr = new XMLHttpRequest();

  xhr.open('POST', css_stats.ajaxurl);
  xhr.onload = () => {
    if (xhr.status === 200) {
      refreshBtn.classList.remove(refreshClass);
      const glob = JSON.parse(xhr.responseText);
      console.log(glob);
    } else if (xhr.status !== 200) {
      console.error(`Request failed.  Returned status of ${xhr.status}`);
    }
  };
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(
    JSON.stringify({
      action: css_stats.action,
      nonce: css_stats.nonce,
      filepath,
    }),
  );
});
