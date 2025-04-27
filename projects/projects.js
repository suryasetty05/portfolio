import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h3');

const numProjects = projects.length;
const projectsTitle = document.querySelector('h1')
projectsTitle.textContent = `${numProjects} Projects!`