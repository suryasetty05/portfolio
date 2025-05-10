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
                url: 'https://github.com/YOUR_REPO/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime, 
                hourfrac: datetime.getHours() + datetime.getMinutes() / 60,
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

/* Main */
let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
