import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row, 
        line: +row.line,
        depth: +row.depth,
        length: +row.length,
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
}));
    return data;
}

/* Commit Information */

function processCommits(data) {
    return d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0]; 
            let {author, date, time, timezone, datetime} = first;
            let ret = {
                id: commit,
                url: 'https://github.com/suryasetty05/portfolio/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime, 
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                configurable: false,
                enumerable: true,
                writable: false
            });

            return ret;
        });
    
}

function renderCommitInfo(data, commits) {

    // create d1 element
    const d1 = d3
        .select('#stats')
        .append('dl')
        .attr('class', 'stats');

    // add total LOC
    let wrapper = d1.append('div');
    wrapper.append('dt')
        .html('Total <abbr title="Lines of Code">LOC</abbr>');
    wrapper.append('dd')
        .text(data.length);

    // add total commits
    wrapper = d1.append('div');
    wrapper.append('dt')
        .text('Total Commits');
    wrapper.append('dd')
        .text(commits.length);

    // add number of files
    wrapper = d1.append('div');
    wrapper.append('dt')
        .text('Number of Files');
    wrapper.append('dd')
        .text(d3
            .groups(data, (d) => d.file)
            .length);
            
    // add average line length
    wrapper = d1.append('div');
    wrapper.append('dt')
        .text('Average Line Length');
    wrapper.append('dd')
        .text(d3
            .mean(data, (d) => d.length)
            .toFixed(2));

    // add longest line length
    wrapper = d1.append('div');
    wrapper.append('dt')
        .text('Longest Line Length');
    wrapper.append('dd')
        .text(d3
            .max(data, (d) => d.length));

    // add most active day of week
    wrapper = d1.append('div');
    wrapper.append('dt')
        .text('Most Active Day');
    wrapper.append('dd')
        .text(d3
            .groups(data, (d) => d3.timeFormat('%A')(d.datetime))
            .sort((a, b) => b[1].length - a[1].length)[0][0]);
}

let xScale;
let yScale;

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');
    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();
    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([height, 0])
    

    /* Add Axes */
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    }
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);
    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .attr('class', 'x-axis')
        .call(xAxis);
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis')
        .call(yAxis);

    const dots = svg.append('g').attr('class', 'dots');
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 40]);
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    createBrushSelector(svg);
    svg.call(d3.brush().on('start brush end', brushed));

    dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale (d.totalLines))
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
        updateTooltipVisibility(false);
    });

    }
/* Tooltip */
function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');
  
    if (Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
    time.textContent = commit.time;
    author.textContent = commit.author;
    lines.textContent = commit.lines.length;
  }

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
    }

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX + 5}px`;
    tooltip.style.top = `${event.clientY + 5}px`;
    }
function createBrushSelector(svg) {
    svg.call(d3.brush());
    svg.selectAll('.dots, .overlay ~ *').raise().raise();
}
function brushed(event){
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
        isCommitSelected(selection, d),
      );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
    }
function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }
  // TODO: return true if commit is within brushSelection
  // and false if not
  const [x0, x1] = selection.map((d) => d[0]);
  const [y0, y1] = selection.map((d) => d[1]);
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}
function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type,
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
            <div class="language">
              <dt class=${language}>${language.toUpperCase()}</dt>
              <dd>${count} lines (${formatted})</dd>
              </div>
          `;
    }
  }
/* Main */
let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
