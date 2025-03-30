import React, { useState, useCallback } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import KanbanTask from './KanbanTask';

function KanbanColumn({ id, title, tasks, onAddTask, onEditTask }) {
    const { setNodeRef } = useDroppable({
        id: id, // ID for the droppable area (e.g., 'todo', 'inprogress')
    });

    const [showInput, setShowInput] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    // Use useCallback to prevent unnecessary rerenders
    const handleAddClick = useCallback(() => {
        console.log('Add Task button clicked');
        setShowInput(true);
    }, []);

    const handleSaveClick = useCallback(() => {
        if (newTaskTitle.trim()) {
            onAddTask(id, { title: newTaskTitle }); // Pass column id (status) and task data
            setNewTaskTitle('');
            setShowInput(false);
        } else {
            // Optional: Add validation feedback
            console.log("Task title cannot be empty");
        }
    }, [newTaskTitle, onAddTask, id]);

    const handleCancelClick = useCallback(() => {
        setNewTaskTitle('');
        setShowInput(false);
    }, []);

    // Handle keyboard events for input field
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            handleSaveClick();
        } else if (e.key === 'Escape') {
            handleCancelClick();
        }
    }, [handleSaveClick, handleCancelClick]);

    return (
        <div ref={setNodeRef} className="kanban-column flex-1 bg-gray-100 p-2 rounded min-h-[200px] flex flex-col">
            <h4 className="font-semibold mb-2 text-center text-sm flex-shrink-0">{title}</h4>
            <SortableContext 
                id={id} // Important: This links the sortable context to the droppable id
                items={tasks.map(task => task.id)} 
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-2 flex-grow pr-1">
                    {tasks.map(task => (
                        <KanbanTask 
                            key={task.id} 
                            task={task} 
                            onEditClick={onEditTask} 
                        />
                    ))}
                    {tasks.length === 0 && !showInput && (
                         <div className="text-center text-xs text-gray-500 italic pt-4">Drop tasks here</div>
                    )}
                </div>
            </SortableContext>
            
            {/* Add Task Section (Only for 'todo' column for now) */}
            {id === 'todo' && (
                 <div className="mt-2 pt-2 border-t border-gray-300 flex-shrink-0 relative z-10">
                    {showInput ? (
                        <div className="space-y-1">
                            <input 
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="New task title..."
                                className="w-full p-1 border rounded text-sm"
                                autoFocus
                            />
                            <div className="flex justify-end space-x-1">
                                <button 
                                    onClick={handleSaveClick}
                                    className="px-2 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                                >
                                    Save
                                </button>
                                <button 
                                    onClick={handleCancelClick}
                                    className="px-2 py-0.5 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={handleAddClick}
                            className="w-full text-left text-sm text-blue-600 hover:text-blue-800 p-1 transition-colors duration-200 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            + Add Task
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default React.memo(KanbanColumn); // Use memo to prevent unnecessary rerenders 