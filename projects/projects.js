import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h3');

const numProjects = projects.length;
const projectsTitle = document.querySelector('h1')
projectsTitle.textContent = `${numProjects} Projects!`

// create a pie chart
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let data = [
    { value: 1, label: 'apples' },
    { value: 2, label: 'oranges' },
    { value: 3, label: 'mangos' },
    { value: 4, label: 'pears' },
    { value: 5, label: 'limes' },
    { value: 5, label: 'cherries' },
  ];
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
arcs.forEach((arc, idx) => {
    d3.select('svg').append('path').attr('d', arc).attr('fill', colors(idx))
  });

let legend = d3.select('.legend');
data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
  });