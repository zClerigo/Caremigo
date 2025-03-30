import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    DndContext, 
    closestCorners, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors, 
    DragOverlay // Optional: For visual drag overlay
} from '@dnd-kit/core';
import { 
    SortableContext, 
    verticalListSortingStrategy, 
    arrayMove // Import arrayMove
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn'; // Assuming KanbanColumn and KanbanTask components exist
import KanbanTask from './KanbanTask'; // Import KanbanTask if using DragOverlay
import EditTaskModal from './EditTaskModal'; // Import the modal

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const COLUMNS = {
    todo: 'To Do',
    inprogress: 'In Progress',
    done: 'Done'
};

function ProfileKanbanBoard({ profile }) {
    const [tasks, setTasks] = useState({}); // Tasks organized by status: { todo: [], inprogress: [], done: [] }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTask, setActiveTask] = useState(null); // For DragOverlay
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Modal state
    const [editingTask, setEditingTask] = useState(null); // Task to edit
    const [records, setRecords] = useState([]); // Medical records for this profile

    // Fetch tasks and records when profile changes
    useEffect(() => {
        setLoading(true);
        
        // Fetch tasks
        const fetchTasks = axios.get(`${API_URL}/api/profiles/${profile.id}/tasks/`);
        
        // Fetch medical records
        const fetchRecords = axios.get(`${API_URL}/api/profiles/${profile.id}/records/`);
        
        // Use Promise.all to fetch both in parallel
        Promise.all([fetchTasks, fetchRecords])
            .then(([tasksResponse, recordsResponse]) => {
                // Process tasks
                const organizedTasks = Object.keys(COLUMNS).reduce((acc, status) => {
                    acc[status] = tasksResponse.data.filter(task => task.status === status).sort((a, b) => a.order - b.order);
                    return acc;
                }, {});
                setTasks(organizedTasks);
                
                // Process records
                setRecords(recordsResponse.data);
                
                setLoading(false);
            })
            .catch(err => {
                console.error(`Error fetching data for profile ${profile.id}:`, err);
                setError('Failed to load data.');
                setLoading(false);
            });
    }, [profile.id]);
    
    // Create tasks from records
    useEffect(() => {
        if (records.length > 0 && !loading) {
            createTasksFromRecords();
        }
    }, [records, loading]);
    
    // Check if medical records exist that don't have corresponding tasks and create them
    const createTasksFromRecords = async () => {
        if (!records.length) return;
        
        // Get all task titles for comparison (case insensitive)
        const existingTaskTitles = [];
        for (const status in tasks) {
            if (tasks[status]) {
                existingTaskTitles.push(...tasks[status].map(task => task.title.toLowerCase()));
            }
        }
        
        console.log("Existing task titles:", existingTaskTitles);
        
        // Filter records that don't have a corresponding task
        const recordsWithoutTasks = records.filter(
            record => !existingTaskTitles.includes(record.title.toLowerCase())
        );
        
        console.log("Records without tasks:", recordsWithoutTasks);
        
        if (recordsWithoutTasks.length === 0) return;
        
        // Create tasks for records without tasks
        const createdTasks = [];
        
        for (const record of recordsWithoutTasks) {
            try {
                // Create a new task
                const response = await axios.post(`${API_URL}/api/profiles/${profile.id}/tasks/`, {
                    title: record.title,
                    description: `Follow up on medical record from ${new Date(record.date).toLocaleDateString()}`,
                    status: 'todo'
                });
                
                console.log("Created task from record:", response.data);
                createdTasks.push(response.data);
            } catch (err) {
                console.error(`Error creating task for record ${record.id}:`, err);
            }
        }
        
        // Update tasks state if we created any new tasks
        if (createdTasks.length > 0) {
            setTasks(prev => {
                const newTasks = {...prev};
                newTasks['todo'] = [...(newTasks['todo'] || []), ...createdTasks];
                return newTasks;
            });
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    const findTask = (taskId) => {
        for (const status in tasks) {
            const task = tasks[status].find(t => t.id === taskId);
            if (task) {
                return { task, status };
            }
        }
        return null;
    };

    const calculateNewOrder = (items, overIndex) => {
        // Basic strategy: assign order based on index
        // More robust: fractional indexing or average between neighbors
        // For now, we'll just update the moved item's order based on its new index
        // The backend might need to handle potential collisions or re-ordering siblings
        return overIndex; // Simplistic - backend should handle collisions/reordering based on this intent
    };

    const handleDragStart = (event) => {
        const { active } = event;
        const result = findTask(active.id);
        if(result) {
             setActiveTask(result.task);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveTask(null); // Clear overlay task

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return; // Dropped on itself

        const activeTaskData = findTask(activeId);
        if (!activeTaskData) return;

        const { task: draggedTask, status: sourceColumn } = activeTaskData;

        // Determine the target column and target task (if dropped onto a task)
        let targetColumn = over.data.current?.sortable?.containerId; 
        let overTaskIndex = -1;
        
        if(targetColumn) { // Dropped onto a task within a SortableContext
             overTaskIndex = tasks[targetColumn]?.findIndex(t => t.id === overId) ?? -1;
        } else if (tasks[overId]) { // Dropped directly onto a column (useDroppable id)
            targetColumn = overId;
            overTaskIndex = tasks[targetColumn].length; // Append to end if dropped on column directly
        } else { 
             // Dropped somewhere unexpected, potentially over an item not in a recognized container
             // Check if overId is a task id in any column
             const overTaskData = findTask(overId);
             if(overTaskData) {
                 targetColumn = overTaskData.status;
                 overTaskIndex = tasks[targetColumn]?.findIndex(t => t.id === overId) ?? -1;
             } else {
                 console.warn("Cannot determine drop target.");
                 return;
             }
        }

        const newStatus = targetColumn;

        // Optimistic UI Update
        let newTasksState = { ...tasks };
        let newOrder = 0;

        // Remove task from source column
        newTasksState[sourceColumn] = newTasksState[sourceColumn].filter(t => t.id !== activeId);

        if (sourceColumn === targetColumn) {
            // --- Reordering within the same column ---
            const originalIndex = tasks[sourceColumn].findIndex(t => t.id === activeId);
            // Ensure target index is valid
             const targetIndex = overTaskIndex !== -1 ? overTaskIndex : tasks[targetColumn].length;
            
            newTasksState[targetColumn] = arrayMove(tasks[targetColumn], originalIndex, targetIndex);
            // Recalculate order based on new index in the updated array
            newOrder = calculateNewOrder(newTasksState[targetColumn], targetIndex);

        } else {
            // --- Moving to a different column ---
             // Ensure target index is valid for insertion
             const targetIndex = overTaskIndex !== -1 ? overTaskIndex : (newTasksState[targetColumn]?.length || 0);
             if (!newTasksState[targetColumn]) newTasksState[targetColumn] = [];

             // Create updated task data for insertion
             const taskToInsert = { ...draggedTask, status: newStatus };
             
             // Insert into target column at the determined index
             newTasksState[targetColumn].splice(targetIndex, 0, taskToInsert);
             
            // Recalculate order based on new index in the updated array
            newOrder = calculateNewOrder(newTasksState[targetColumn], targetIndex);
        }

        setTasks(newTasksState);
        setError(null);

        // Log the data being sent
        console.log(`Updating task ${activeId}:`, { status: newStatus, order: newOrder });

        // Update Backend
        axios.patch(`${API_URL}/api/tasks/${activeId}/`, { status: newStatus, order: newOrder })
            .then(response => {
                console.log(`Task ${activeId} updated successfully`, response.data);
                // Optional: Update state with response data for consistency, especially if backend recalculates order
                // setTasks(prev => updateStateWithBackendResponse(prev, response.data)); 
            })
            .catch(err => {
                console.error(`Error updating task ${activeId}:`, err);
                setError('Failed to update task. Please refresh.');
                // Revert optimistic update: Refetch or restore previous state snapshot
                // Simple revert (might lose other changes): refetchTasks();
            });
    };

    const handleAddTask = (columnId, newTaskData) => {
        // Assume new tasks always go to 'todo' and backend assigns order, or we could calculate front-end estimate
        const newTaskPayload = {
            ...newTaskData, // Should contain { title: '... '}
            status: columnId, // Will be 'todo' since we only add there for now
            // order: calculate next order if needed, backend handles it now
        };

        // Optimistic UI Update
        const tempId = `temp-${Date.now()}`; // Temporary ID for the UI
        const optimisticTask = {
            ...newTaskPayload,
            id: tempId, 
            profile: profile.id, // Add profile id for consistency
            description: '', // Default values
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            order: (tasks[columnId]?.length || 0) // Temporary order for UI
        };

        setTasks(prev => ({
            ...prev,
            [columnId]: [...(prev[columnId] || []), optimisticTask]
        }));
        setError(null); // Clear previous errors

        // API Call
        axios.post(`${API_URL}/api/profiles/${profile.id}/tasks/`, newTaskPayload)
            .then(response => {
                console.log("Task created successfully:", response.data);
                // Replace temporary task with real task from backend response
                setTasks(prev => ({
                    ...prev,
                    [columnId]: prev[columnId].map(task => 
                        task.id === tempId ? response.data : task
                    )
                }));
            })
            .catch(err => {
                // Log the full error object for more details
                console.error(`Error creating task for profile ${profile.id}:`, err);
                if (err.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error('Backend Response Data:', err.response.data);
                    console.error('Backend Response Status:', err.response.status);
                    console.error('Backend Response Headers:', err.response.headers);
                } else if (err.request) {
                    // The request was made but no response was received
                    console.error('No response received:', err.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Error setting up request:', err.message);
                }
                setError('Failed to create task. Please try again.');
                // Revert optimistic update
                setTasks(prev => ({
                    ...prev,
                    [columnId]: prev[columnId].filter(task => task.id !== tempId)
                }));
            });
    };

    // --- Modal Handling ---
    const handleOpenEditModal = (taskToEdit) => {
        setEditingTask(taskToEdit);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingTask(null);
    };

    // --- Handle Update Task ---
    const handleUpdateTask = (taskId, updatedData) => {
        const currentTaskData = findTask(taskId);
        if (!currentTaskData) return;
        const { status: currentStatus } = currentTaskData;

        // Optimistic UI Update
        const updatedTask = { ...editingTask, ...updatedData };
        setTasks(prev => ({
            ...prev,
            [currentStatus]: prev[currentStatus].map(task => 
                task.id === taskId ? updatedTask : task
            )
        }));
        
        handleCloseEditModal(); // Close modal immediately
        setError(null);

        // API Call
        axios.patch(`${API_URL}/api/tasks/${taskId}/`, updatedData)
            .then(response => {
                console.log(`Task ${taskId} updated successfully:`, response.data);
                // Update state again with potentially more complete data from backend if needed
                setTasks(prev => ({
                    ...prev,
                    [currentStatus]: prev[currentStatus].map(task => 
                        task.id === taskId ? response.data : task
                    )
                }));
            })
            .catch(err => {
                console.error(`Error updating task ${taskId}:`, err);
                setError('Failed to save task changes. Please try again.');
                // Revert optimistic update
                setTasks(prev => ({
                    ...prev,
                    [currentStatus]: prev[currentStatus].map(task => 
                        task.id === taskId ? editingTask : task // Restore original editingTask data
                    )
                }));
            });
    };

    if (loading) return <div className="text-center p-4">Loading data for {profile.name}...</div>;
    if (error) return <div className="text-center p-4 text-red-500">{error}</div>;
    if (!tasks || Object.values(tasks).every(list => list.length === 0)) return (
        <div className="profile-board bg-gray-100 p-4 rounded-lg shadow-lg min-h-[200px]">
            <h2 className="text-xl font-source-sans-pro mb-4">{profile.name}</h2>
            <p className="text-gray-500">No tasks found for this profile.</p>
        </div>
    );

    // Function to get all task IDs for SortableContext
    const getAllTaskIds = () => {
        let ids = [];
        Object.values(tasks).forEach(taskList => {
            if(taskList) {
                ids = ids.concat(taskList.map(task => task.id));
            }
        });
        return ids;
    };

    return (
        <div className="profile-board bg-gray-100 p-4 rounded-lg shadow-lg min-h-[300px]">
            <h2 className="text-xl font-bold font-source-sans-pro mb-4 text-gray-800">{profile.name}'s Board</h2>
            <DndContext 
                sensors={sensors} 
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd} 
            >
                {/* Pass all task IDs from all columns */}
                <SortableContext items={getAllTaskIds()} strategy={verticalListSortingStrategy}>
                    <div className="kanban-columns grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(COLUMNS).map(([statusKey, statusValue]) => (
                            <KanbanColumn 
                                key={statusKey} 
                                id={statusKey} 
                                title={statusValue}
                                tasks={tasks[statusKey] || []} 
                                onAddTask={handleAddTask}
                                onEditTask={handleOpenEditModal} // Pass edit handler
                            />
                        ))}
                    </div>
                </SortableContext>
                 {/* Optional Drag Overlay */}
                 <DragOverlay>
                    {activeTask ? <KanbanTask task={activeTask} /> : null}
                </DragOverlay>
            </DndContext>
             {/* Edit Task Modal */}
             <EditTaskModal 
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                task={editingTask}
                onSave={handleUpdateTask}
             />
        </div>
    );
}

export default ProfileKanbanBoard; 