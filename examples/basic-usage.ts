import { Configuration, ProjectsApi, CreateProjectRequest } from '..';

// Configure the API client
const configuration = new Configuration({
  basePath: 'https://api.rankvectors.com',
  apiKey: 'YOUR_API_KEY', // Replace with your actual API key
});

// Create API instance
const projectsApi = new ProjectsApi(configuration);

async function createProject() {
  try {
    const projectData: CreateProjectRequest = {
      name: 'My Website',
      domain: 'https://example.com',
      prompt: 'Only crawl blog posts and documentation'
    };

  const project = await projectsApi.createProject({ createProjectRequest: projectData });
  console.log('Project created:', project);
  // List projects
  const projects = await projectsApi.listProjects();
  console.log('Your projects:', projects.map(p => ({ id: p.id, name: p.name })));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createProject();
