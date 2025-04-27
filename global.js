console.log("IT'S ALIVE");

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact'},
    { url: 'cv/', title: 'Resume'},
  ];    

let nav = document.createElement('nav');
document.body.prepend(nav);


// Define the base path based on the environment
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    
    // Only prepend BASE_PATH for relative URLs that don't already include it
    if (!url.startsWith('http') && !url.startsWith(BASE_PATH)) {
        url = BASE_PATH + url;
    }
    
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    
    // Create full paths for comparison
    const fullPath = new URL(a.href).pathname;
    const currentPath = location.pathname;
    
    // Check if this is the current page
    if (fullPath === currentPath || 
        (currentPath.endsWith('/') && fullPath === currentPath + "index.html") ||
        (fullPath.endsWith('/') && currentPath === fullPath + "index.html")) {
        a.classList.add('current');
    }
    
    nav.append(a);
}

nav.insertAdjacentHTML('beforeend', `<a href=https://github.com/suryasetty05 target = "_blank"> Github </a>`)

document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
        Theme:
        <select id="theme-selector">
          <option value="light dark">Automatic</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    `
  );
  const selector = document.getElementById('theme-selector');
  if (localStorage.getItem('colorScheme')) {
    document.documentElement.style.colorScheme = localStorage.getItem('colorScheme');
    selector.value = localStorage.getItem('colorScheme');
  }
  selector.addEventListener('change', function() {
    document.documentElement.style.colorScheme = selector.value;
    localStorage.colorScheme =  selector.value;
    console.log('color scheme changed to', selector.value);
  });

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    console.log(response);
    const data = await response.json();
  return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';

  project.forEach(project => {
    const article = document.createElement('article');
    article.innerHTML = `
    <${headingLevel}>${project.title}</${headingLevel}>
    <img src="${project.image}" alt="${project.title}">
    <p>${project.description}</p>
    `;
    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

export const githubData = await fetchGitHubData('suryasetty05');
