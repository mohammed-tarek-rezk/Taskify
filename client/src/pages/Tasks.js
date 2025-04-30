import React, { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon as XMarkIconSolid,
  FunnelIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  });
  const [projects, setProjects] = useState([]);
  const [showProjectTasks, setShowProjectTasks] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    project: '',
    assignedTo: '',
    createdBy: '',
    startDate: '',
    endDate: '',
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(`http://localhost:5000/api/tasks?${queryParams.toString()}`);
      setTasks(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects');
      setProjects(response.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchTeamMembers = async (projectId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/projects/${projectId}`);
      const project = response.data;
      
      // Get team members from the project
      const teamResponse = await axios.get(`http://localhost:5000/api/teams/${project.team._id}`);
      setTeamMembers(teamResponse.data.members);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    setNewTask(prev => ({
      ...prev,
      project: projectId || null,
      assignedTo: '' // Reset assignedTo when project changes
    }));

    if (projectId) {
      await fetchTeamMembers(projectId);
    } else {
      setTeamMembers([]);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...newTask,
        project: newTask.project || null,
        assignedTo: newTask.project ? newTask.assignedTo : null, // Only include assignedTo if it's a project task
        status: 'todo'
      };

      const response = await axios.post('http://localhost:5000/api/tasks', taskData);
      setTasks([...tasks, response.data]);
      setIsTaskModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        project: '',
        priority: 'medium',
        dueDate: '',
        assignedTo: '',
      });
      setTeamMembers([]);
      setError('');
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSortChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      project: '',
      assignedTo: '',
      createdBy: '',
      startDate: '',
      endDate: '',
      sortBy: 'dueDate',
      sortOrder: 'asc'
    });
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskToDelete._id}`);
      setTasks(tasks.filter(task => task._id !== taskToDelete._id));
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      setError('');
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 mt-10 left-4 z-50 p-2 rounded-md bg-white shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {isSidebarOpen ? (
          <XMarkIconSolid className="h-6 w-6 text-gray-600" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <FunnelIcon className="h-5 w-5 text-gray-500" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Search tasks..."
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  id="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  name="priority"
                  id="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700">Project</label>
                <select
                  name="project"
                  id="project"
                  value={filters.project}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Sort By</label>
                <select
                  name="sortBy"
                  id="sortBy"
                  value={filters.sortBy}
                  onChange={handleSortChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="title">Title</option>
                </select>
              </div>
              <div>
                <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">Sort Order</label>
                <select
                  name="sortOrder"
                  id="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleSortChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="mt-1 text-sm text-gray-500">
                {showProjectTasks ? 'View and manage your project tasks' : 'View and manage your personal tasks'}
              </p>
            </div>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Task
            </button>
          </div>

          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setShowProjectTasks(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  showProjectTasks
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Project Tasks
              </button>
              <button
                onClick={() => setShowProjectTasks(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  !showProjectTasks
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Personal Tasks
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-8">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {tasks
                .filter(task => {
                  if (showProjectTasks) {
                    return task.project !== null;
                  } else {
                    return task.project === null;
                  }
                })
                .map((task) => (
                  <li key={task._id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <Link
                              to={`/tasks/${task._id}`}
                              className="text-sm font-medium text-primary-600 hover:text-primary-500"
                            >
                              {task.title}
                            </Link>
                            <p className="text-sm text-gray-500">{task.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {task.project ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {task.project.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Personal
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'review' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteClick(task);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              {tasks.filter(task => showProjectTasks ? task.project !== null : task.project === null).length === 0 && (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  {showProjectTasks ? 'No project tasks found' : 'No personal tasks found'}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <Transition.Root show={isTaskModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={setIsTaskModalOpen}
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Create New Task
                    </Dialog.Title>
                    <div className="mt-2">
                      <form onSubmit={handleCreateTask} className="space-y-4">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            placeholder="Enter task title"
                          />
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            name="description"
                            id="description"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            placeholder="Enter task description"
                          />
                        </div>

                        <div>
                          <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                            Project (Optional)
                          </label>
                          <select
                            name="project"
                            id="project"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            value={newTask.project || ''}
                            onChange={handleProjectChange}
                          >
                            <option value="">No Project (Personal Task)</option>
                            {projects.map((project) => (
                              <option key={project._id} value={project._id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-sm text-gray-500">
                            Leave empty to create a personal task
                          </p>
                        </div>

                        {newTask.project && (
                          <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                              Assign To
                            </label>
                            <select
                              name="assignedTo"
                              id="assignedTo"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              value={newTask.assignedTo}
                              onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                            >
                              <option value="">Select a team member</option>
                              {teamMembers.map((member) => (
                                <option key={member._id} value={member._id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                            Priority
                          </label>
                          <select
                            id="priority"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                            Due Date
                          </label>
                          <input
                            type="date"
                            id="dueDate"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          />
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm"
                    onClick={handleCreateTask}
                  >
                    Create Task
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setIsTaskModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Delete Confirmation Modal */}
      <Transition.Root show={isDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Delete Task
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this task? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDeleteTask}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}

export default Tasks; 