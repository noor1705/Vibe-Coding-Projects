(() => {
  const { useState, useMemo, useEffect } = React;
  const e = React.createElement;

  const FILTERS = {
    all: 'All',
    active: 'Pending',
    completed: 'Completed',
  };

  function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all');

    const filteredTasks = useMemo(() => {
      if (filter === 'active') {
        return tasks.filter((t) => !t.completed);
      }
      if (filter === 'completed') {
        return tasks.filter((t) => t.completed);
      }
      return tasks;
    }, [tasks, filter]);

    const summary = useMemo(() => {
      const total = tasks.length;
      const completed = tasks.filter((t) => t.completed).length;
      const remaining = total - completed;

      if (total === 0) return '';

      return `${total} task${total === 1 ? '' : 's'} • ${remaining} pending • ${completed} completed`;
    }, [tasks]);

    function addTask(title, notes) {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      setTasks((prev) => [
        {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          title: trimmedTitle,
          notes: notes.trim(),
          completed: false,
        },
        ...prev,
      ]);
    }

    function toggleTask(id) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
    }

    function deleteTask(id) {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    }

    return {
      tasks,
      filter,
      filteredTasks,
      summary,
      hasTasks: tasks.length > 0,
      setFilter,
      addTask,
      toggleTask,
      deleteTask,
    };
  }

  function ThemeToggle({ theme, onToggle }) {
    const isLight = theme === 'light';
    const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    const text = isLight ? 'Light mode' : 'Dark mode';

    return e(
      'button',
      {
        type: 'button',
        className: 'theme-toggle-btn',
        onClick: onToggle,
        'aria-pressed': isLight ? 'true' : 'false',
        'aria-label': label,
      },
      e(
        'span',
        { 'aria-hidden': 'true' },
        isLight
          ? e(
              'svg',
              { viewBox: '0 0 24 24' },
              e('path', {
                d: 'M12 3.75a8.25 8.25 0 1 0 8.25 8.25A8.26 8.26 0 0 0 12 3.75Zm0 13.5a5.25 5.25 0 1 1 5.25-5.25A5.25 5.25 0 0 1 12 17.25Z',
                fill: 'currentColor',
              })
            )
          : e(
              'svg',
              { viewBox: '0 0 24 24' },
              e('path', {
                d: 'M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z',
                fill: 'currentColor',
              })
            )
      ),
      e('span', null, text)
    );
  }

  function Header({ theme, onToggleTheme }) {
    return e(
      'header',
      { className: 'app-header' },
      e(
        'div',
        { className: 'container header-inner' },
        e(
          'div',
          { className: 'header-title-group' },
          e('h1', null, 'Task Manager'),
          e(
            'p',
            { className: 'tagline' },
            'Organize your day with a clean, simple task list.'
          )
        ),
        e(ThemeToggle, { theme, onToggle: onToggleTheme })
      )
    );
  }

  function TaskForm({ onAdd }) {
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');

    function handleSubmit(event) {
      event.preventDefault();
      if (!title.trim()) return;
      onAdd(title, notes);
      setTitle('');
      setNotes('');
    }

    return e(
      'section',
      { className: 'card', 'aria-labelledby': 'task-form-heading' },
      e(
        'div',
        { className: 'card-header' },
        e('h2', { id: 'task-form-heading' }, 'Add a new task')
      ),
      e(
        'form',
        { className: 'task-form', onSubmit: handleSubmit },
        e(
          'div',
          { className: 'field-group' },
          e(
            'label',
            { htmlFor: 'task-title' },
            'Task title',
            e('span', { className: 'sr-only' }, ' (required)')
          ),
          e('input', {
            id: 'task-title',
            name: 'task-title',
            type: 'text',
            autoComplete: 'off',
            required: true,
            maxLength: 120,
            placeholder: 'e.g. Prepare project report',
            value: title,
            onChange: (eEvt) => setTitle(eEvt.target.value),
          })
        ),
        e(
          'div',
          { className: 'field-group' },
          e('label', { htmlFor: 'task-notes' }, 'Notes (optional)'),
          e('textarea', {
            id: 'task-notes',
            name: 'task-notes',
            rows: 2,
            maxLength: 300,
            placeholder: 'Add more details if needed',
            value: notes,
            onChange: (eEvt) => setNotes(eEvt.target.value),
          })
        ),
        e(
          'div',
          { className: 'form-actions' },
          e(
            'button',
            { type: 'submit', className: 'btn primary' },
            'Add task'
          )
        )
      )
    );
  }

  function Filters({ activeFilter, onChange }) {
    const buttons = Object.entries(FILTERS).map(([value, label]) => {
      const isActive = value === activeFilter;
      const className = `chip${isActive ? ' chip--active' : ''}`;
      return e(
        'button',
        {
          key: value,
          type: 'button',
          className,
          'data-filter': value,
          'aria-pressed': isActive ? 'true' : 'false',
          onClick: () => onChange(value),
        },
        label
      );
    });

    return e(
      'div',
      { className: 'filters', 'aria-label': 'Task filters' },
      ...buttons
    );
  }

  function TaskItem({ task, onToggle, onDelete }) {
    const toggleLabel = task.completed
      ? 'Mark task as pending'
      : 'Mark task as completed';

    return e(
      'li',
      {
        className: `task-item task-enter${task.completed ? ' task-completed' : ''}`,
      },
      e(
        'button',
        {
          type: 'button',
          className: 'task-toggle',
          'aria-pressed': task.completed ? 'true' : 'false',
          'aria-label': toggleLabel,
          onClick: () => onToggle(task.id),
        },
        e(
          'svg',
          {
            viewBox: '0 0 20 20',
            'aria-hidden': 'true',
            className: 'task-toggle-icon',
          },
          e('path', {
            d: 'M16.707 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3.25-3.25a1 1 0 1 1 1.414-1.414L8.5 11.586l6.543-6.543a1 1 0 0 1 1.414 0z',
            fill: '#0f172a',
          })
        )
      ),
      e(
        'div',
        { className: 'task-main' },
        e('p', { className: 'task-title' }, task.title),
        task.notes
          ? e('p', { className: 'task-notes' }, task.notes)
          : null
      ),
      e(
        'div',
        { className: 'task-meta' },
        e(
          'div',
          { className: 'task-actions' },
          e(
            'button',
            {
              type: 'button',
              className: 'btn danger task-delete-btn',
              'aria-label': `Delete task: ${task.title}`,
              onClick: () => onDelete(task.id),
            },
            'Delete'
          )
        )
      )
    );
  }

  function TaskList({ tasks, hasTasks, summary, filter, onFilterChange, onToggle, onDelete }) {
    return e(
      'section',
      { className: 'card', 'aria-labelledby': 'task-list-heading' },
      e(
        'div',
        { className: 'card-header card-header--row' },
        e(
          'div',
          null,
          e('h2', { id: 'task-list-heading' }, 'Your tasks'),
          e(
            'p',
            {
              className: 'card-subtitle',
              id: 'task-summary',
              'aria-live': 'polite',
            },
            summary
          )
        ),
        e(Filters, { activeFilter: filter, onChange: onFilterChange })
      ),
      e(
        'div',
        { className: 'list-wrapper' },
        e(
          'ul',
          {
            id: 'task-list',
            className: 'task-list',
            role: 'list',
            'aria-live': 'polite',
            'aria-label': 'Task list',
          },
          tasks.map((task) =>
            e(TaskItem, {
              key: task.id,
              task,
              onToggle,
              onDelete,
            })
          )
        ),
        e(
          'p',
          {
            id: 'empty-state',
            className: `empty-state${hasTasks ? ' empty-state--hidden' : ''}`,
          },
          'You have no tasks yet. Add your first task above to get started.'
        )
      )
    );
  }

  function Footer() {
    const [year, setYear] = useState('');

    useEffect(() => {
      setYear(String(new Date().getFullYear()));
    }, []);

    return e(
      'footer',
      { className: 'app-footer' },
      e(
        'div',
        { className: 'container footer-inner' },
        e(
          'p',
          null,
          '© ',
          year,
          ' Task Manager. Built with accessibility and simplicity in mind.'
        )
      )
    );
  }

  function App() {
    const [theme, setTheme] = useState('dark');

    const {
      filteredTasks,
      hasTasks,
      summary,
      filter,
      setFilter,
      addTask,
      toggleTask,
      deleteTask,
    } = useTasks();

    useEffect(() => {
      const prefersLight =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches;
      setTheme(prefersLight ? 'light' : 'dark');
    }, []);

    useEffect(() => {
      const body = document.body;
      if (theme === 'light') {
        body.classList.add('theme-light');
      } else {
        body.classList.remove('theme-light');
      }
    }, [theme]);

    function handleToggleTheme() {
      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    }

    return e(
      React.Fragment,
      null,
      e(Header, { theme, onToggleTheme: handleToggleTheme }),
      e(
        'main',
        { className: 'app-main' },
        e(
          'div',
          { className: 'container' },
          e(TaskForm, { onAdd: addTask }),
          e(TaskList, {
            tasks: filteredTasks,
            hasTasks,
            summary,
            filter,
            onFilterChange: setFilter,
            onToggle: toggleTask,
            onDelete: deleteTask,
          })
        )
      ),
      e(Footer, null)
    );
  }

  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(e(App));
  }
})();

