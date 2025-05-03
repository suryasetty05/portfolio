import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h3');

const numProjects = projects.length;
const projectsTitle = document.querySelector('h1')
projectsTitle.textContent = `${numProjects} Projects!`


// find data
function renderPieChart(projects) {
    let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year,
    );
    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    // create a pie chart
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let sliceGenerator = d3.pie().value((d) => d.value);
    let total = 0;

    for (let d of data) {
    total += d.value;
    }
    let angle = 0;
    let arcData = [];

    for (let d of data) {
    let endAngle = angle + (d.value / total) * 2 * Math.PI;
    arcData.push({ startAngle: angle, endAngle });
    angle = endAngle;
    }
    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();
    let arcs = arcData.map((d) => arcGenerator(d));
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    arcs.forEach((arc, idx) => {
        d3.select('svg').append('path').attr('d', arc).attr('fill', colors(idx))
    });

    let legend = d3.select('.legend');
    legend.selectAll('li').remove();
    data.forEach((d, idx) => {
        legend
        .append('li')
        .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    });
    }
renderPieChart(projects);

// Search Field
let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('change', (event) => {
  // update query value
  query = event.target.value;
  // filter the projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  // render updated projects!
  renderProjects(filteredProjects, projectsContainer, 'h3');
  renderInteractivePieChart(filteredProjects);
});

// TODO 5.2 of lab
// let selectedIndex = -1; // no index
// let svg = d3.select('svg');
// svg.selectAll('path').remove();
// arcs.forEach((arc, i) => {
//   svg
//     .append('path')
//     .attr('d', arc)
//     .attr('fill', colors(i))
//     .attr('data-index', i)
//     .on('click', function () {
//         selectedIndex = selectedIndex === i ? -1 : i;

//         svg
//         .selectAll('path')
//         .attr('class', (_, idx) => (
//         // TODO: filter idx to find correct pie slice and apply CSS from above
//           (idx === selectedIndex ? 'selected': '')
//         ));
//     }); 
// });

let selectedIndex = -1; // no index
let svg = d3.select('svg');

function renderInteractivePieChart(projects) {
    let rolledData = d3.rollups(
        projects,
        (v) => v.length,
        (d) => d.year,
    );
    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let sliceGenerator = d3.pie().value((d) => d.value);
    let total = 0;

    for (let d of data) {
        total += d.value;
    }
    let angle = 0;
    let arcData = [];

    for (let d of data) {
        let endAngle = angle + (d.value / total) * 2 * Math.PI;
        arcData.push({ startAngle: angle, endAngle });
        angle = endAngle;
    }

    let arcs = arcData.map((d) => arcGenerator(d));
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let legend = d3.select('.legend');
    legend.selectAll('li').remove();
    data.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .attr('class', (_, idx) => (
                idx === selectedIndex ? 'selected' : '',
                idx === selectedIndex ? console.log('selected added to li') : ''
            )); // add class to legend items based on selected index
    });
    svg.selectAll('path').remove();
    arcs.forEach((arc, i) => {
        svg
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .attr('data-index', i)
            .on('click', function () {
                selectedIndex = selectedIndex === i ? -1 : i;

                svg
                    .selectAll('path')
                    .attr('class', (_, idx) => (
                        idx === selectedIndex ? 'selected' : ''
                    ));
                legend.selectAll('li')
                  .classed('selected', (_, idx) => idx === selectedIndex);

                  if (selectedIndex === -1) {
                    renderProjects(projects, projectsContainer, 'h3');
                  } else {
                    // TODO: filter projects and project them onto webpage
                    // Hint: `.label` might be useful
                  }
                let filteredProjects = projects.filter((project) => {
                  return project.year === data[selectedIndex].label;
                });
                renderProjects(filteredProjects, projectsContainer, 'h3');
                });
  });
}

// Call the updated function
renderInteractivePieChart(projects);