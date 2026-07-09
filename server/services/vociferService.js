const axios = require('axios');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

class VociferService {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.baseURL = 'http://127.0.0.1:6060';
    
    const jar = new tough.CookieJar();
    this.client = wrapper(axios.create({
      baseURL: this.baseURL,
      jar,
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }));
  }

  async initSession() {
    try {
      // 1. Get initial cookies and CSRF token by hitting the login page
      const initRes = await this.client.get('/login');
      
      const cookies = await this.client.defaults.jar.getCookies(this.baseURL);
      const xsrfCookie = cookies.find(c => c.key === 'XSRF-TOKEN');
      
      if (xsrfCookie) {
        this.client.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(xsrfCookie.value);
      }

      // Also grab the _token from the HTML form if it's there
      let csrfToken = '';
      const match = initRes.data.match(/name="_token" value="([^"]+)"/);
      if (match) csrfToken = match[1];

      // 2. Login
      const loginRes = await this.client.post('/login', {
        email: this.email,
        password: this.password,
        _token: csrfToken // Provide the form token just in case
      }, {
        // Axios automatically follows redirects. If login fails, Laravel redirects back to /login.
        // If it succeeds, it usually redirects to / (or home). We can check the final URL.
      });

      // Check if we are still on the login page after the redirect
      if (loginRes.request && loginRes.request.res && loginRes.request.res.responseUrl) {
        if (loginRes.request.res.responseUrl.endsWith('/login')) {
          console.error('Vocifer login failed: Redirected back to login page (Invalid credentials or CSRF error).');
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('Vocifer login failed:', err.message);
      return false;
    }
  }

  async getAuthUser() {
    try {
      const employees = await this.getEmployees();
      let user = employees.find(e => e.email === this.email);
      
      // Fallback to matching by name if email isn't there, or just pick the first one
      if (!user && employees.length > 0) {
        user = employees[0];
      }
      return user || null;
    } catch (err) {
      console.error('Failed to get auth user:', err.message);
      return null;
    }
  }

  async getFirstProject() {
    try {
      const res = await this.client.get('/project');
      const projects = res.data?.data || res.data;
      if (Array.isArray(projects) && projects.length > 0) {
        return projects[0];
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch projects:', err.message);
      return null;
    }
  }

  async getEmployees() {
    try {
      const res = await this.client.get('/employee');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    } catch (err) {
      console.error('Failed to fetch employees from Vocifer:', err.message);
      return [];
    }
  }

  async createDevTask(title, description, priority, developerObj, testerObj) {
    try {
      const user = await this.getAuthUser();
      const project = await this.getFirstProject();
      
      if (!user) throw new Error('Could not get authenticated user from Vocifer');
      if (!project) throw new Error('No projects available in Vocifer');

      const userObj = { id: user.empid || user.id, name: user.name };
      const dev = developerObj && (developerObj.empid || developerObj.id) ? { id: developerObj.empid || developerObj.id, name: developerObj.name } : userObj;
      const tst = testerObj && (testerObj.empid || testerObj.id) ? { id: testerObj.empid || testerObj.id, name: testerObj.name } : userObj;

      const payload = {
        task: title,
        description: description || '',
        priority: priority === 'urgent' ? 1 : priority === 'high' ? 2 : priority === 'medium' ? 3 : 4,
        designer: dev,
        developer: dev,
        tester: tst,
        code_reviewer: dev,
        project: { pjid: project.pjid || project.id },
        attachment_details: []
      };

      const res = await this.client.post('/devTask', payload);
      return res.data?.data || res.data;
    } catch (err) {
      console.error('Vocifer create task failed:', err.response?.data || err.message);
      return null;
    }
  }

  async updateTaskTime(tkid, minutes) {
    try {
      const getRes = await this.client.get(`/devTask/${tkid}/edit`);
      const existingTask = getRes.data;
      if (!existingTask) return false;

      const payload = {
        changeType: 'Stage',
        stageValue: 'Done',
        stageId: 4,
        position: existingTask.position,
        stage: existingTask.stage
      };

      await this.client.put(`/taskStatusChange/${tkid}`, payload);
      return true;
    } catch (err) {
      console.error('Vocifer update task failed:', err.response?.data || err.message);
      return false;
    }
  }
}

module.exports = VociferService;
