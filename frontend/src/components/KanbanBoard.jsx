import { useState, useEffect } from 'react';
import axios from 'axios';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { TodoCard } from './TodoCard';
import { TodoColumn } from './TodoColumn';

const KanbanBoard = ({ profile }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', status: 'todo' });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeId, setActiveId] = useState(null);
  
  // Set up sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  useEffect(() => {
    // Fetch todos when profile changes
    if (profile?.id) {
      fetchTodos();
    }
  }, [profile]);
  
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/profiles/${profile.id}/todos/`);
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddTodo = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:8000/api/profiles/${profile.id}/todos/`, 
        newTodo
      );
      setTodos([...todos, response.data]);
      setNewTodo({ title: '', description: '', status: 'todo' });
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };
  
  const handleDeleteTodo = async (todoId) => {
    try {
      await axios.delete(`http://localhost:8000/api/profiles/${profile.id}/todos/${todoId}/`);
      setTodos(todos.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };
  
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };
  
  const handleDragEnd = async (event) => {
    setActiveId(null);
    setIsDraggingOver(false);
    
    const { active, over } = event;
    
    // If dragged to the trash can
    if (over && over.id === 'trash') {
      handleDeleteTodo(active.id);
      return;
    }
    
    if (active.id !== over.id) {
      // Find the indices of the dragged item and the drop target
      const oldIndex = todos.findIndex(todo => todo.id === active.id);
      const newIndex = todos.findIndex(todo => todo.id === over.id);
      
      // Update the order in the UI
      const newTodos = arrayMove(todos, oldIndex, newIndex);
      setTodos(newTodos);
      
      // Update the order in the backend
      try {
        // For simplicity, we can update the order of items by their position in the array
        await Promise.all(newTodos.map(async (todo, index) => {
          await axios.patch(
            `http://localhost:8000/api/profiles/${profile.id}/todos/${todo.id}/`,
            { order: index }
          );
        }));
      } catch (error) {
        console.error('Error updating todo order:', error);
        // Revert to the previous state if there's an error
        fetchTodos();
      }
    }
  };
  
  const handleDragOver = (event) => {
    const { over } = event;
    setIsDraggingOver(over && over.id === 'trash');
  };
  
  const handleStatusChange = async (todoId, newStatus) => {
    try {
      const todo = todos.find(todo => todo.id === todoId);
      if (todo) {
        const updatedTodo = { ...todo, status: newStatus };
        await axios.patch(
          `http://localhost:8000/api/profiles/${profile.id}/todos/${todoId}/`,
          { status: newStatus }
        );
        
        setTodos(todos.map(t => t.id === todoId ? { ...t, status: newStatus } : t));
      }
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };
  
  // Group todos by status
  const todosByStatus = {
    todo: todos.filter(todo => todo.status === 'todo'),
    in_progress: todos.filter(todo => todo.status === 'in_progress'),
    done: todos.filter(todo => todo.status === 'done')
  };
  
  if (loading) {
    return <div className="text-center py-8">Loading todos...</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
      <h2 className="text-2xl font-semibold mb-4">Medical Todos</h2>
      
      {/* Add Todo Form */}
      <form onSubmit={handleAddTodo} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Add new todo"
          value={newTodo.title}
          onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
          className="flex-1 p-2 border border-gray-300 rounded-lg"
          required
        />
        <select
          value={newTodo.status}
          onChange={(e) => setNewTodo({ ...newTodo, status: e.target.value })}
          className="p-2 border border-gray-300 rounded-lg"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Add
        </button>
      </form>
      
      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <TodoColumn title="To Do" status="todo" todos={todosByStatus.todo} onStatusChange={handleStatusChange} onDelete={handleDeleteTodo} />
          
          {/* In Progress Column */}
          <TodoColumn title="In Progress" status="in_progress" todos={todosByStatus.in_progress} onStatusChange={handleStatusChange} onDelete={handleDeleteTodo} />
          
          {/* Done Column */}
          <TodoColumn title="Done" status="done" todos={todosByStatus.done} onStatusChange={handleStatusChange} onDelete={handleDeleteTodo} />
        </div>
        
        {/* Trash can */}
        <div 
          id="trash" 
          className={`mt-8 p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
            isDraggingOver ? 'bg-red-100 border-red-500' : 'bg-gray-100 border-gray-300'
          }`}
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mr-2 ${isDraggingOver ? 'text-red-500' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className={`font-medium ${isDraggingOver ? 'text-red-500' : 'text-gray-600'}`}>
              {isDraggingOver ? 'Release to delete' : 'Drag here to delete'}
            </span>
          </div>
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanBoard; 