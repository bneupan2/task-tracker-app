const express = require('express');
require('dotenv').config();
const session = require('express-session');
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const methodOverride = require('method-override');
const { User, sequelize } = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const app = express();
const PORT = 3000;

app.engine('handlebars', exphbs.engine({
  handlebars: allowInsecurePrototypeAccess(Handlebars)
}));

app.set('view engine', 'handlebars');


app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,  
  cookie: {
    secure: false,           
    maxAge: 1000 * 60 * 60   
  }
}))

app.use((req, res, next) => {
  res.locals.message = req.session.message || null;
  delete req.session.message;
  next();
});


function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next(); 
}


// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/signup', (req, res) => {
    res.render('signup');
  });  

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      if (password.length < 8) {
        return res.render('signup', { error: 'Password must be at least 8 characters long.' });
      }
  
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.render('signup', { error: 'This email is already registered.' });
      }
  
      await User.create({ name, email, password });
      res.redirect('/login');
    } catch (err) {
      console.error(err);
      res.send('Signup failed. Something went wrong.');
    }
  });
  
  

app.get('/login', (req, res) => {
    res.render('login', {
      query: req.query
    });
  });
  

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ where: { email } });
  
      if (user && user.password === password) {
        req.session.userId = user.id;  
        console.log('SESSION USER ID SET:', req.session.userId);
        res.redirect('/dashboard'); 
      } else {
        res.render('login', { error: 'Invalid email or password' });
      }
    } catch (err) {
      console.error(err);
      res.render('login', { error: 'Something went wrong' });
    }
  });

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/login?loggedout=true');
    });
  });
  
  
  
app.get('/dashboard', requireLogin, async (req, res) => {
  console.log('Dashboard Session:', req.session); 
  
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');
  
    const projects = await Project.findAll({
      where: { UserId: userId },
      raw: true
    });
  
    res.render('dashboard', { projects });
  });
  
  
  
  
app.get('/projects/new', requireLogin, (req, res) => {
    res.render('create-project');
  });

app.post('/projects', async (req, res) => {
  const { title, dueDate, description, tasks } = req.body;

  try {
    const userId = req.session.userId; 

    if (!userId) {
      return res.redirect('/login'); 
    }

    const project = await Project.create({
      title,
      dueDate,
      description,
      UserId: userId  
    });

    if (Array.isArray(tasks)) {
      for (let taskTitle of tasks) {
        if (taskTitle.trim() !== '') {
          await Task.create({
            title: taskTitle.trim(),
            ProjectId: project.id
          });
        }
      }
    }

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Error saving project and tasks');
  }
});

  
  
app.get('/projects/:id', requireLogin, async (req, res) => {
  try {
    const projectData = await Project.findByPk(req.params.id, {
      include: Task
    });

    if (!projectData) return res.send('Project not found');

    const project = projectData.get({ plain: true });

    // 🔢 Calculate progress
    const totalTasks = project.Tasks.length;
    const completedTasks = project.Tasks.filter(task => task.isDone).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.render('project-details', { project, progress });
  } catch (err) {
    console.error(err);
    res.send('Error loading project details');
  }
});


app.get('/projects/:id/edit', requireLogin, async (req, res) => {
  try {
    const projectData = await Project.findByPk(req.params.id);

    if (!projectData) {
      return res.send('Project not found');
    }

    const project = projectData.get({ plain: true });

    res.render('edit-project', { project });
  } catch (err) {
    console.error(err);
    res.send('Error loading edit page');
  }
});

app.put('/projects/:id', requireLogin, async (req, res) => {
  try {
    const { title, dueDate, description } = req.body;

    await Project.update(
      { title, dueDate, description },
      { where: { id: req.params.id } }
    );

    req.session.message = 'Project updated successfully!';
    res.redirect('/dashboard');

  } catch (err) {
    console.error('Update error:', err);
    res.send('Error updating project');
  }
});

app.delete('/projects/:id', requireLogin, async (req, res) => {
  try {
    await Project.destroy({ where: { id: req.params.id } });
    req.session.message = 'Project deleted successfully!';
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Delete error:', err);
    res.send('Error deleting project');
  }
});

app.get('/tasks/:id/edit', requireLogin, async (req, res) => {
  try {  
    const taskData = await Task.findByPk(req.params.id);
    if (!taskData) return res.send('Task not found');

    const task = taskData.get({ plain: true });
    res.render('edit-task', { task });
  } catch (err) {
    console.error(err);
    res.send('Error loading task edit page');
  }
});

app.put('/tasks/:id', requireLogin, async (req, res) => {
  try {
    const { title } = req.body;

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.send('Task not found');

    await task.update({ title });
    req.session.message = ' Task updated successfully!';
    res.redirect(`/projects/${task.ProjectId}`);
  } catch (err) {
    console.error(err);
    res.send('Error updating task');
  }
});

app.delete('/tasks/:id', requireLogin, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) return res.send('Task not found');

    const projectId = task.ProjectId;
    await task.destroy();

    req.session.message = 'Task deleted successfully!';
    res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error('Task delete error:', err);
    res.send('Error deleting task');
  }
});

app.post('/tasks/:id/toggle', requireLogin, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) return res.send('Task not found');

    await task.update({ isDone: !task.isDone });

    res.redirect(`/projects/${task.ProjectId}`);
  } catch (err) {
    console.error('Toggle error:', err);
    res.send('Error toggling task status');
  }
});

app.post('/projects/:id/tasks', requireLogin, async (req, res) => {
  try {
    const { title } = req.body;
    const projectId = req.params.id;

    await Task.create({
      title,
      ProjectId: projectId
    });

    req.session.message = 'New task added successfully!';
    res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error('Task creation error:', err);
    res.send('Error adding task');
  }
});





sequelize.sync()  
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('Sync error:', err));
    
  
  
