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

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');
    const xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();
    const yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([height, 0])

    const dots = svg.append('g').attr('class', 'dots');
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 40]);
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

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

/* Main */
let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
document.getElementById('#commit-tooltip').opacity = 0;
