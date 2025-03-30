import React, { useState, useEffect } from 'react';

function EditTaskModal({ task, isOpen, onClose, onSave }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Update state when the task prop changes (when a different task is selected)
    useEffect(() => {
        if (task) {
            setTitle(task.title || '');
            setDescription(task.description || '');
        } else {
            // Reset fields if task is null (modal closed or no task)
            setTitle('');
            setDescription('');
        }
    }, [task]);

    const handleSave = () => {
        if (title.trim()) { // Basic validation: title is required
            onSave(task.id, { title, description });
        } else {
             console.log("Title cannot be empty"); // Or show inline error
        }
    };

    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Task</h2>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="task-title">
                        Title
                    </label>
                    <input
                        type="text"
                        id="task-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="task-description">
                        Description (Optional)
                    </label>
                    <textarea
                        id="task-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="3"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose} // Use the passed onClose function
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditTaskModal; 