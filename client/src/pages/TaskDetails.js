import React, { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  PaperClipIcon,
  PhotoIcon,
  DocumentIcon,
  DocumentTextIcon,
  DocumentPdfIcon,
  PlusIcon,
  UserCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditCommentModalOpen, setIsEditCommentModalOpen] = useState(false);
  const [isDeleteCommentModalOpen, setIsDeleteCommentModalOpen] = useState(false);
  const [isConfirmAssignModalOpen, setIsConfirmAssignModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [deletingComment, setDeletingComment] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    project: '',
    status: '',
    priority: '',
    dueDate: '',
  });
  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [taskFiles, setTaskFiles] = useState([]);
  const [uploadingTaskFiles, setUploadingTaskFiles] = useState(false);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  useEffect(() => {
    fetchTask();
    fetchProjects();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/tasks/${id}`);
      setTask(response.data);
      setEditTask({
        title: response.data.title,
        description: response.data.description,
        project: response.data.project?._id || '',
        status: response.data.status,
        priority: response.data.priority,
        dueDate: response.data.dueDate ? new Date(response.data.dueDate).toISOString().split('T')[0] : '',
      });

      // If task belongs to a project, fetch team members
      if (response.data.project) {
        fetchTeamMembers(response.data.project._id);
      }

      setError('');
    } catch (err) {
      setError('Failed to fetch task details');
      console.error('Error fetching task:', err);
    } finally {
      setLoading(false);
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

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects');
      setProjects(response.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleAssignClick = () => {
    setIsAssignModalOpen(true);
  };

  const handleAssignTask = async () => {
    if (!selectedAssignee) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(
        `http://localhost:5000/api/tasks/${id}/assign`,
        { assignee: selectedAssignee },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setTask(response.data);
      setIsAssignModalOpen(false);
      setIsConfirmAssignModalOpen(false);
      setSelectedAssignee(null);
      setError('');
    } catch (err) {
      console.error('Error assigning task:', err);
      setError('Failed to assign task. Please try again.');
    }
  };

  const handleAssigneeSelect = (assignee) => {
    setSelectedAssignee(assignee);
    setIsConfirmAssignModalOpen(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:5000/api/tasks/${id}`, editTask);
      setTask(response.data);
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTask = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`);
      navigate('/tasks');
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    // Validate file size (10MB limit)
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      setError('Some files were too large. Maximum file size is 10MB.');
    }
    setSelectedFiles(validFiles);
  };

  const uploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No files were uploaded successfully');
      }
      
      return response.data;
    } catch (err) {
      console.error('Error uploading files:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload files';
      throw new Error(errorMessage);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && selectedFiles.length === 0) {
      setError('Please enter a comment or select files to upload');
      return;
    }

    setUploading(true);
    try {
      let attachments = [];
      if (selectedFiles.length > 0) {
        try {
          const uploadedFiles = await uploadFiles(selectedFiles);
          attachments = uploadedFiles.map(file => ({
            name: file.originalname,
            url: file.url,
            type: file.mimetype,
            size: file.size,
          }));
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          setError('Failed to upload files: ' + uploadError.message);
          setUploading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `http://localhost:5000/api/tasks/${id}/comments`,
        {
          text: newComment.trim(),
          attachments,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setTask(response.data);
      setIsCommentModalOpen(false);
      setNewComment('');
      setSelectedFiles([]);
      setError('');
    } catch (err) {
      console.error('Error adding comment:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add comment. Please try again.';
      const errorDetails = err.response?.data?.error || err.message;
      setError(`${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = async (commentId, attachmentIndex) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call the API to remove the attachment
      const response = await axios.delete(
        `http://localhost:5000/api/tasks/${id}/comments/${commentId}/attachments/${attachmentIndex}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update the local state
      setTask(response.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error removing attachment:', err);
      setError('Failed to remove attachment. Please try again.');
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return PhotoIcon;
    } else if (mimeType === 'application/pdf') {
      return DocumentIcon;
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return DocumentTextIcon;
    }
    return DocumentIcon;
  };

  const getFileTypeColor = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return 'text-blue-400';
    } else if (mimeType === 'application/pdf') {
      return 'text-red-400';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'text-green-400';
    }
    return 'text-gray-400';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getServerUrl = (url) => {
    if (!url) return '';
    // If the URL is already a full URL, return it
    if (url.startsWith('http')) return url;
    // Otherwise, prepend the server URL
    return `http://localhost:5000${url}`;
  };

  const renderAttachment = (attachment, comment, index) => {
    const FileIcon = getFileIcon(attachment.type);
    const iconColor = getFileTypeColor(attachment.type);
    const isImage = attachment.type.startsWith('image/');
    const serverUrl = getServerUrl(attachment.url);

    return (
      <div key={index} className="relative group">
        <a
          href={serverUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          {isImage ? (
            <div className="aspect-w-16 aspect-h-9 mb-2">
              <img
                src={serverUrl}
                alt={attachment.name}
                className="object-cover rounded-lg w-full h-32"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg mb-2">
              <FileIcon className={`h-12 w-12 ${iconColor}`} />
            </div>
          )}
          <div className="flex items-center">
            <FileIcon className={`h-4 w-4 ${iconColor} mr-2`} />
            <span className="text-sm text-gray-600 truncate">
              {attachment.name}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formatFileSize(attachment.size)}
          </p>
        </a>
        {comment && comment.user?._id === localStorage.getItem('userId') && (
          <button
            onClick={() => handleRemoveAttachment(comment._id, index)}
            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Remove attachment"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  const handleTaskFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setTaskFiles(files);
  };

  const handleAddTaskFiles = async (e) => {
    e.preventDefault();
    setUploadingTaskFiles(true);
    try {
      let attachments = [];
      if (taskFiles.length > 0) {
        try {
          const uploadedFiles = await uploadFiles(taskFiles);
          console.log('Uploaded files:', uploadedFiles);
          
          attachments = uploadedFiles.map(file => ({
            name: file.originalname,
            url: file.url,
            type: file.mimetype,
            size: file.size,
          }));
          
          console.log('Processed attachments:', attachments);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          setError('Failed to upload files: ' + uploadError.message);
          setUploadingTaskFiles(false);
          return;
        }
      } else {
        setError('Please select at least one file to upload');
        setUploadingTaskFiles(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Sending attachments to server:', attachments);
      
      const response = await axios.post(`http://localhost:5000/api/tasks/${id}/attachments`, {
        attachments,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Server response:', response.data);
      
      setTask(response.data);
      setTaskFiles([]);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error adding files to task:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add files to task. Please try again.';
      const errorDetails = err.response?.data?.error || err.message;
      setError(`${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`);
    } finally {
      setUploadingTaskFiles(false);
    }
  };

  const handleRemoveTaskAttachment = async (attachmentIndex) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call the API to remove the attachment
      const response = await axios.delete(
        `http://localhost:5000/api/tasks/${id}/attachments/${attachmentIndex}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update the local state
      setTask(response.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error removing attachment:', err);
      setError('Failed to remove attachment. Please try again.');
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setNewComment(comment.text);
    setSelectedFiles([]);
    setIsEditCommentModalOpen(true);
  };

  const handleUpdateComment = async (e) => {
    e.preventDefault();
    if (!editingComment) return;

    setUploading(true);
    try {
      let attachments = [...editingComment.attachments];
      if (selectedFiles.length > 0) {
        try {
          const uploadedFiles = await uploadFiles(selectedFiles);
          attachments = [...attachments, ...uploadedFiles.map(file => ({
            name: file.originalname,
            url: file.url,
            type: file.mimetype,
            size: file.size,
          }))];
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          setError('Failed to upload files: ' + uploadError.message);
          setUploading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(
        `http://localhost:5000/api/tasks/${id}/comments/${editingComment._id}`,
        {
          text: newComment.trim(),
          attachments,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setTask(response.data);
      setIsEditCommentModalOpen(false);
      setEditingComment(null);
      setNewComment('');
      setSelectedFiles([]);
      setError('');
    } catch (err) {
      console.error('Error updating comment:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update comment. Please try again.';
      const errorDetails = err.response?.data?.error || err.message;
      setError(`${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCommentClick = (comment) => {
    setDeletingComment(comment);
    setIsDeleteCommentModalOpen(true);
  };

  const handleDeleteComment = async () => {
    if (!deletingComment) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.delete(
        `http://localhost:5000/api/tasks/${id}/comments/${deletingComment._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setTask(response.data);
      setIsDeleteCommentModalOpen(false);
      setDeletingComment(null);
      setError('');
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Task not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{task.title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{task.description}</p>
          </div>
          <div className="flex space-x-3">
            {task.project && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Assign
              </button>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            {task.project ? (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Project</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link
                    to={`/projects/${task.project._id}`}
                    className="text-primary-600 hover:text-primary-500"
                  >
                    {task.project.name}
                  </Link>
                </dd>
              </div>
            ) : (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Task Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Personal Task
                  </span>
                </dd>
              </div>
            )}
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{task.status}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{task.priority}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.assignedTo?.name || 'Not assigned'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">{task.createdBy?.name}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Comments</h2>
          <button
            onClick={() => setIsCommentModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
            Add Comment
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {task.comments?.map((comment, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                      {comment.user?.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{comment.user?.name}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                        {comment.user?._id === localStorage.getItem('userId') && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditComment(comment)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCommentClick(comment)}
                              className="text-red-400 hover:text-red-500"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{comment.text}</p>
                    
                    {comment.attachments?.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {comment.attachments.map((attachment, index) => 
                            renderAttachment(attachment, comment, index)
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Attachments</h3>
        <div className="mt-2">
          <form onSubmit={handleAddTaskFiles} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Add Files
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="task-file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="task-file-upload"
                        name="task-file-upload"
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={handleTaskFileSelect}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, PDF, DOC up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {taskFiles.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-700">Selected files:</h4>
                <ul className="mt-2 divide-y divide-gray-200">
                  {taskFiles.map((file, index) => (
                    <li key={index} className="py-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <PaperClipIcon className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTaskFiles(files => files.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {taskFiles.length > 0 && (
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={uploadingTaskFiles}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm disabled:opacity-50"
                >
                  {uploadingTaskFiles ? 'Uploading...' : 'Upload Files'}
                </button>
              </div>
            )}
          </form>

          {task.attachments && task.attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Task Attachments:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {task.attachments.map((attachment, index) => {
                  const FileIcon = getFileIcon(attachment.type);
                  const isImage = attachment.type.startsWith('image/');
                  
                  return (
                    <div key={index} className="relative group">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        {isImage ? (
                          <div className="aspect-w-16 aspect-h-9 mb-2">
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="object-cover rounded-lg w-full h-32"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg mb-2">
                            <FileIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="flex items-center">
                          <FileIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600 truncate">
                            {attachment.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      </a>
                      <button
                        onClick={() => handleRemoveTaskAttachment(index)}
                        className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Remove attachment"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Edit Task
                  </Dialog.Title>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateTask}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Task Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={editTask.title}
                        onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={editTask.description}
                        onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                        Project (Optional)
                      </label>
                      <select
                        id="project"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={editTask.project || ''}
                        onChange={(e) => setEditTask({ ...editTask, project: e.target.value || null })}
                      >
                        <option value="">No Project</option>
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        id="status"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={editTask.status}
                        onChange={(e) => setEditTask({ ...editTask, status: e.target.value })}
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        id="priority"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={editTask.priority}
                        onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
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
                        value={editTask.dueDate}
                        onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                    >
                      Update Task
                    </button>
                  </div>
                </form>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Add Comment Modal */}
      <Transition appear show={isCommentModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={() => setIsCommentModalOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Add Comment
                  </Dialog.Title>
                  <button
                    onClick={() => setIsCommentModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleAddComment}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                        Comment
                      </label>
                      <textarea
                        id="comment"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Enter your comment..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Attachments
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                            >
                              <span>Upload files</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                multiple
                                className="sr-only"
                                onChange={handleFileSelect}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF, PDF, DOC up to 10MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700">Selected files:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <div className="p-3 border rounded-lg">
                                <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg mb-2">
                                  <DocumentIcon className="h-12 w-12 text-gray-400" />
                                </div>
                                <div className="flex items-center">
                                  <DocumentIcon className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600 truncate">
                                    {file.name}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                                className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                title="Remove file"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={uploading || (!newComment.trim() && selectedFiles.length === 0)}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Add Comment'}
                    </button>
                  </div>
                </form>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Assign Task Modal */}
      <Transition.Root show={isAssignModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={() => setIsAssignModalOpen(false)}
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
                      Assign Task
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Select a team member to assign this task to:
                      </p>
                      <div className="mt-4 space-y-2">
                        {teamMembers.map((member) => (
                          <button
                            key={member._id}
                            onClick={() => handleAssigneeSelect(member)}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                              </div>
                              <div className="ml-3 text-left">
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                            </div>
                            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                    onClick={() => setIsAssignModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Confirm Assignment Modal */}
      <Transition.Root show={isConfirmAssignModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={() => setIsConfirmAssignModalOpen(false)}
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
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <UserCircleIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Confirm Assignment
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to assign this task to {selectedAssignee?.name}?
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleAssignTask}
                  >
                    Assign
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setIsConfirmAssignModalOpen(false)}
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

      {/* Edit Comment Modal */}
      <Transition.Root show={isEditCommentModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={() => setIsEditCommentModalOpen(false)}
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
                      Edit Comment
                    </Dialog.Title>
                    <div className="mt-2">
                      <form onSubmit={handleUpdateComment} className="space-y-4">
                        <div>
                          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                            Comment
                          </label>
                          <textarea
                            id="comment"
                            rows={3}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Enter your comment..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Attachments
                          </label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                                >
                                  <span>Upload files</span>
                                  <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    multiple
                                    className="sr-only"
                                    onChange={handleFileSelect}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF, PDF, DOC up to 10MB
                              </p>
                            </div>
                          </div>
                        </div>

                        {selectedFiles.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium text-gray-700">Selected files:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                              {selectedFiles.map((file, index) => (
                                <div key={index} className="relative group">
                                  <div className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg mb-2">
                                      <DocumentIcon className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <div className="flex items-center">
                                      <DocumentIcon className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm text-gray-600 truncate">
                                        {file.name}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    title="Remove file"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {editingComment?.attachments?.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium text-gray-700">Existing attachments:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                              {editingComment.attachments.map((attachment, index) => 
                                renderAttachment(attachment, editingComment, index)
                              )}
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm"
                    onClick={handleUpdateComment}
                    disabled={uploading}
                  >
                    {uploading ? 'Updating...' : 'Update Comment'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setIsEditCommentModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Delete Comment Confirmation Modal */}
      <Transition.Root show={isDeleteCommentModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={() => setIsDeleteCommentModalOpen(false)}
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
                      Delete Comment
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this comment? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDeleteComment}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setIsDeleteCommentModalOpen(false)}
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

export default TaskDetails; 