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
  // TODO: filter the projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  // TODO: render updated projects!
  renderProjects(filteredProjects, projectsContainer, 'h3');
  renderPieChart(filteredProjects);
});