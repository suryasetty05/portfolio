import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

export async function loadData() {
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

export function processCommits(data) {
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

export function renderCommitInfo(data, commits) {
    d3.select('#stats')
        .html('');

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
    .data(sortedCommits, (d) => d.id)
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



function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // CHANGE: we should clear out the existing xAxis and then create a new one.
  const xAxisGroup = svg.select('g.x-axis').remove();
  xAxisGroup.call(xAxis);
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')
    .call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

function updateFileDisplay(filteredCommits){
    let lines = filteredCommits.flatMap((d) => d.lines);
    let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
        return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);

    let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
        // This code only runs when the div is initially rendered
        (enter) =>
        enter.append('div').call((div) => {
            div.append('dt').append('code');
            div.append('dd');
        }),
    );
    // This code updates the div info
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    filesContainer.select('dt > code').text((d) => d.name);
    filesContainer
        .select('dd')
        .selectAll('div')
        .data((d) => d.lines)
        .join('div')
        .attr('class', 'loc')
        .attr('style', (d) => `--color: ${colors(d.type)}`);

}


/* Main */
let data = await loadData();
let commits = processCommits(data);
let filteredCommits = commits.sort((a, b) => a.datetime - b.datetime);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

// after initializing filteredCommits
updateFileDisplay(filteredCommits);

d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		I looked over all I had made, and I saw that it was very cool.
	`,
  );
function onStepEnter(response) {
  let timeVal = response.element.__data__.datetime;
  let filteredCommits = commits.filter((d) => d.datetime <= timeVal)
    .sort((a, b) => a.datetime - b.datetime);
  updateScatterPlot(data, filteredCommits);
  let filteredData = data.filter((d) => d.datetime <= timeVal)
    .sort((a, b) => a.datetime - b.datetime);
  renderCommitInfo(filteredData, filteredCommits);

}

const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);


// let commitProgress = 100;
// let timeScale = d3
//   .scaleTime()
//   .domain([
//     d3.min(commits, (d) => d.datetime),
//     d3.max(commits, (d) => d.datetime),
//   ])
//   .range([0, 100]);

// let commitMaxTime = timeScale.invert(commitProgress);
// const timeElement = document.getElementById('commit-time-bar');
// timeElement.textContent = commitMaxTime.toLocaleString();

// const slider = document.getElementById('commit-progress');
// slider.value = commitProgress;

// slider.addEventListener('input', onTimeSliderChange)
// function onTimeSliderChange() {
//     // 1. Update commitProgress to slider value
//   commitProgress = +this.value;
  
//   // 2. Update commitMaxTime using timeScale.invert()
//   commitMaxTime = timeScale.invert(commitProgress);
  
//   // 3. Update the <time> element display
//   timeElement.textContent = commitMaxTime.toLocaleString();
//   filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
//   updateScatterPlot(data, filteredCommits);
//   updateFileDisplay(filteredCommits)

// }
